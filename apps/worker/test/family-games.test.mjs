import { URL } from "node:url"
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { createApp } from "../src/app.ts"
import { familyGameService } from "../src/modules/rooms/application/family-service.ts"
import { d1FamilyGames } from "../src/modules/rooms/infrastructure/d1-family-games.ts"

function setup() {
  const db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys=ON")
  const migrations = new URL("../migrations/", import.meta.url)
  for (const file of readdirSync(migrations)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    db.exec(readFileSync(new URL(file, migrations), "utf8"))
  const DB = {
    prepare(sql) {
      let args = []
      return {
        bind(...values) {
          args = values
          return this
        },
        execute() {
          return {
            meta: { changes: Number(db.prepare(sql).run(...args).changes) },
          }
        },
        async run() {
          return this.execute()
        },
        async first() {
          return db.prepare(sql).get(...args) || null
        },
        async all() {
          return { results: db.prepare(sql).all(...args) }
        },
      }
    },
    async batch(statements) {
      db.exec("BEGIN")
      try {
        const results = statements.map((s) => s.execute())
        db.exec("COMMIT")
        return results
      } catch (e) {
        db.exec("ROLLBACK")
        throw e
      }
    },
  }
  for (const [user, role] of [
    ["parent", "parent"],
    ["other", "parent"],
    ["teacher", "teacher"],
  ]) {
    db.prepare(
      "INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal',?,?)"
    ).run("user:" + user, user, user)
    db.prepare(
      "INSERT INTO account_profiles(tenant_id,user_id,role) VALUES(?,?,?)"
    ).run("user:" + user, user, role)
  }
  const actor = { tenantId: "user:parent", userId: "parent" }
  const app = createApp(async (c) => {
    const id = c.req.header("x-test-user")
    return id
      ? {
          sessionId: "test",
          user: {
            id,
            email: id + "@example.test",
            emailVerified: true,
            firstName: id,
            lastName: null,
            profilePictureUrl: null,
          },
        }
      : null
  })
  const request = (
    path = "",
    { method = "GET", data, user = "parent", csrf = true } = {}
  ) =>
    app.request(
      "http://localhost:5173/api" + path,
      {
        method,
        headers: {
          "x-test-user": user,
          Origin: "http://localhost:5173",
          "Content-Type": "application/json",
          ...(csrf ? { "X-Amautai-Request": "1" } : {}),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      },
      { DB, APP_ORIGINS: "http://localhost:5173" }
    )
  const service = familyGameService(d1FamilyGames(DB), randomUUID)
  return { db, actor, service, request }
}
async function child(f, name = "Sol", region = "coast") {
  const r = await f.request("/family-games/children", {
    method: "POST",
    data: { name, region },
  })
  assert.equal(r.status, 200)
  return (await (await f.request("/family-games")).json()).children.find(
    (c) => c.name === name.trim()
  )
}
async function game(f, c, kind, requestId = randomUUID()) {
  const r = await f.request("/family-games", {
    method: "POST",
    data: { childId: c.id, kind, requestId },
  })
  assert.equal(r.status, 200)
  return (await r.json()).game
}
test("family endpoints require a parent, authenticated request and CSRF mutation header", async () => {
  const f = setup()
  for (const user of ["teacher", "other"]) {
    const r = await f.request("/family-games", { user })
    assert.equal(r.status, user === "teacher" ? 403 : 200)
  }
  assert.equal((await f.request("/family-games", { user: "" })).status, 401)
  assert.equal(
    (
      await f.request("/family-games/children", {
        method: "POST",
        data: { name: "Sol", region: "coast" },
        csrf: false,
      })
    ).status,
    403
  )
  assert.equal(
    (
      await f.request("/game-rooms", {
        method: "POST",
        data: { kind: "builder", region: "coast" },
      })
    ).status,
    409
  )
})
test("aliases are normalized and unique per parent; foreign children cannot be edited, deleted or played", async () => {
  const f = setup(),
    c = await child(f, "Sol")
  const duplicate = await f.request("/family-games/children", {
    method: "POST",
    data: { name: "  SOL  ", region: "jungle" },
  })
  assert.equal(duplicate.status, 409)
  assert.equal((await duplicate.json()).error, "duplicate_child")
  assert.equal(
    (
      await f.request("/family-games/children", {
        method: "POST",
        user: "other",
        data: { name: "Sol", region: "coast" },
      })
    ).status,
    200
  )
  assert.equal(
    (
      await f.request("/family-games", {
        user: "other",
        method: "POST",
        data: { childId: c.id, kind: "builder", requestId: randomUUID() },
      })
    ).status,
    404
  )
  assert.equal(
    (
      await f.request("/family-games/children/" + c.id, {
        user: "other",
        method: "PUT",
        data: { name: "No", region: "coast", version: 1 },
      })
    ).status,
    404
  )
  assert.equal(
    (
      await f.request("/family-games/children/" + c.id, {
        user: "other",
        method: "DELETE",
      })
    ).status,
    404
  )
  const otherTenant = { tenantId: "user:other", userId: "parent" }
  await assert.rejects(
    f.service.create(otherTenant, c.id, "builder", randomUUID()),
    (e) => e.code === "child_not_found"
  )
})
test("all five teacher engines start in saved personal practice sessions with the child's context", async () => {
  const f = setup(),
    c = await child(f, "Luna", "jungle")
  for (const kind of ["cargo", "market", "nursery", "fair", "builder"]) {
    const g = await game(f, c, kind)
    assert.equal(g.region, "jungle")
    const base = "/game-rooms/" + g.id + "/participants/" + g.participantId
    const r = await f.request(
      base + (kind === "cargo" ? "/start" : "/" + kind + "/start"),
      { method: "POST" }
    )
    assert.equal(r.status, 200)
    const run = await r.json()
    assert.equal(run.room.mode, "practice")
    assert.equal(run.room.familyChildId, c.id)
    assert.equal(run.participant.name, "Luna")
    assert.equal(run.participant.score, 0)
    assert.equal(
      (
        await f.request(
          base + (kind === "cargo" ? "/start" : "/" + kind + "/start"),
          { method: "POST", user: "other" }
        )
      ).status,
      404
    )
  }
  assert.equal(
    (await (await f.request("/family-games")).json()).games.length,
    5
  )
  assert.deepEqual((await (await f.request("/game-rooms")).json()).rooms, [])
})
test("creation is idempotent, rejects configuration/score injection and isolates siblings", async () => {
  const f = setup(),
    a = await child(f, "Sol"),
    b = await child(f, "Luna", "highlands"),
    id = randomUUID()
  const first = await game(f, a, "builder", id),
    second = await game(f, a, "builder", id)
  assert.deepEqual(first, second)
  assert.equal(
    (await (await f.request("/family-games")).json()).games.length,
    1
  )
  for (const extra of [
    { childId: b.id, kind: "builder" },
    { childId: a.id, kind: "fair" },
  ]) {
    assert.equal(
      (
        await f.request("/family-games", {
          method: "POST",
          data: { ...extra, requestId: id },
        })
      ).status,
      409
    )
  }
  for (const extra of [
    { kind: "data" },
    { score: 999 },
    { mode: "challenge" },
    { region: "jungle" },
  ]) {
    assert.equal(
      (
        await f.request("/family-games", {
          method: "POST",
          data: {
            childId: a.id,
            kind: "builder",
            requestId: randomUUID(),
            ...extra,
          },
        })
      ).status,
      400
    )
  }
  const g = await game(f, b, "builder")
  assert.equal(g.region, "highlands")
  assert.equal(g.score, 0)
  const add = await f.request("/game-rooms/" + first.id + "/participants", {
    method: "POST",
    data: { name: "Extra" },
  })
  assert.equal(add.status, 409)
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM game_participants WHERE room_id=?")
      .get(first.id).n,
    1
  )
})
test("real engine points, repeated answer, loss and reload remain authoritative in family history", async () => {
  const f = setup(),
    c = await child(f),
    g = await game(f, c, "builder")
  const base =
    "/game-rooms/" + g.id + "/participants/" + g.participantId + "/builder"
  let run = await (await f.request(base + "/start", { method: "POST" })).json()
  for (let i = 0; i < 3; i++) {
    const input = {
      version: run.participant.version,
      shape: run.task.targets[run.task.cursor],
      rotation: 0,
    }
    const next = await f.request(base + "/answer", {
      method: "POST",
      data: input,
    })
    assert.equal(next.status, 200)
    run = await next.json()
    const replay = await (
      await f.request(base + "/answer", { method: "POST", data: input })
    ).json()
    assert.equal(replay.participant.version, run.participant.version)
  }
  assert.equal(run.participant.score, 100)
  for (let i = 0; i < 3; i++) {
    const shape = run.task.pieces.find(
      (p) => p.shape !== run.task.targets[run.task.cursor]
    ).shape
    run = await (
      await f.request(base + "/answer", {
        method: "POST",
        data: { version: run.participant.version, shape, rotation: 0 },
      })
    ).json()
  }
  assert.equal(run.participant.score, 40)
  assert.equal(run.participant.mistakes, 3)
  const history = (await (await f.request("/family-games")).json()).games[0]
  assert.equal(history.score, 40)
  assert.equal(history.solved, 1)
  assert.equal(history.mistakes, 3)
  const reload = await (
    await f.request(base + "/start", { method: "POST" })
  ).json()
  assert.equal(reload.participant.score, 40)
  assert.equal(reload.participant.mistakes, 3)
})
test("editing a child is versioned; existing regions and alias snapshots stay intact; deletion cascades only its games", async () => {
  const f = setup(),
    a = await child(f, "Sol"),
    b = await child(f, "Luna"),
    old = await game(f, a, "builder"),
    keep = await game(f, b, "market")
  const path = "/family-games/children/" + a.id
  const input = { name: "Solecito", region: "highlands", version: a.version }
  assert.equal(
    (await f.request(path, { method: "PUT", data: input })).status,
    200
  )
  assert.equal(
    (await f.request(path, { method: "PUT", data: input })).status,
    409
  )
  const updated = (
    await (await f.request("/family-games")).json()
  ).children.find((c) => c.id === a.id)
  assert.equal(updated.version, 2)
  const fresh = await game(f, updated, "builder")
  assert.equal(fresh.name, "Solecito")
  assert.equal(fresh.region, "highlands")
  const games = (await (await f.request("/family-games")).json()).games
  assert.equal(games.find((g) => g.id === old.id).name, "Sol")
  assert.equal(games.find((g) => g.id === old.id).region, "coast")
  assert.equal((await f.request(path, { method: "DELETE" })).status, 200)
  const remaining = await (await f.request("/family-games")).json()
  assert.deepEqual(
    remaining.children.map((c) => c.id),
    [b.id]
  )
  assert.deepEqual(
    remaining.games.map((g) => g.id),
    [keep.id]
  )
  assert.equal(
    f.db
      .prepare("SELECT COUNT(*) AS n FROM game_participants WHERE room_id=?")
      .get(old.id).n,
    0
  )
})
test("family size limit and invalid aliases are enforced on the server", async () => {
  const f = setup()
  for (let i = 0; i < 20; i++)
    await f.service.add(f.actor, "Hijo " + i, "coast")
  await assert.rejects(
    f.service.add(f.actor, "Extra", "coast"),
    (e) => e.code === "family_limit"
  )
  await assert.rejects(
    f.service.add(f.actor, "Mal\u200bnombre", "coast"),
    (e) => e.code === "invalid_room_input"
  )
})
