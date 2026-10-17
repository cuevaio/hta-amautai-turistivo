import { URL } from "node:url"
import crypto from "node:crypto"
import worker from "../src/index.ts"
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { d1Notifications } from "../src/modules/notifications/infrastructure/d1-notifications.ts"
import {
  notificationService,
  dispatchNotifications,
} from "../src/modules/notifications/application/service.ts"
import { verificationCrypto } from "../src/modules/notifications/infrastructure/crypto.ts"
import { createApp } from "../src/app.ts"
function setup() {
  const db = new DatabaseSync(":memory:")
  for (const name of ["0001_projects.sql", "0002_notifications.sql"])
    db.exec(
      readFileSync(new URL("../migrations/" + name, import.meta.url), "utf8")
    )
  function prepare(sql) {
    let values = []
    return {
      bind(...args) {
        values = args
        return this
      },
      async run() {
        return {
          meta: { changes: Number(db.prepare(sql).run(...values).changes) },
        }
      },
      async first() {
        return db.prepare(sql).get(...values) || null
      },
      async all() {
        return { results: db.prepare(sql).all(...values) }
      },
    }
  }
  const DB = {
    prepare,
    async batch(statements) {
      db.exec("BEGIN")
      try {
        const results = []
        for (const stmt of statements) results.push(await stmt.run())
        db.exec("COMMIT")
        return results
      } catch (e) {
        db.exec("ROLLBACK")
        throw e
      }
    },
  }
  const actor = { tenantId: "personal:alice", userId: "alice" },
    now = Date.now()
  db.prepare(
    "INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal','Alice','alice')"
  ).run(actor.tenantId)
  const repo = d1Notifications(DB),
    sent = []
  let connected = true,
    fail = false
  const gateway = {
    async connection() {
      return connected ? "connected" : "needs_pairing"
    },
    async send(n) {
      sent.push(n.id)
      if (fail) throw Error("offline")
      return { status: "accepted" }
    },
    async status() {
      return { status: "delivered", providerId: "wa-123" }
    },
  }
  const cryptoPort = {
    ...verificationCrypto("test-secret-that-is-at-least-32-characters"),
    code: () => "123456",
  }
  const service = notificationService(repo, gateway, cryptoPort, () => now)
  async function verified() {
    await service.requestCode(actor, "+51999999999")
    await service.verify(actor, "123456")
  }
  return {
    db,
    DB,
    actor,
    now,
    repo,
    gateway,
    service,
    sent,
    verified,
    connected(value) {
      connected = value
    },
    fail(value) {
      fail = value
    },
  }
}
test("verification stores no public code, blocks wrong/expired codes and activates only after proof", async () => {
  const s = setup()
  await assert.rejects(
    s.service.schedule(s.actor, {
      title: "Recordatorio",
      scheduledAt: s.now,
      requestKey: crypto.randomUUID(),
    }),
    /whatsapp_not_verified/
  )
  await s.service.requestCode(s.actor, "+51999999999")
  const overview = await s.service.overview(s.actor)
  assert.equal(overview.contact.verified, false)
  assert.ok(!JSON.stringify(overview).includes("123456"))
  const stored = s.db
    .prepare("SELECT challenge_hash FROM notification_contacts")
    .get()
  assert.equal(stored.challenge_hash.length, 64)
  await assert.rejects(
    s.service.verify(s.actor, "999999"),
    /invalid_whatsapp_code/
  )
  await s.service.verify(s.actor, "123456")
  assert.equal((await s.repo.contact(s.actor)).enabled, 1)
  await assert.rejects(
    s.service.verify(s.actor, "123456"),
    /invalid_whatsapp_code/
  )
})
test("five wrong verification attempts exhaust the challenge, even with the correct code next", async () => {
  const s = setup()
  await s.service.requestCode(s.actor, "+51999999999")
  for (let i = 0; i < 5; i++)
    await assert.rejects(s.service.verify(s.actor, "000000"))
  await assert.rejects(
    s.service.verify(s.actor, "123456"),
    /invalid_whatsapp_code/
  )
  assert.equal((await s.repo.contact(s.actor)).verified_at, null)
})
test("expired challenges fail and repeated requests are atomically rate limited", async () => {
  const s = setup()
  await s.service.requestCode(s.actor, "+51999999999")
  await assert.rejects(
    s.service.requestCode(s.actor, "+51988888888"),
    /notification_rate_limited/
  )
  assert.equal((await s.repo.contact(s.actor)).phone, "+51999999999")
  s.db.exec("UPDATE notification_contacts SET challenge_expires=1")
  await assert.rejects(s.service.verify(s.actor, "123456"))
  s.connected(false)
  await assert.rejects(
    s.service.requestCode(s.actor, "+51999999999"),
    /whatsapp_unavailable/
  )
})
test("reminder idempotency, ownership, consent revocation and cancellation use real SQL", async () => {
  const s = setup()
  await s.verified()
  const input = {
    title: "Practicar matemáticas",
    scheduledAt: s.now + 60000,
    requestKey: crypto.randomUUID(),
  }
  const first = await s.service.schedule(s.actor, input),
    second = await s.service.schedule(s.actor, input)
  assert.equal(first.id, second.id)
  const stranger = { tenantId: s.actor.tenantId, userId: "bob" }
  assert.equal((await s.repo.list(stranger)).length, 0)
  assert.equal(await s.repo.cancel(stranger, first.id), false)
  await s.service.preferences(s.actor, false, "America/Lima")
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(first.id)
      .status,
    "cancelled"
  )
  await assert.rejects(
    s.service.schedule(s.actor, input),
    /whatsapp_not_verified/
  )
})
test("dispatcher atomically leases, retries with stable IDs, reconciles delivery and expires messages", async () => {
  const s = setup()
  await s.verified()
  // Verification message is no longer eligible once the code has been consumed.
  await dispatchNotifications(s.repo, s.gateway, s.now)
  const n = await s.service.schedule(s.actor, {
    title: "Mi recordatorio",
    scheduledAt: s.now,
    requestKey: crypto.randomUUID(),
  })
  s.fail(true)
  await dispatchNotifications(s.repo, s.gateway, s.now)
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(n.id)
      .status,
    "pending"
  )
  s.fail(false)
  await dispatchNotifications(s.repo, s.gateway, s.now + 200000)
  assert.equal(s.sent.filter((id) => id === n.id).length, 2)
  await dispatchNotifications(s.repo, s.gateway, s.now + 300000)
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(n.id)
      .status,
    "delivered"
  )
  const future = await s.service.schedule(s.actor, {
    title: "Otro recordatorio",
    scheduledAt: s.now + 1000,
    requestKey: crypto.randomUUID(),
  })
  const [a, b] = await Promise.all([
    s.repo.claim(s.now + 1000),
    s.repo.claim(s.now + 1000),
  ])
  assert.equal([...a, ...b].filter((row) => row.id === future.id).length, 1)
  await s.repo.cleanup(s.now + 4000000)
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(future.id)
      .status,
    "expired"
  )
})
test("HTTP enforces authenticated ownership, browser origin and strict contracts", async () => {
  const s = setup()
  let user = { user: { id: "alice" }, sessionId: "s" }
  const app = createApp(
    async () => user,
    undefined,
    () => s.gateway
  )
  const env = {
    DB: s.DB,
    APP_ORIGINS: "https://amautai.test",
    WORKOS_COOKIE_PASSWORD: "test-secret-that-is-at-least-32-characters",
  }
  const request = (
    path,
    method = "GET",
    body,
    origin = "https://amautai.test"
  ) =>
    app.request(
      "https://amautai.test" + path,
      {
        method,
        headers: {
          Origin: origin,
          "X-Amautai-Request": "1",
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      env
    )
  assert.equal((await request("/api/notifications")).status, 200)
  assert.equal(
    (
      await request("/api/notifications/phone", "POST", {
        phone: "+51999999999",
        consent: false,
      })
    ).status,
    400
  )
  assert.equal(
    (
      await request("/api/notifications/phone", "POST", {
        phone: "+51999999999",
        consent: true,
        tenantId: "evil",
      })
    ).status,
    400
  )
  assert.equal(
    (
      await request("/api/notifications/preferences", "PUT", {
        enabled: false,
        timezone: "invalid",
      })
    ).status,
    400
  )
  assert.equal(
    (
      await request(
        "/api/notifications/phone",
        "POST",
        { phone: "+51999999999", consent: true },
        "https://evil.test"
      )
    ).status,
    403
  )
  user = null
  assert.equal((await request("/api/notifications")).status, 401)
})

test("Worker entrypoint exposes HTTP and scheduled handlers", async () => {
  const s = setup()
  assert.equal(
    (
      await worker.fetch(
        new globalThis.Request("https://amautai.test/api/health"),
        { DB: s.DB },
        {}
      )
    ).status,
    200
  )
  await worker.scheduled({}, { DB: s.DB })
})
