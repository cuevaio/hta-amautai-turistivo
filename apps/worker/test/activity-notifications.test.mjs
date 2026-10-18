import { URL } from "node:url"
import crypto from "node:crypto"
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { d1Activity } from "../src/modules/notifications/infrastructure/d1-activity.ts"
import { d1Email } from "../src/modules/notifications/infrastructure/d1-email.ts"
import { d1Notifications } from "../src/modules/notifications/infrastructure/d1-notifications.ts"
import {
  activityPreferences,
  activityNotifications,
} from "../src/modules/notifications/application/activity-service.ts"
import {
  emailService,
  dispatchEmail,
} from "../src/modules/notifications/application/email-service.ts"
import {
  notificationService,
  dispatchNotifications,
} from "../src/modules/notifications/application/service.ts"
import { createApp } from "../src/app.ts"
const actor = { tenantId: "user:alice", userId: "alice" },
  other = { tenantId: "user:bob", userId: "bob" }
const account = { email: "alice@example.test", emailVerified: true }
const ready = {
  email: { configured: true, verified: true, optedOut: false },
  whatsapp: { registered: true },
}
function setup() {
  const db = new DatabaseSync(":memory:")
  const dir = new URL("../migrations/", import.meta.url)
  for (const name of readdirSync(dir)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    db.exec(readFileSync(new URL(name, dir), "utf8"))
  const DB = {
    prepare(sql) {
      let args = []
      return {
        bind(...a) {
          args = a
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
    async batch(statements) {
      db.exec("BEGIN")
      try {
        const values = []
        for (const s of statements) values.push(await s.run())
        db.exec("COMMIT")
        return values
      } catch (e) {
        db.exec("ROLLBACK")
        throw e
      }
    },
  }
  db.prepare(
    "INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal','Alice','alice'),(?,'personal','Bob','bob')"
  ).run(actor.tenantId, other.tenantId)
  const now = Date.now(),
    sends = [],
    secure = { id: () => crypto.randomUUID() }
  const emailProvider = {
    configured: () => true,
    async send(n) {
      sends.push(["email", n])
      return { status: "accepted" }
    },
  }
  const gateway = {
    async connection() {
      return "connected"
    },
    async send(n) {
      sends.push(["whatsapp", n])
      return { status: "accepted" }
    },
    async status() {
      return null
    },
  }
  const preferences = d1Activity(DB),
    emailRepo = d1Email(DB),
    waRepo = d1Notifications(DB)
  const email = emailService(emailRepo, emailProvider, secure, () => now),
    wa = notificationService(waRepo, gateway, secure, () => now)
  return {
    db,
    DB,
    now,
    sends,
    preferences,
    emailRepo,
    waRepo,
    email,
    wa,
    emailProvider,
    gateway,
    settings: activityPreferences(preferences),
    emit: activityNotifications({
      preferences,
      email: (a, account, input) => email.schedule(a, account, input),
      whatsapp: (a, input) => wa.schedule(a, input),
    }),
  }
}
test("preferences default to email, persist independently per type, user and tenant", async () => {
  const s = setup()
  assert.deepEqual(
    (await s.settings.overview(actor, ready)).preferences.map((p) => p.channel),
    ["email", "email", "email"]
  )
  assert.ok(
    (
      await s.settings.overview(actor, {
        ...ready,
        email: { ...ready.email, optedOut: true },
      })
    ).preferences.every((p) => p.channel === "none")
  )
  await s.settings.save(actor, { type: "task_due", channel: "both" }, ready)
  assert.equal(
    (await s.settings.overview(actor, ready)).preferences.find(
      (p) => p.type === "task_due"
    ).channel,
    "both"
  )
  assert.equal(
    (await s.settings.overview(other, ready)).preferences.find(
      (p) => p.type === "task_due"
    ).channel,
    "email"
  )
  assert.deepEqual(
    await s.preferences.list({ ...actor, userId: "another-member" }),
    []
  )
})
test("WhatsApp needs a registered number; email needs verified account; none always saves", async () => {
  const s = setup()
  await assert.rejects(
    s.settings.save(
      actor,
      { type: "new_message", channel: "whatsapp" },
      { ...ready, whatsapp: { registered: false } }
    ),
    (e) => e.code === "whatsapp_not_registered"
  )
  await assert.rejects(
    s.settings.save(
      actor,
      { type: "new_message", channel: "both" },
      { ...ready, email: { ...ready.email, verified: false } }
    ),
    (e) => e.code === "email_verification_required"
  )
  await s.settings.save(
    actor,
    { type: "new_message", channel: "none" },
    {
      email: { configured: false, verified: false, optedOut: true },
      whatsapp: { registered: false },
    }
  )
  assert.equal((await s.preferences.list(actor))[0].channel, "none")
})
test("internal events respect all four channels and use idempotent outboxes", async () => {
  const s = setup()
  await s.wa.register(actor, "+51987654321")
  for (const [channel, expected] of [
    ["none", 0],
    ["email", 1],
    ["whatsapp", 1],
    ["both", 2],
  ]) {
    await s.preferences.save(actor, "task_assigned", channel)
    const event = {
      id: crypto.randomUUID(),
      type: "task_assigned",
      title: "Nueva tarea asignada",
      at: s.now,
    }
    const results = await s.emit(actor, account, event)
    assert.equal(results.length, expected)
    assert.ok(results.every((r) => r.status === "fulfilled"))
    await s.emit(actor, account, event)
    const count = s.db
      .prepare(
        "SELECT (SELECT COUNT(*) FROM notifications WHERE request_key=?) + (SELECT COUNT(*) FROM email_notifications WHERE request_key=?) AS count"
      )
      .get(event.id, event.id).count
    assert.equal(count, expected)
  }
})
test("changing a type cancels only its pending deliveries and dispatcher rechecks preferences", async () => {
  const s = setup()
  await s.wa.register(actor, "+51987654321")
  await s.preferences.save(actor, "task_due", "both")
  await s.preferences.save(actor, "new_message", "email")
  await s.emit(actor, account, {
    id: crypto.randomUUID(),
    type: "task_due",
    title: "Una tarea vence pronto",
    at: s.now,
  })
  await s.emit(actor, account, {
    id: crypto.randomUUID(),
    type: "new_message",
    title: "Nuevo mensaje",
    at: s.now,
  })
  await s.preferences.save(actor, "task_due", "none")
  assert.equal(
    s.db.prepare("SELECT status FROM notifications").get().status,
    "cancelled"
  )
  assert.equal(
    s.db
      .prepare(
        "SELECT status FROM email_notifications WHERE event_type='task_due'"
      )
      .get().status,
    "cancelled"
  )
  await dispatchEmail(s.emailRepo, s.emailProvider, s.now)
  await dispatchNotifications(s.waRepo, s.gateway, s.now)
  assert.equal(s.sends.length, 1)
  assert.equal(s.sends[0][1].event_type, "new_message")
  // A stale producer can enqueue after an opt-out, but the dispatch guard still blocks it.
  await s.email.schedule(actor, account, {
    title: "Stale event",
    scheduledAt: s.now,
    requestKey: crypto.randomUUID(),
    eventType: "task_due",
  })
  await dispatchEmail(s.emailRepo, s.emailProvider, s.now)
  assert.equal(s.sends.length, 1)
})
test("HTTP preferences derive ownership from session and reject spoofed tenants and event injection", async () => {
  const s = setup()
  let identity = { user: { id: "alice", ...account }, sessionId: "fixture" }
  const app = createApp(async () => identity)
  const env = {
    DB: s.DB,
    APP_ORIGINS: "https://amautai.test",
    EMAIL_FROM: "sender@example.test",
  }
  const request = (
    method = "GET",
    body,
    origin = "https://amautai.test",
    path = "/api/notifications/settings"
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
  assert.equal((await request()).status, 200)
  assert.equal(
    (
      await request("PUT", {
        type: "new_message",
        channel: "none",
        tenantId: other.tenantId,
      })
    ).status,
    400
  )
  assert.equal(
    (await request("PUT", { type: "bad", channel: "none" })).status,
    400
  )
  assert.equal(
    (
      await request(
        "PUT",
        { type: "new_message", channel: "none" },
        "https://evil.test"
      )
    ).status,
    403
  )
  assert.equal(
    (await request("PUT", { type: "new_message", channel: "none" })).status,
    200
  )
  assert.equal((await s.preferences.list(actor))[0].channel, "none")
  assert.equal((await s.preferences.list(other)).length, 0)
  for (const path of [
    "/api/notifications/test",
    "/api/notifications/email/test",
  ])
    assert.equal((await request("POST", {}, undefined, path)).status, 410)
  assert.equal(
    (
      await request(
        "POST",
        { type: "new_message" },
        undefined,
        "/api/notifications/events"
      )
    ).status,
    404
  )
  identity = null
  assert.equal((await request()).status, 401)
})
