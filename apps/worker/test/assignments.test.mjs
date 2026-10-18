import { URL } from "node:url"
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { createApp } from "../src/app.ts"
import { roomService } from "../src/modules/rooms/application/service.ts"
import {
  assignmentService,
  dispatchAssignments,
} from "../src/modules/rooms/application/assignment-service.ts"
import { d1Assignments } from "../src/modules/rooms/infrastructure/d1-assignments.ts"
import { d1Rooms } from "../src/modules/rooms/infrastructure/d1-rooms.ts"
import { assignmentCrypto } from "../src/modules/rooms/infrastructure/assignment-crypto.ts"
import { guardianPhone } from "../src/modules/rooms/domain/assignment.ts"
function setup() {
  const db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys=ON")
  const migrations = new URL("../migrations/", import.meta.url)
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    db.exec(readFileSync(new URL(name, migrations), "utf8"))
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
          return db.prepare(sql).get(...args) ?? null
        },
        async all() {
          return { results: db.prepare(sql).all(...args) }
        },
      }
    },
    async batch(statements) {
      db.exec("BEGIN")
      try {
        const results = []
        for (const s of statements) results.push(await s.run())
        db.exec("COMMIT")
        return results
      } catch (e) {
        db.exec("ROLLBACK")
        throw e
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
  const repo = d1Assignments(DB),
    rooms = d1Rooms(DB),
    game = roomService(rooms, randomUUID)
  let time = Date.now()
  const assignments = assignmentService({
    repo,
    rooms,
    crypto: assignmentCrypto(),
    id: randomUUID,
    now: () => time,
  })
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
  const input = (name = "Ana Pérez") => ({
    name,
    guardianPhone: "999 999 999",
    requestKey: randomUUID(),
  })
  const request = (
    path,
    { method = "GET", user = "", token, data, csrf = true, port = 5173 } = {}
  ) =>
    app.request(
      "http://localhost:" + port + path,
      {
        method,
        headers: {
          Origin: "http://localhost:5173",
          "x-test-user": user,
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(csrf ? { "X-Amautai-Request": "1" } : {}),
          "Content-Type": "application/json",
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      },
      { DB, APP_ORIGINS: "http://localhost:5173" }
    )
  const row = () =>
    db
      .prepare("SELECT * FROM student_assignments ORDER BY created_at DESC")
      .get()
  const token = () => row().message_body.match(/\/actividad#([a-f0-9]{64})/)[1]
  return {
    db,
    DB,
    actor,
    repo,
    rooms,
    game,
    assignments,
    input,
    request,
    row,
    token,
    time: () => time,
    advance: (n) => {
      time += n
    },
  }
}
test("guardian phone belongs to the adult and accepts only nine-digit Peruvian mobiles", () => {
  assert.equal(guardianPhone("999 999 999"), "+51999999999")
  assert.equal(guardianPhone("+51 (999) 999-999"), "+51999999999")
  assert.equal(guardianPhone("51999999999"), "+51999999999")
  for (const phone of [
    "abc999999999",
    "+00012345",
    "12345",
    "+51999<script>",
    "+1 202 555 0123",
    "+519999999999",
    "899999999",
  ])
    assert.throws(() => guardianPhone(phone), {
      code: "invalid_guardian_phone",
    })
})
test("atomic registration creates one student and one durable assignment, with private phone/token", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "builder"),
    input = s.input()
  const path = `/api/game-rooms/${room.id}/assignments`
  const first = await s.request(path, {
    method: "POST",
    user: "alice",
    data: input,
  })
  assert.equal(first.status, 200)
  assert.equal((await first.json()).assignment.guardianPhone, "+51999999999")
  assert.equal(
    (await s.request(path, { method: "POST", user: "alice", data: input }))
      .status,
    200
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM game_participants").get().n,
    1
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM student_assignments").get().n,
    1
  )
  assert.notEqual(s.row().token_hash, s.token())
  assert.match(s.row().message_body, /familia de Ana Pérez/)
  const detail = await s.game.detail(s.actor, room.id)
  assert.equal(detail.participants[0].assignment.guardianPhone, "+51999999999")
  assert.equal(detail.participants[0].assignment.status, "pending")
  assert.equal(JSON.stringify(detail).includes(s.token()), false)
  assert.equal(
    (
      await s.request(path, {
        method: "POST",
        user: "alice",
        data: { ...input, guardianPhone: "988888888" },
      })
    ).status,
    409
  )
  assert.equal(
    (await s.request(path, { method: "POST", user: "alice", data: s.input() }))
      .status,
    409
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM game_participants").get().n,
    1
  )
})
test("teacher ownership, CSRF, malformed numbers and room capacity are enforced", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "market"),
    path = `/api/game-rooms/${room.id}/assignments`
  for (const [options, status] of [
    [{ user: "" }, 401],
    [{ user: "bob" }, 409],
    [{ user: "alice", csrf: false }, 403],
  ])
    assert.equal(
      (await s.request(path, { method: "POST", data: s.input(), ...options }))
        .status,
      status
    )
  assert.equal(
    (
      await s.request(path, {
        method: "POST",
        user: "alice",
        data: { ...s.input(), guardianPhone: "badphone" },
      })
    ).status,
    400
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM student_assignments").get().n,
    0
  )
  for (let n = 0; n < 100; n++)
    await s.game.add(s.actor, room.id, "Student " + n)
  assert.equal(
    (await s.request(path, { method: "POST", user: "alice", data: s.input() }))
      .status,
    409
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM student_assignments").get().n,
    0
  )
})
test("an existing classroom participant can receive an assignment without losing progress", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "market")
  await s.game.add(s.actor, room.id, "Ana Pérez")
  const p = (await s.game.detail(s.actor, room.id)).participants[0]
  const run = await s.game.marketStart(s.actor, room.id, p.id)
  await s.game.marketAction(s.actor, room.id, p.id, {
    version: run.participant.version,
    help: true,
  })
  assert.equal(
    (
      await s.request(
        `/api/game-rooms/${room.id}/participants/${p.id}/assignment`,
        { method: "POST", user: "alice", data: s.input() }
      )
    ).status,
    200
  )
  assert.equal(s.row().participant_id, p.id)
  assert.equal((await s.game.marketStart(s.actor, room.id, p.id)).helped, true)
})
test("a bearer link can only play its assigned student and never lists peers or exposes phones", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "market")
  await s.assignments.register(
    s.actor,
    room.id,
    s.input(),
    "http://localhost:5173"
  )
  await s.game.add(s.actor, room.id, "Other student")
  const token = s.token(),
    p = s.row().participant_id,
    base = `/api/assigned-games/${room.id}/participants/${p}`
  const detail = await s.request("/api/assigned-games", { token })
  assert.equal(detail.status, 200)
  const text = await detail.text()
  assert.equal(text.includes("Other student"), false)
  assert.equal(text.includes("guardianPhone"), false)
  assert.equal(text.includes("tokenHash"), false)
  assert.equal((await s.request("/api/game-rooms", { token })).status, 401)
  assert.equal((await s.request("/api/assigned-games")).status, 404)
  assert.equal(
    (
      await s.request(base + "/market/start", {
        method: "POST",
        token,
        csrf: false,
      })
    ).status,
    403
  )
  const start = await s.request(base + "/market/start", {
    method: "POST",
    token,
  })
  assert.equal(start.status, 200)
  const run = await start.json()
  const answer =
    run.task.operation === "+"
      ? run.task.a + run.task.b
      : run.task.a - run.task.b
  const response = await s.request(base + "/market/answer", {
    method: "POST",
    token,
    data: { version: run.participant.version, answer },
  })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).participant.solved, 1)
  assert.equal(
    (await s.game.detail(s.actor, room.id)).participants.find((v) => v.id === p)
      .solved,
    1
  )
  for (const path of [
    base + "/start",
    base.replace(p, "other") + "/market/start",
    `/api/assigned-games/${room.id}/participants`,
  ])
    assert.equal((await s.request(path, { method: "POST", token })).status, 404)
  assert.equal((await s.request(base, { method: "DELETE", token })).status, 404)
  await s.game.remove(s.actor, room.id, p)
  assert.equal(
    (await s.request(base + "/market/start", { method: "POST", token })).status,
    404
  )
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM student_assignments").get().n,
    0
  )
})
test("all current games accept assigned access and enforce server game rules", async () => {
  for (const kind of ["cargo", "market", "nursery", "fair", "builder"]) {
    const s = setup(),
      room = await s.game.create(s.actor, "coast", kind)
    await s.assignments.register(
      s.actor,
      room.id,
      s.input(),
      "http://localhost:5173"
    )
    const prefix =
      `/api/assigned-games/${room.id}/participants/${s.row().participant_id}` +
      (kind === "cargo" ? "" : "/" + kind)
    assert.equal(
      (await s.request(prefix + "/start", { method: "POST", token: s.token() }))
        .status,
      200,
      kind
    )
  }
})
test("assignment expires, tenant access is isolated, and deleting room revokes links", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "cargo")
  await s.assignments.register(
    s.actor,
    room.id,
    s.input(),
    "http://localhost:5173"
  )
  const token = s.token()
  await assert.rejects(
    () =>
      s.assignments.register(
        { tenantId: "user:bob", userId: "bob" },
        room.id,
        s.input(),
        "http://localhost:5173"
      ),
    { code: "teacher_required" }
  )
  s.advance(30 * 86400000 + 1)
  await assert.rejects(() => s.assignments.access(token), {
    code: "assignment_not_found",
  })
  await s.game.deleteRoom(s.actor, room.id)
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM student_assignments").get().n,
    0
  )
  assert.equal(s.db.prepare("PRAGMA foreign_key_check").all().length, 0)
})
test("dispatcher persists status, reconciles lost responses, and never resends an accepted job", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "cargo")
  await s.assignments.register(
    s.actor,
    room.id,
    s.input(),
    "http://localhost:5173"
  )
  const sent = [],
    known = new Map()
  const messenger = {
    async send(a) {
      sent.push(a.deliveryId)
      known.set(a.deliveryId, "accepted")
      throw Error("timeout after accepted")
    },
    async status(id) {
      return known.get(id) ?? null
    },
  }
  await dispatchAssignments(s.repo, messenger, s.time())
  assert.equal(s.row().status, "pending")
  s.advance(61000)
  await dispatchAssignments(s.repo, messenger, s.time())
  assert.equal(s.row().status, "accepted")
  assert.equal(sent.length, 1)
  known.set(sent[0], "read")
  s.advance(61000)
  await dispatchAssignments(s.repo, messenger, s.time())
  assert.equal(s.row().status, "read")
  assert.equal(sent.length, 1)
  await s.assignments
    .register(s.actor, room.id, s.input(), "http://localhost:5173")
    .catch(() => {})
  await assert.rejects(
    () => s.assignments.retry(s.actor, room.id, s.row().participant_id),
    { code: "assignment_conflict" }
  )
})
test("only definitive failures can be retried with a new delivery ID", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "cargo")
  await s.assignments.register(
    s.actor,
    room.id,
    s.input(),
    "http://localhost:5173"
  )
  const old = s.row().delivery_id
  await dispatchAssignments(
    s.repo,
    {
      async send() {
        return "failed"
      },
      async status() {
        return null
      },
    },
    s.time()
  )
  await s.assignments.retry(s.actor, room.id, s.row().participant_id)
  assert.equal(s.row().status, "pending")
  assert.notEqual(s.row().delivery_id, old)
  assert.equal(s.row().attempts, 0)
})

test("expired invitations can be renewed for the same student without losing game progress", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "market")
  await s.assignments.register(
    s.actor,
    room.id,
    s.input(),
    "http://localhost:5173"
  )
  const oldToken = s.token(),
    id = s.row().participant_id
  await s.game.marketStart(s.actor, room.id, id)
  s.advance(30 * 86400000 + 1)
  await dispatchAssignments(
    s.repo,
    {
      async send() {
        assert.fail("An expired link cannot be sent")
      },
      async status() {
        return null
      },
    },
    s.time()
  )
  assert.equal(s.row().status, "expired")
  const renewal = await s.assignments.register(
    s.actor,
    room.id,
    { ...s.input(), participantId: id },
    "http://localhost:5173"
  )
  assert.equal(renewal.status, "pending")
  assert.equal(renewal.expired, false)
  assert.notEqual(oldToken, s.token())
  assert.equal(
    s.db.prepare("SELECT count(*) n FROM game_participants").get().n,
    1
  )
  assert.equal(
    (await s.assignments.access(s.token())).participant.started,
    true
  )
  await assert.rejects(() => s.assignments.access(oldToken), {
    code: "assignment_not_found",
  })
})

test("links use the validated frontend origin when a development proxy changes the API host", async () => {
  const s = setup(),
    room = await s.game.create(s.actor, "coast", "cargo")
  const response = await s.request(`/api/game-rooms/${room.id}/assignments`, {
    method: "POST",
    user: "alice",
    data: s.input(),
    port: 8787,
  })
  assert.equal(response.status, 200)
  assert.match(s.row().message_body, /http:\/\/localhost:5173\/actividad#/)
  assert.equal(s.row().message_body.includes("localhost:8787"), false)
})
