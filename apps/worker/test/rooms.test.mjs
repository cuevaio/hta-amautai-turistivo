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
