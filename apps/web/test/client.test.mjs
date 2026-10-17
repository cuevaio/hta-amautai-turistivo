import { test } from "node:test"
import assert from "node:assert/strict"
import { api, ApiError } from "../src/shared/api/client.ts"

test("transport retains cookie/CSRF defaults and merges Headers without losing caller headers", async (t) => {
  let request
  t.mock.method(globalThis, "fetch", async (path, options) => {
    request = { path, ...options }
    return new Response(JSON.stringify({ saved: true }), { status: 200 })
  })
  assert.deepEqual(
    await api("/api/projects", {
      method: "POST",
      headers: new Headers({ "X-Trace": "fixture" }),
      body: "{}",
    }),
    { saved: true }
  )
  assert.equal(request.credentials, "same-origin")
  assert.equal(request.cache, "no-store")
  assert.equal(request.headers.get("X-Amautai-Request"), "1")
  assert.equal(request.headers.get("X-Trace"), "fixture")
  assert.equal(request.headers.get("Content-Type"), "application/json")
  assert.ok(request.signal instanceof AbortSignal)
})
test("transport returns typed HTTP errors for auth and stale writes without exposing provider detail", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({ error: "version_conflict", detail: "private" }),
        { status: 409 }
      )
  )
  await assert.rejects(
    api("/api/projects/fixture"),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      !error.message.includes("private")
  )
  globalThis.fetch.mock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  )
  await assert.rejects(
    api("/api/auth/session"),
    (error) => error instanceof ApiError && error.status === 401
  )
})
test("transport forwards cancellation to pending requests", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (_path, options) =>
      new Promise((resolve, reject) => {
        options.signal.addEventListener(
          "abort",
          () => reject(options.signal.reason),
          { once: true }
        )
      })
  )
  const controller = new AbortController()
  const pending = api("/api/projects", { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, (error) => error.name === "AbortError")
})
