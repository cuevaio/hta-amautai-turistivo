import { createAuthService } from "../src/modules/auth/application/auth-service.ts"
import { workosGateway } from "../src/modules/auth/infrastructure/workos.ts"
import { test } from "node:test"
import assert from "node:assert/strict"
import { Hono } from "hono"
import { registerRecoveryRoutes } from "../src/modules/auth/http/recovery-routes.ts"
const env = { WORKOS_API_KEY: "fixture", WORKOS_CLIENT_ID: "client_fixture", WORKOS_COOKIE_PASSWORD: "fixture-cookie-password-over-thirty-two-characters" }
function setup(overrides = {}) {
  const calls = []
  const service = {
    async createPasswordReset(body) { calls.push(["request", body]); return { passwordResetToken: "secret-not-for-client" } },
    async resetPassword(body) { calls.push(["reset", body]); return { user: { id: "user_fixture" } } },
    ...overrides,
  }
  const app = new Hono()
  registerRecoveryRoutes(app, () => createAuthService(workosGateway({ userManagement: service })))
  return { calls, async request(path, body, cookie, bindings = env) {
    return app.request("https://amautai.test/api/auth/" + path, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, bindings)
  } }
}
function cookie(response) { return response.headers.get("set-cookie")?.split(";")[0] }
test("recovery sends only a validated email and never exposes reset credentials", async () => {
  const s = setup()
  assert.equal((await s.request("forgot-password", { email: "invalid" })).status, 400)
  assert.equal((await s.request("forgot-password", { email: "user@example.test", redirect: "https://evil.test" })).status, 400)
  assert.equal(s.calls.length, 0)
  const response = await s.request("forgot-password", { email: "user@example.test" })
  assert.deepEqual(await response.json(), { sent: true })
  assert.deepEqual(s.calls[0], ["request", { email: "user@example.test" }])
})
test("unknown and registered emails return the same confirmation", async () => {
  const known = setup()
  const missing = setup({ async createPasswordReset() { throw { status: 404 } } })
  assert.deepEqual(await (await known.request("forgot-password", { email: "known@example.test" })).json(), await (await missing.request("forgot-password", { email: "unknown@example.test" })).json())
})
test("recovery reports rate limits and upstream failures instead of claiming success", async () => {
  for (const status of [400, 401, 403, 422, 500, 503]) {
    const s = setup({ async createPasswordReset() { throw { status } } })
    assert.equal((await s.request("forgot-password", { email: "user@example.test" })).status, 503)
  }
  const s = setup({ async createPasswordReset() { throw { status: 429 } } })
  assert.equal((await s.request("forgot-password", { email: "user@example.test" })).status, 429)
})
test("email link exchanges its token for an encrypted HttpOnly cookie and a clean URL", async () => {
  const s = setup()
  const response = await s.request("password-reset/start?token=fixture-reset-token")
  assert.equal(response.headers.get("location"), "/restablecer-contrasena")
  assert.equal(response.headers.get("referrer-policy"), "no-referrer")
  assert.match(response.headers.get("set-cookie"), /HttpOnly/)
  assert.match(response.headers.get("set-cookie"), /Secure/)
  assert.ok(!cookie(response).includes("fixture-reset-token"))
  assert.deepEqual(await (await s.request("password-reset/status", undefined, cookie(response))).json(), { valid: true })
  const reset = await s.request("reset-password", { newPassword: "A-safe-fixture-password-87" }, cookie(response))
  assert.deepEqual(await reset.json(), { reset: true })
  assert.deepEqual(s.calls.at(-1), ["reset", { token: "fixture-reset-token", newPassword: "A-safe-fixture-password-87" }])
  assert.match(reset.headers.get("set-cookie"), /amautai-session=;/)
})
test("missing, tampered and other-application reset cookies cannot change a password", async () => {
  const s = setup()
  assert.equal((await s.request("reset-password", { newPassword: "A-safe-fixture-password-87" })).status, 401)
  assert.equal((await s.request("reset-password", { newPassword: "A-safe-fixture-password-87" }, "amautai-password-reset=forged")).status, 401)
  const start = await s.request("password-reset/start?token=fixture-reset-token")
  assert.equal((await s.request("reset-password", { newPassword: "A-safe-fixture-password-87" }, cookie(start), { ...env, WORKOS_CLIENT_ID: "client_other" })).status, 401)
  assert.equal(s.calls.length, 0)
})
test("reset validates password strength before calling WorkOS and preserves cookie for policy retry", async () => {
  const s = setup({ async resetPassword() { throw { code: "password_strength_error" } } })
  const start = await s.request("password-reset/start?token=fixture")
  assert.equal((await s.request("reset-password", { newPassword: "short" }, cookie(start))).status, 400)
  const response = await s.request("reset-password", { newPassword: "A-long-but-rejected-password" }, cookie(start))
  assert.deepEqual(await response.json(), { error: "password_policy" })
  assert.equal(response.headers.get("set-cookie"), null)
})
