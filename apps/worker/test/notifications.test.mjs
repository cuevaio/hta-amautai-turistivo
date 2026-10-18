import { URL } from "node:url"
import crypto from "node:crypto"
import worker from "../src/index.ts"
import { test } from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { d1Notifications } from "../src/modules/notifications/infrastructure/d1-notifications.ts"
import {
  notificationService,
  dispatchNotifications,
} from "../src/modules/notifications/application/service.ts"
import { verificationCrypto } from "../src/modules/notifications/infrastructure/crypto.ts"
import { createApp } from "../src/app.ts"
function setup() {
  const db = new DatabaseSync(":memory:")
  for (const name of readdirSync(new URL("../migrations/", import.meta.url))
    .filter((name) => name.endsWith(".sql"))
    .sort())
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
  async function registered() {
    await service.register(actor, "+51999999999")
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
    registered,
    connected(value) {
      connected = value
    },
    fail(value) {
      fail = value
    },
  }
}
test("direct registration enables notifications without OTP or gateway connectivity", async () => {
  const s = setup()
  await assert.rejects(
    s.service.schedule(s.actor, {
      title: "Recordatorio",
      scheduledAt: s.now,
      requestKey: crypto.randomUUID(),
    }),
    /whatsapp_not_registered/
  )
  s.connected(false)
  await s.registered()
  const contact = await s.repo.contact(s.actor)
  assert.equal(contact.enabled, 1)
  assert.equal(contact.verified_at, null)
  assert.equal(contact.consent_at, s.now)
  const overview = await s.service.overview(s.actor)
  assert.equal(overview.contact.registered, true)
  assert.equal("verified" in overview.contact, false)
  assert.equal(overview.notifications.length, 0)
  const reminder = await s.service.schedule(s.actor, {
    title: "Recordatorio",
    scheduledAt: s.now,
    requestKey: crypto.randomUUID(),
  })
  assert.equal(reminder.status, "pending")
  assert.equal(reminder.phone, "+51999999999")
})
test("saving the same phone preserves reminders; changing it cancels stale recipients and clears challenges", async () => {
  const s = setup()
  await s.registered()
  const reminder = await s.service.schedule(s.actor, {
    title: "Recordatorio",
    scheduledAt: s.now,
    requestKey: crypto.randomUUID(),
  })
  await s.registered()
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(reminder.id)
      .status,
    "pending"
  )
  s.db.exec(
    "UPDATE notification_contacts SET verified_at=1,challenge_id='old',challenge_hash='old',challenge_expires=9999999999999"
  )
  await s.service.register(s.actor, "+51988888888")
  const contact = await s.repo.contact(s.actor)
  assert.equal(contact.phone, "+51988888888")
  assert.equal(contact.enabled, 1)
  assert.equal(contact.verified_at, null)
  assert.equal(contact.challenge_expires, null)
  assert.equal(
    s.db.prepare("SELECT status FROM notifications WHERE id=?").get(reminder.id)
      .status,
    "cancelled"
  )
  const next = await s.service.schedule(s.actor, {
    title: "Nuevo destino",
    scheduledAt: s.now,
    requestKey: crypto.randomUUID(),
  })
  assert.equal(next.phone, "+51988888888")
})
test("direct registration isolates users in the same tenant", async () => {
  const s = setup()
  await s.registered()
  const other = { ...s.actor, userId: "bob" }
  await s.service.register(other, "+51988888888")
  assert.equal((await s.repo.contact(s.actor)).phone, "+51999999999")
  assert.equal((await s.repo.contact(other)).phone, "+51988888888")
  await s.service.preferences(other, false, "America/Lima")
  assert.equal((await s.repo.contact(s.actor)).enabled, 1)
})
test("unverified direct recipients retain daily limits and idempotent retries", async () => {
  const s = setup()
  await s.registered()
  let first
  for (let i = 0; i < 20; i++) {
    const input = {
      title: "Recordatorio " + i,
      scheduledAt: s.now,
      requestKey: crypto.randomUUID(),
    }
    await s.service.schedule(s.actor, input)
    first ||= input
  }
  await assert.rejects(
    s.service.schedule(s.actor, {
      title: "Demasiados",
      scheduledAt: s.now,
      requestKey: crypto.randomUUID(),
    }),
    /notification_rate_limited/
  )
  assert.ok((await s.service.schedule(s.actor, first)).id)
  const other = { ...s.actor, userId: "bob" }
  await s.service.register(other, "+51999999999")
  await assert.rejects(
    s.service.schedule(other, {
      title: "Mismo destinatario",
      scheduledAt: s.now,
      requestKey: crypto.randomUUID(),
    }),
    /notification_rate_limited/
  )
})
test("reminder idempotency, ownership, consent revocation and cancellation use real SQL", async () => {
  const s = setup()
  await s.registered()
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
    /whatsapp_not_registered/
  )
})
test("dispatcher atomically leases, retries with stable IDs, reconciles delivery and expires messages", async () => {
  const s = setup()
  await s.registered()
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
  for (const phone of [
    "",
    "+000",
    "not-phone",
    "++51999999999",
    "1234567890123456",
  ]) {
    assert.equal(
      (
        await request("/api/notifications/phone", "POST", {
          phone,
          consent: true,
        })
      ).status,
      400
    )
  }
  const saved = await request("/api/notifications/phone", "POST", {
    phone: "51 999-999-999",
    consent: true,
  })
  assert.equal(saved.status, 200)
  assert.deepEqual(await saved.json(), { registered: true, enabled: true })
  const overview = await (await request("/api/notifications")).json()
  assert.equal(overview.contact.phone, "+51999999999")
  assert.equal(overview.contact.registered, true)
  assert.equal(overview.notifications.length, 0)
  assert.equal(
    (await request("/api/notifications/verify", "POST", { code: "123456" }))
      .status,
    404
  )
  assert.equal(
    (
      await request("/api/notifications/test", "POST", {
        requestKey: crypto.randomUUID(),
      })
    ).status,
    410
  )
  assert.equal(
    (await (await request("/api/notifications")).json()).notifications.length,
    0
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

// Registration and delivery exercise the same persistent SQL outboxes as production.
import { d1Profiles } from "../src/modules/profiles/infrastructure/d1-profiles.ts"
import { dispatchProfileWelcomes } from "../src/modules/profiles/application/service.ts"
import { accountProfileInput } from "../../../packages/contracts/src/index.ts"

function registrationApp(s) {
  let user = "alice"
  const background = []
  const app = createApp(
    async () =>
      user
        ? {
            sessionId: "registration-test",
            user: {
              id: user,
              email: user + "@example.test",
              emailVerified: true,
            },
          }
        : null,
    undefined,
    () => s.gateway
  )
  return {
    async flush() {
      await Promise.all(background.splice(0))
    },
    user(value) {
      user = value
    },
    request(body, origin = "https://amautai.test", csrf = true) {
      return app.request(
        "https://amautai.test/api/profile",
        {
          method: "PUT",
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
            ...(csrf ? { "X-Amautai-Request": "1" } : {}),
          },
          body: JSON.stringify(body),
        },
        { DB: s.DB, APP_ORIGINS: "https://amautai.test" },
        {
          waitUntil(task) {
            background.push(task)
          },
          passThroughOnException() {},
          props: {},
        }
      )
    },
  }
}
const registration = {
  role: "teacher",
  phone: "51 999-999-999",
  consent: true,
  locale: "es-PE",
}

test("teacher and parent registration immediately dispatch one localized welcome via the gateway", async () => {
  for (const role of ["teacher", "parent"])
    for (const locale of ["es-PE", "quy-PE", "ay-PE"]) {
      const s = setup(),
        http = registrationApp(s),
        profiles = d1Profiles(s.DB)
      s.actor.tenantId = "user:alice"
      const response = await http.request({ ...registration, role, locale })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).profile.role, role)
      await http.flush()
      assert.equal((await profiles.pendingWelcomes(Date.now())).length, 0)
      assert.equal((await s.repo.contact(s.actor)).phone, "+51999999999")
      const [message] = await s.repo.list(s.actor)
      assert.equal(message.status, "accepted")
      assert.ok(message.body.includes("https://amautai.turistivo.com/panel"))
      const titles = {
        "es-PE": "¡Bienvenido a Amautai!",
        "quy-PE": "¡Amautaiman allin hamusqa!",
        "ay-PE": "¡Amautairu suma jutäwi!",
      }
      assert.equal(message.title, titles[locale])
      assert.match(
        message.body,
        role === "teacher"
          ? /estudiantes|Yachakuqnikikunapaq|Yatiqirinakamataki/
          : /hijos|wawaykikunapa|wawanakamana/
      )
      assert.deepEqual(s.sent, [message.id])
      await http.request({ ...registration, role, locale })
      await http.flush()
      assert.deepEqual(s.sent, [message.id])
      await dispatchNotifications(s.repo, s.gateway)
      assert.equal((await s.repo.list(s.actor))[0].status, "delivered")
      // Completed events retain only idempotency metadata, no duplicate phone copy.
      assert.equal(
        s.db.prepare("SELECT phone FROM profile_welcomes").get().phone,
        null
      )
    }
})

test("registration rejects missing/invalid phone, consent, locale and untrusted scope before saving", async () => {
  const s = setup(),
    http = registrationApp(s)
  for (const body of [
    { role: "teacher" },
    { ...registration, phone: "" },
    { ...registration, phone: "+000" },
    { ...registration, phone: "++51999999999" },
    { ...registration, phone: "1234567890123456" },
    { ...registration, phone: "+519999999999" },
    { ...registration, phone: "+12025550123" },
    { ...registration, phone: "+51899999999" },
    { ...registration, consent: false },
    { ...registration, locale: "en" },
    { ...registration, tenantId: "evil" },
    { ...registration, userId: "bob" },
  ]) {
    assert.equal((await http.request(body)).status, 400)
  }
  assert.equal(await d1Profiles(s.DB).find(s.actor), null)
  assert.equal((await d1Profiles(s.DB).pendingWelcomes(Date.now())).length, 0)
  assert.equal(
    (await http.request(registration, "https://evil.test")).status,
    403
  )
  assert.equal((await http.request(registration, undefined, false)).status, 403)
  http.user(null)
  assert.equal((await http.request(registration)).status, 401)
  assert.equal(accountProfileInput.parse(registration).phone, "+51999999999")
})

test("registration responds while its immediate gateway send is still pending", async () => {
  const s = setup()
  let release, started
  const sending = new Promise((resolve) => {
    started = resolve
  })
  s.gateway.send = async (item) => {
    s.sent.push(item.id)
    started()
    await new Promise((resolve) => {
      release = resolve
    })
    return { status: "accepted" }
  }
  const http = registrationApp(s)
  const response = await http.request(registration)
  assert.equal(response.status, 200)
  await sending
  assert.equal(s.sent.length, 1)
  release()
  await http.flush()
})

test("immediate welcome dispatch is scoped to the registered account and survives gateway failures", async () => {
  const s = setup()
  const oldActor = { ...s.actor }
  const profiles = d1Profiles(s.DB)
  await profiles.save(oldActor, accountProfileInput.parse(registration))
  await s.service.welcome({
    ...oldActor,
    ...accountProfileInput.parse(registration),
    createdAt: Date.now(),
  })
  const [oldMessage] = await s.repo.list(oldActor)
  s.fail(true)
  const http = registrationApp(s)
  assert.equal(
    (await http.request({ ...registration, role: "parent" })).status,
    200
  )
  await http.flush()
  const actor = { tenantId: "user:alice", userId: "alice" }
  assert.equal((await profiles.find(actor)).role, "parent")
  assert.equal((await s.repo.list(oldActor))[0].status, "pending")
  assert.equal(s.sent.includes(oldMessage.id), false)
  const [welcome] = await s.repo.list(actor)
  assert.equal(welcome.status, "pending")
  assert.deepEqual(s.sent, [welcome.id])
  s.fail(false)
  await dispatchNotifications(s.repo, s.gateway, Date.now() + 200000, {
    ...actor,
    requestKey: "account-welcome-v1",
  })
  assert.deepEqual(s.sent, [welcome.id, welcome.id])
  assert.equal((await s.repo.list(actor)).length, 1)
  assert.equal((await s.repo.list(oldActor))[0].status, "pending")
})

test("profile registration and welcome event roll back together on storage failure", async () => {
  const s = setup()
  s.db.exec(
    "CREATE TRIGGER fail_welcome BEFORE INSERT ON profile_welcomes BEGIN SELECT RAISE(ABORT,'storage unavailable'); END"
  )
  await assert.rejects(
    d1Profiles(s.DB).save(s.actor, accountProfileInput.parse(registration)),
    /storage unavailable/
  )
  assert.equal(await d1Profiles(s.DB).find(s.actor), null)
})

test("welcome retries survive queue/ack failures and never replace a stable gateway job", async () => {
  const s = setup(),
    profiles = d1Profiles(s.DB)
  await profiles.save(s.actor, accountProfileInput.parse(registration))
  await dispatchProfileWelcomes(profiles, async () => {
    throw Error("temporary outage")
  })
  assert.equal((await profiles.pendingWelcomes(Date.now())).length, 1)
  await dispatchProfileWelcomes(
    {
      ...profiles,
      completeWelcome: async () => {
        throw Error("ack failed")
      },
    },
    (event) => s.service.welcome(event)
  )
  const [first] = await s.repo.list(s.actor)
  await dispatchProfileWelcomes(profiles, (event) => s.service.welcome(event))
  assert.equal((await s.repo.list(s.actor)).length, 1)
  assert.equal((await s.repo.list(s.actor))[0].id, first.id)
  s.fail(true)
  await dispatchNotifications(s.repo, s.gateway)
  s.fail(false)
  await dispatchNotifications(s.repo, s.gateway, Date.now() + 200000)
  assert.deepEqual(s.sent, [first.id, first.id])
  await profiles.save(s.actor, {
    ...accountProfileInput.parse(registration),
    role: "parent",
    phone: "+51988888888",
  })
  assert.equal((await profiles.pendingWelcomes(Date.now())).length, 0)
  assert.equal((await s.repo.contact(s.actor)).phone, "+51999999999")
})

test("deferred welcome respects opt-out and updated recipients, and isolates accounts", async () => {
  for (const change of ["optout", "phone"]) {
    const s = setup(),
      profiles = d1Profiles(s.DB)
    await profiles.save(s.actor, accountProfileInput.parse(registration))
    await s.registered()
    if (change === "optout")
      await s.service.preferences(s.actor, false, "America/Lima")
    else await s.service.register(s.actor, "+51988888888")
    await dispatchProfileWelcomes(profiles, (event) => s.service.welcome(event))
    assert.equal((await s.repo.list(s.actor)).length, 0)
    const contact = await s.repo.contact(s.actor)
    assert.equal(contact.enabled, change === "optout" ? 0 : 1)
    assert.equal(
      contact.phone,
      change === "phone" ? "+51988888888" : "+51999999999"
    )
  }
  const s = setup(),
    http = registrationApp(s)
  s.actor.tenantId = "user:alice"
  await http.request(registration)
  await http.flush()
  http.user("bob")
  await http.request({ ...registration, role: "parent", phone: "+51988888888" })
  await http.flush()
  await dispatchProfileWelcomes(d1Profiles(s.DB), (event) =>
    s.service.welcome(event)
  )
  assert.equal((await s.repo.list(s.actor)).length, 1)
  assert.equal(
    (await s.repo.list({ tenantId: "user:bob", userId: "bob" })).length,
    1
  )
  assert.equal((await s.repo.list({ ...s.actor, userId: "bob" })).length, 0)
})

test("expired registrations release their phone data without sending a late welcome", async () => {
  const s = setup(),
    profiles = d1Profiles(s.DB)
  await profiles.save(s.actor, accountProfileInput.parse(registration))
  await dispatchProfileWelcomes(
    profiles,
    (event) => s.service.welcome(event),
    Date.now() + 86400001
  )
  assert.equal((await s.repo.list(s.actor)).length, 0)
  assert.equal(
    s.db.prepare("SELECT phone FROM profile_welcomes").get().phone,
    null
  )
})
