import { test } from "node:test"
import { URL } from "node:url"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { createApp } from "../src/app.ts"
import { d1Rooms } from "../src/modules/rooms/infrastructure/d1-rooms.ts"
import { roomService } from "../src/modules/rooms/application/service.ts"
import {
  isSolution,
  participantName,
} from "../src/modules/rooms/domain/cargo.ts"
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
        bind(...v) {
          args = v
          return this
        },
        async run() {
          return {
            meta: { changes: Number(db.prepare(sql).run(...args).changes) },
          }
        },
        async first() {
          return db.prepare(sql).get(...args) || null
        },
        async all() {
          return { results: db.prepare(sql).all(...args) }
        },
      }
    },
  }
  const actor = { tenantId: "user:alice", userId: "alice" }
  db.exec(
    "INSERT INTO tenants(id,kind,name,created_by) VALUES('user:alice','personal','Alice','alice'),('user:bob','personal','Bob','bob')"
  )
  db.prepare(
    "INSERT INTO teacher_profiles(tenant_id,user_id,data) VALUES(?,?,?)"
  ).run(actor.tenantId, actor.userId, JSON.stringify({ role: "teacher" }))
  const service = roomService(d1Rooms(DB), randomUUID)
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
  function request(
    path,
    { method = "GET", data, user = "alice", csrf = true } = {}
  ) {
    return app.request(
      "http://localhost:5173/api/game-rooms" + path,
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
  }
  return { db, service, actor, request }
}
test("equal total with wrong groups cannot pass multiplication", () => {
  assert.equal(isSolution(0, [4, 4, 4]), true)
  assert.equal(isSolution(0, [5, 5, 2]), false)
  assert.equal(isSolution(0, [6, 6]), false)
  assert.equal(isSolution(9, [4, 4, 4]), false)
  assert.deepEqual(participantName("  Juan   Pérez  "), {
    name: "Juan Pérez",
    key: "juan pérez",
  })
  assert.equal(participantName("Juan Pe\u0301rez").key, "juan pérez")
  assert.throws(() => participantName("Juan\u200bPérez"))
})
test("duplicate names blocked atomically, unique within each room, names preserved", async () => {
  const { service, actor } = setup()
  const room = await service.create(actor, "coast")
  const results = await Promise.allSettled([
    service.add(actor, room.id, "Juan   Pérez"),
    service.add(actor, room.id, "  JUAN PÉREZ "),
  ])
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1)
  assert.equal(
    results.find((r) => r.status === "rejected").reason.code,
    "duplicate_participant"
  )
  const other = await service.create(actor, "jungle")
  await service.add(actor, other.id, "Juan Pérez")
  assert.equal((await service.detail(actor, room.id)).participants.length, 1)
})
test("continuous score, wrong-catch penalties, loss, idempotency and explicit retry", async () => {
  const { service, actor } = setup()
  const room = await service.create(actor, "highlands")
  await service.add(actor, room.id, "Luis Quispe")
  const p = (await service.detail(actor, room.id)).participants[0]
  let run = await service.start(actor, room.id, p.id)
  for (let level = 0; level < 7; level++) {
    const task = run.challenge
    for (let group = 0; group < task.groupCount; group++) {
      const input = {
        version: run.participant.version,
        value: task.unitsPerGroup,
      }
      const result = await service.collect(actor, room.id, p.id, input)
      const duplicate = await service.collect(actor, room.id, p.id, input)
      assert.equal(duplicate.participant.score, result.participant.score)
      run = { ...run, ...result }
    }
  }
  assert.equal(run.participant.solved, 7)
  assert.ok(run.participant.score > 500)
  const before = run.participant.score
  for (let i = 0; i < 3; i++)
    run = {
      ...run,
      ...(await service.collect(actor, room.id, p.id, {
        version: run.participant.version,
        value: run.challenge.unitsPerGroup === 5 ? 3 : 5,
      })),
    }
  assert.equal(run.participant.mistakes, 3)
  assert.equal(run.participant.score, before - 45)
  assert.equal(
    (await service.start(actor, room.id, p.id)).participant.score,
    run.participant.score
  )
  await assert.rejects(
    service.collect(actor, room.id, p.id, {
      version: run.participant.version,
      value: run.challenge.unitsPerGroup,
    }),
    { code: "room_conflict" }
  )
  const restart = await service.retry(actor, room.id, p.id)
  assert.equal(restart.participant.score, 0)
  assert.equal(restart.participant.mistakes, 0)
  assert.equal(restart.participant.solved, 0)
  await service.remove(actor, room.id, p.id)
  await assert.rejects(service.start(actor, room.id, p.id), {
    code: "participant_not_found",
  })
})
test("owner and tenant isolation, pause persistence, teacher guard", async () => {
  const { service, actor } = setup()
  const r = await service.create(actor, "coast")
  await service.add(actor, r.id, "Juan Pérez")
  const p = (await service.detail(actor, r.id)).participants[0]
  const run = await service.start(actor, r.id, p.id)
  const paused = await service.pause(actor, r.id, p.id, {
    version: run.participant.version,
    paused: true,
  })
  assert.equal(paused.participant.paused, true)
  await assert.rejects(
    service.collect(actor, r.id, p.id, {
      version: paused.participant.version,
      value: 4,
    }),
    { code: "room_conflict" }
  )
  const resumed = await service.pause(actor, r.id, p.id, {
    version: paused.participant.version,
    paused: false,
  })
  assert.equal(resumed.participant.activeMs, paused.participant.activeMs)
  for (const other of [
    { tenantId: "user:bob", userId: "bob" },
    { tenantId: actor.tenantId, userId: "bob" },
  ]) {
    assert.deepEqual(await service.list(other), [])
    for (const op of [
      () => service.detail(other, r.id),
      () => service.add(other, r.id, "Luis"),
      () => service.remove(other, r.id, p.id),
      () => service.start(other, r.id, p.id),
      () => service.collect(other, r.id, p.id, { version: 1, value: 4 }),
      () => service.retry(other, r.id, p.id),
    ])
      await assert.rejects(op(), { code: "room_not_found" })
    await assert.rejects(service.create(other, "coast"), {
      code: "teacher_required",
    })
  }
})
test("HTTP validates scores and values, authenticates and persists captures", async () => {
  const { request } = setup()
  assert.equal((await request("", { user: "" })).status, 401)
  assert.equal(
    (
      await request("", {
        method: "POST",
        data: { region: "coast" },
        csrf: false,
      })
    ).status,
    403
  )
  assert.equal(
    (await request("", { method: "POST", data: { region: "unknown" } })).status,
    400
  )
  const { room } = await (
    await request("", { method: "POST", data: { region: "coast" } })
  ).json()
  assert.equal((await request("/" + room.id, { user: "bob" })).status, 404)
  await request(`/${room.id}/participants`, {
    method: "POST",
    data: { name: "Juan Pérez" },
  })
  assert.equal(
    (
      await request(`/${room.id}/participants`, {
        method: "POST",
        data: { name: "JUAN PÉREZ" },
      })
    ).status,
    409
  )
  const detail = await (await request("/" + room.id)).json()
  const id = detail.participants[0].id
  const run = await (
    await request(`/${room.id}/participants/${id}/start`, { method: "POST" })
  ).json()
  assert.equal(run.challenge.unitsPerGroup, 4)
  assert.equal(
    (
      await request(`/${room.id}/participants/${id}/collect`, {
        method: "POST",
        data: { version: run.participant.version, value: 4, score: 9999 },
      })
    ).status,
    400
  )
  const answer = await (
    await request(`/${room.id}/participants/${id}/collect`, {
      method: "POST",
      data: { version: run.participant.version, value: 4 },
    })
  ).json()
  assert.equal(answer.participant.score, 20)
  const wrong = await (
    await request(`/${room.id}/participants/${id}/collect`, {
      method: "POST",
      data: { version: answer.participant.version, value: 5 },
    })
  ).json()
  assert.equal(wrong.participant.score, 5)
  assert.equal(wrong.participant.mistakes, 1)
})

test("speed bonus is deterministic and small, with the same mathematical rewards", async () => {
  const { catchFood } = await import("../src/modules/rooms/domain/cargo.ts")
  const base = {
    id: "p",
    name: "Student",
    score: 0,
    solved: 0,
    started: true,
    version: 1,
    caught: 0,
    mistakes: 0,
    paused: false,
    activeMs: 0,
    lastEventAt: 1000,
  }
  let fast = base,
    slow = base
  for (let i = 1; i <= 3; i++) {
    fast = catchFood(fast, 4, 1000 + i * 1000)
    slow = catchFood(slow, 4, 1000 + i * 30000)
  }
  assert.equal(fast.score, 179)
  assert.equal(slow.score, 160)
  assert.equal(fast.solved, 1)
  assert.equal(slow.solved, 1)
  assert.equal(catchFood(base, 5, 2000).score, -15)
})

test("market room persists loss and retry, rejects duplicate scoring and cargo endpoints", async () => {
  const { request } = setup()
  const { room } = await (
    await request("", {
      method: "POST",
      data: { region: "coast", kind: "market", mode: "challenge" },
    })
  ).json()
  await request(`/${room.id}/participants`, {
    method: "POST",
    data: { name: "Market student" },
  })
  const detail = await (await request("/" + room.id)).json()
  const id = detail.participants[0].id,
    prefix = `/${room.id}/participants/${id}`
  let run = await (
    await request(prefix + "/market/start", { method: "POST" })
  ).json()
  assert.equal(
    (
      await request(prefix + "/collect", {
        method: "POST",
        data: { version: run.participant.version, value: 4 },
      })
    ).status,
    409
  )
  assert.equal(
    (
      await request(prefix + "/market/answer", {
        method: "POST",
        data: { version: run.participant.version, answer: 8, score: 9999 },
      })
    ).status,
    400
  )
  for (let i = 0; i < 3; i++) {
    const input = { version: run.participant.version, answer: 0 }
    run = await (
      await request(prefix + "/market/answer", { method: "POST", data: input })
    ).json()
    const repeated = await (
      await request(prefix + "/market/answer", { method: "POST", data: input })
    ).json()
    assert.equal(run.participant.score, repeated.participant.score)
  }
  const saved = await (
    await request(prefix + "/market/start", { method: "POST" })
  ).json()
  assert.equal(saved.participant.score, -60)
  assert.equal(saved.participant.mistakes, 3)
  assert.equal(
    (
      await request(prefix + "/market/help", {
        method: "POST",
        data: { version: saved.participant.version },
      })
    ).status,
    409
  )
  const restart = await (
    await request(prefix + "/market/retry", {
      method: "POST",
      data: { version: saved.participant.version },
    })
  ).json()
  assert.equal(restart.participant.score, 0)
  assert.equal(restart.participant.mistakes, 0)
  assert.equal(
    (await request(prefix + "/market/start", { method: "POST", user: "bob" }))
      .status,
    404
  )
})

test("nursery rooms persist equivalent answers, deduplicate scoring, isolate games, and retain loss until retry", async () => {
  const { service, actor, request, db } = setup()
  const room = await service.create(actor, "jungle", "nursery", "challenge")
  await service.add(actor, room.id, "Prueba vivero")
  const p = (await service.detail(actor, room.id)).participants[0]
  let run = await service.nurseryStart(actor, room.id, p.id)
  const prefix = `/${room.id}/participants/${p.id}/nursery`
  const input = {
    version: run.participant.version,
    trays: 0,
    units: run.task.target,
  }
  const answer = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal(answer.status, 200)
  run = await answer.json()
  assert.equal(run.participant.score, 100)
  const duplicate = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal((await duplicate.json()).participant.score, 100)
  assert.equal(
    (
      await request(prefix + "/answer", {
        method: "POST",
        data: { ...input, score: 999 },
      })
    ).status,
    400
  )
  assert.equal(
    (await request(prefix + "/start", { method: "POST", user: "bob" })).status,
    404
  )
  await assert.rejects(() => service.marketStart(actor, room.id, p.id), {
    code: "room_conflict",
  })
  await assert.rejects(() => service.start(actor, room.id, p.id), {
    code: "room_conflict",
  })
  for (let i = 0; i < 3; i++)
    run = await service.nurseryAction(actor, room.id, p.id, {
      version: run.participant.version,
      trays: 0,
      units: 0,
    })
  const saved = await service.nurseryStart(actor, room.id, p.id)
  assert.equal(saved.participant.score, 40)
  assert.equal(saved.participant.mistakes, 3)
  await assert.rejects(
    () =>
      service.nurseryAction(actor, room.id, p.id, {
        version: saved.participant.version,
        trays: 1,
        units: 4,
      }),
    { code: "room_conflict" }
  )
  run = await service.nurseryRetry(
    actor,
    room.id,
    p.id,
    saved.participant.version
  )
  assert.equal(run.participant.score, 0)
  assert.equal(run.task.id, 0)
  assert.equal((await service.detail(actor, room.id)).room.kind, "nursery")
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
})

test("nursery migration preserves preexisting market rooms, student scores and foreign keys", () => {
  const db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys=ON")
  const migrations = new URL("../migrations/", import.meta.url)
  for (const file of readdirSync(migrations)
    .filter((n) => n.endsWith(".sql") && n < "0011_nursery_game.sql")
    .sort())
    db.exec(readFileSync(new URL(file, migrations), "utf8"))
  db.exec(
    "INSERT INTO tenants(id,kind,name,created_by) VALUES('t','personal','Test','u')"
  )
  db.exec(
    "INSERT INTO game_rooms(id,tenant_id,user_id,region,kind,mode) VALUES('old','t','u','coast','market','practice')"
  )
  db.exec(
    "INSERT INTO game_participants(id,room_id,name,name_key,score) VALUES('p','old','Test','test',240)"
  )
  db.exec(readFileSync(new URL("0011_nursery_game.sql", migrations), "utf8"))
  assert.equal(
    db.prepare("SELECT kind FROM game_rooms WHERE id='old'").get().kind,
    "market"
  )
  assert.equal(
    db.prepare("SELECT score FROM game_participants WHERE id='p'").get().score,
    240
  )
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
  assert.throws(() =>
    db.exec(
      "INSERT INTO game_participants(id,room_id,name,name_key) VALUES('other','old','TEST','test')"
    )
  )
  db.exec(
    "INSERT INTO game_rooms(id,tenant_id,user_id,region,kind,mode) VALUES('new','t','u','jungle','nursery','challenge')"
  )
})

test("room names persist, validate and preserve existing unnamed rooms", async () => {
  const { request, service, actor } = setup()
  const legacy = await service.create(actor, "coast")
  assert.equal(legacy.name, null)
  for (const name of ["", "   ", "a".repeat(81), "hidden\u200bname"]) {
    assert.equal(
      (await request("", { method: "POST", data: { region: "coast", name } }))
        .status,
      400
    )
  }
  const result = await request("", {
    method: "POST",
    data: { region: "jungle", kind: "nursery", name: "  Segundo   A  " },
  })
  assert.equal(result.status, 200)
  const { room } = await result.json()
  assert.equal(room.name, "Segundo A")
  assert.equal(
    (await (await request("/" + room.id)).json()).room.name,
    "Segundo A"
  )
  assert.equal(
    (await service.list(actor)).find((r) => r.id === room.id).name,
    "Segundo A"
  )
})

test("room deletion enforces owner, tenant, authentication and CSRF and cascades participants", async () => {
  const { request, service, actor, db } = setup()
  const room = await service.create(
    actor,
    "coast",
    "nursery",
    "practice",
    "Delete test"
  )
  const keep = await service.create(actor, "jungle")
  await service.add(actor, room.id, "Test participant")
  const participant = (await service.detail(actor, room.id)).participants[0]
  await service.nurseryStart(actor, room.id, participant.id)
  const path = "/" + room.id
  assert.equal(
    (await request(path, { method: "DELETE", user: "" })).status,
    401
  )
  assert.equal(
    (await request(path, { method: "DELETE", csrf: false })).status,
    403
  )
  assert.equal(
    (await request(path, { method: "DELETE", user: "bob" })).status,
    404
  )
  await assert.rejects(
    service.deleteRoom({ ...actor, userId: "bob" }, room.id),
    { code: "room_not_found" }
  )
  await assert.rejects(
    service.deleteRoom({ ...actor, tenantId: "user:bob" }, room.id),
    { code: "room_not_found" }
  )
  assert.equal((await service.detail(actor, room.id)).participants.length, 1)
  assert.equal((await request(path, { method: "DELETE" })).status, 200)
  assert.equal((await request(path)).status, 404)
  assert.equal((await request(path, { method: "DELETE" })).status, 404)
  assert.equal(
    db
      .prepare("SELECT COUNT(*) AS n FROM game_participants WHERE room_id=?")
      .get(room.id).n,
    0
  )
  assert.deepEqual(
    (await service.list(actor)).map((r) => r.id),
    [keep.id]
  )
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
})

test("fair rooms persist equal orders, deduplicate scoring, isolate games, and retain loss until retry", async () => {
  const { service, actor, request, db } = setup()
  const room = await service.create(actor, "jungle", "fair", "challenge")
  await service.add(actor, room.id, "Prueba vivero")
  const p = (await service.detail(actor, room.id)).participants[0]
  let run = await service.fairStart(actor, room.id, p.id)
  const prefix = `/${room.id}/participants/${p.id}/fair`
  const input = {
    version: run.participant.version,
    answer: run.task.target - run.task.base,
  }
  const answer = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal(answer.status, 200)
  run = await answer.json()
  assert.equal(run.participant.score, 100)
  const duplicate = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal((await duplicate.json()).participant.score, 100)
  assert.equal(
    (
      await request(prefix + "/answer", {
        method: "POST",
        data: { ...input, score: 999 },
      })
    ).status,
    400
  )
  assert.equal(
    (await request(prefix + "/start", { method: "POST", user: "bob" })).status,
    404
  )
  await assert.rejects(() => service.marketStart(actor, room.id, p.id), {
    code: "room_conflict",
  })
  await assert.rejects(() => service.start(actor, room.id, p.id), {
    code: "room_conflict",
  })
  for (let i = 0; i < 3; i++)
    run = await service.fairAction(actor, room.id, p.id, {
      version: run.participant.version,
      answer: run.task.choices.find(
        (n) => n !== run.task.target - run.task.base
      ),
    })
  const saved = await service.fairStart(actor, room.id, p.id)
  assert.equal(saved.participant.score, 40)
  assert.equal(saved.participant.mistakes, 3)
  await assert.rejects(
    () =>
      service.fairAction(actor, room.id, p.id, {
        version: saved.participant.version,
        answer: saved.task.choices[0],
      }),
    { code: "room_conflict" }
  )
  run = await service.fairRetry(actor, room.id, p.id, saved.participant.version)
  assert.equal(run.participant.score, 0)
  assert.equal(run.task.id, 0)
  assert.equal((await service.detail(actor, room.id)).room.kind, "fair")
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
})

test("data rooms persist individual votes, idempotent progress, ownership and final scores", async () => {
  const { service, actor, request, db } = setup()
  const room = await service.create(actor, "highlands", "data", "challenge")
  await service.add(actor, room.id, "Prueba Datos Uno")
  const p = (await service.detail(actor, room.id)).participants[0]
  let run = await service.dataStart(actor, room.id, p.id)
  const prefix = `/${room.id}/participants/${p.id}/data`
  let input = { version: run.participant.version, answer: run.task.votes[0] }
  const first = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal(first.status, 200)
  run = await first.json()
  assert.equal(run.task.cursor, 1)
  assert.equal(run.participant.score, 0)
  const duplicate = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal((await duplicate.json()).task.cursor, 1)
  const saved = await service.dataStart(actor, room.id, p.id)
  assert.equal(saved.task.cursor, 1)
  while (run.task.skill === 0) {
    run = await service.dataAction(actor, room.id, p.id, {
      version: run.participant.version,
      answer: run.task.votes[run.task.cursor],
    })
  }
  assert.equal(run.participant.score, 100)
  assert.equal(run.task.skill, 1)
  assert.deepEqual(run.task.registered, run.task.counts)
  assert.equal(
    (
      await request(prefix + "/answer", {
        method: "POST",
        data: {
          version: run.participant.version,
          answer: run.task.counts[run.task.category],
          score: 900,
        },
      })
    ).status,
    400
  )
  assert.equal(
    (await request(prefix + "/start", { method: "POST", user: "bob" })).status,
    404
  )
  await assert.rejects(() => service.fairStart(actor, room.id, p.id), {
    code: "room_conflict",
  })
  await assert.rejects(() => service.start(actor, room.id, p.id), {
    code: "room_conflict",
  })
  for (let i = 0; i < 3; i++)
    run = await service.dataAction(actor, room.id, p.id, {
      version: run.participant.version,
      answer: run.task.choices.find(
        (n) => n !== run.task.counts[run.task.category]
      ),
    })
  assert.equal(run.participant.mistakes, 3)
  assert.equal(run.participant.score, 40)
  assert.equal(
    (await service.dataStart(actor, room.id, p.id)).participant.mistakes,
    3
  )
  await assert.rejects(
    () =>
      service.dataAction(actor, room.id, p.id, {
        version: run.participant.version,
        help: true,
      }),
    { code: "room_conflict" }
  )
  run = await service.dataRetry(actor, room.id, p.id, run.participant.version)
  assert.equal(run.task.cursor, 0)
  assert.equal(run.participant.score, 0)
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
})

test("builder room saves pieces once, isolates legacy scores and persists loss/retry", async () => {
  const { service, actor, request, db } = setup()
  const room = await service.create(actor, "coast", "builder", "challenge")
  await service.add(actor, room.id, "Prueba Constructores")
  const p = (await service.detail(actor, room.id)).participants[0]
  let run = await service.builderStart(actor, room.id, p.id)
  const prefix = `/${room.id}/participants/${p.id}/builder`
  const input = {
    version: run.participant.version,
    shape: run.task.targets[0],
    rotation: 0,
  }
  const first = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal(first.status, 200)
  run = await first.json()
  assert.equal(run.task.cursor, 1)
  assert.equal(run.participant.score, 0)
  const repeated = await request(prefix + "/answer", {
    method: "POST",
    data: input,
  })
  assert.equal((await repeated.json()).task.cursor, 1)
  assert.equal(
    (await service.builderStart(actor, room.id, p.id)).task.cursor,
    1
  )
  for (let i = 0; i < 2; i++)
    run = await service.builderAction(actor, room.id, p.id, {
      version: run.participant.version,
      shape: run.task.targets[run.task.cursor],
      rotation: 0,
    })
  assert.equal(run.participant.score, 100)
  assert.equal(run.task.id, 1)
  assert.equal(
    (
      await request(prefix + "/answer", {
        method: "POST",
        data: {
          version: run.participant.version,
          shape: "rectangle",
          rotation: 0,
          score: 999,
        },
      })
    ).status,
    400
  )
  assert.equal(
    (await request(prefix + "/start", { method: "POST", user: "bob" })).status,
    404
  )
  await assert.rejects(() => service.dataStart(actor, room.id, p.id), {
    code: "room_conflict",
  })
  for (let i = 0; i < 3; i++)
    run = await service.builderAction(actor, room.id, p.id, {
      version: run.participant.version,
      shape: "triangle",
      rotation: 0,
    })
  assert.equal(run.participant.score, 40)
  assert.equal(run.participant.mistakes, 3)
  assert.equal(
    (await service.builderStart(actor, room.id, p.id)).participant.mistakes,
    3
  )
  await assert.rejects(
    () =>
      service.builderAction(actor, room.id, p.id, {
        version: run.participant.version,
        shape: "rectangle",
        rotation: 0,
      }),
    { code: "room_conflict" }
  )
  run = await service.builderRetry(
    actor,
    room.id,
    p.id,
    run.participant.version
  )
  assert.equal(run.participant.score, 0)
  assert.equal(run.task.cursor, 0)
  assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0)
  const retired = await request("", {
    method: "POST",
    data: { region: "coast", kind: "data", mode: "practice", name: "Retired" },
  })
  assert.equal(retired.status, 400)
})
