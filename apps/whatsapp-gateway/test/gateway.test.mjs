import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createStore } from "../src/store.ts"
import { apiServer } from "../src/http.ts"
const key = "a".repeat(64),
  token = "b".repeat(48)
test("authentication state is encrypted and survives reopen; interrupted sends become uncertain", () => {
  const dir = mkdtempSync(join(tmpdir(), "amautai-gateway-"))
  try {
    const path = join(dir, "db.sqlite")
    const s = createStore(path, key)
    s.setAuth("creds", {
      secret: "sensitive-auth-state",
      bytes: Buffer.from("hello"),
    })
    assert.equal(s.getAuth("creds").bytes.toString(), "hello")
    s.insert({
      id: "one",
      phone: "+51999999999",
      text: "Hello",
      expiresAt: Date.now() + 60000,
    })
    s.sending("one", "wa-one", "user@s.whatsapp.net")
    s.db.close()
    assert.ok(!readFileSync(path).includes(Buffer.from("sensitive-auth-state")))
    const next = createStore(path, key)
    assert.equal(next.find("one").status, "uncertain")
    assert.equal(next.getAuth("creds").secret, "sensitive-auth-state")
    next.receipt("wa-one", "delivered")
    next.receipt("wa-one", "sent")
    assert.equal(next.find("one").status, "delivered")
    next.receipt("wa-one", "read")
    assert.equal(next.find("one").status, "read")
    next.db.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test("gateway API rejects unauthenticated/invalid requests, deduplicates and never queues while offline", async () => {
  const store = createStore(":memory:", key)
  let connection = "connected"
  const server = apiServer(store, token, () => ({ connection }))
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const base = "http://127.0.0.1:" + server.address().port
  const call = (path, body, auth = token) =>
    fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + auth,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  try {
    assert.equal((await call("/connection", null, "wrong")).status, 401)
    assert.equal((await call("/connection")).status, 200)
    const body = {
      id: "job-one",
      phone: "+51999999999",
      text: "Hello",
      expiresAt: Date.now() + 60000,
    }
    assert.equal((await call("/notifications", body)).status, 202)
    assert.equal((await call("/notifications", body)).status, 200)
    assert.equal(store.db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n, 1)
    assert.equal(
      (await call("/notifications", { ...body, text: "different" })).status,
      409
    )
    assert.equal(
      (await call("/notifications", { ...body, id: "two", phone: "wrong" }))
        .status,
      400
    )
    connection = "needs_pairing"
    assert.equal(
      (await call("/notifications", { ...body, id: "offline" })).status,
      503
    )
    assert.equal(store.find("offline"), undefined)
    assert.equal((await call("/notifications/job-one")).status, 200)
    assert.equal((await call("/qr.png")).status, 404)
    assert.equal((await call("/notifications/missing")).status, 404)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    store.db.close()
  }
})

test("private administration supports pairing codes and rejects cross-origin mutations", async () => {
  const { adminServer } = await import("../src/admin.ts")
  let pairingCode = null,
    requests = 0
  const admin = adminServer({
    state: () => ({ connection: "needs_pairing", qr: null, pairingCode }),
    async pair(phone) {
      assert.equal(phone, "51999999999")
      requests++
      pairingCode = "ABCD1234"
      return pairingCode
    },
    reset() {},
  })
  await new Promise((resolve) => admin.listen(0, "127.0.0.1", resolve))
  const base = "http://127.0.0.1:" + admin.address().port
  try {
    assert.ok(
      (await (await fetch(base)).text()).includes(
        "Obtener código de 8 caracteres"
      )
    )
    assert.equal(
      (
        await fetch(base + "/pair", {
          method: "POST",
          headers: { Origin: "https://evil.test" },
          body: "phone=51999999999",
        })
      ).status,
      403
    )
    assert.equal(requests, 0)
    assert.equal(
      (
        await fetch(base + "/pair", {
          method: "POST",
          headers: {
            Origin: base,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "phone=51999999999",
          redirect: "manual",
        })
      ).status,
      303
    )
    assert.equal(requests, 1)
    assert.ok((await (await fetch(base)).text()).includes("ABCD-1234"))
  } finally {
    await new Promise((resolve) => admin.close(resolve))
  }
})

test("pairing waits for socket readiness, uses a supported browser, reuses codes and clears stale state", async () => {
  const { EventEmitter } = await import("node:events")
  const { connectWhatsApp } = await import("../src/baileys.ts")
  const store = createStore(":memory:", key),
    events = new EventEmitter()
  let calls = 0,
    options
  const socket = {
    ev: events,
    authState: { creds: { registered: false } },
    async requestPairingCode() {
      calls++
      return "ABCD1234"
    },
    end() {},
  }
  const wa = connectWhatsApp(store, (input) => {
    options = input
    return socket
  })
  try {
    assert.equal(options.browser[1], "Chrome")
    assert.equal(options.shouldSyncHistoryMessage, undefined)
    await assert.rejects(wa.pair("51999999999"))
    events.emit("connection.update", { qr: "mock-qr" })
    assert.equal(await wa.pair("51999999999"), "ABCD1234")
    assert.equal(await wa.pair("51999999999"), "ABCD1234")
    assert.equal(calls, 1)
    events.emit("connection.update", { connection: "close" })
    assert.equal(wa.state().pairingCode, null)
  } finally {
    wa.stop()
    store.db.close()
  }
})
