import { createAuthService } from "../src/modules/auth/application/auth-service.ts"
import { workosGateway } from "../src/modules/auth/infrastructure/workos.ts"
import { test } from "node:test"
import assert from "node:assert/strict"
import { Hono } from "hono"
import { registerPasswordRoutes } from "../src/modules/auth/http/password-routes.ts"
const registration = { email: "new@example.test", firstName: "New", password: "A-strong-test-password-79" }
const env = { WORKOS_API_KEY: "fixture-key", WORKOS_CLIENT_ID: "client_fixture", WORKOS_COOKIE_PASSWORD: "a-test-cookie-secret-with-more-than-thirty-two-characters" }
function setup(overrides = {}) {
  const calls = []
  const service = {
    async createUser(input) { calls.push(["create", input]); return { id: "user_fixture" } },
    async authenticateWithPassword(input) { calls.push(["password", input]); return { sealedSession: "fixture-session" } },
    async authenticateWithEmailVerification(input) { calls.push(["verify", input]); return { sealedSession: "fixture-verified-session" } },
    ...overrides,
  }
  const app = new Hono()
  registerPasswordRoutes(app, () => createAuthService(workosGateway({ userManagement: service })))
  return { calls, async request(path, body, cookie) {
    return app.request("https://amautai.test/api/auth/" + path, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) }, env)
  } }
}
const verificationError = { code: "email_verification_required", rawData: { pending_authentication_token: "fixture-pending-token" } }
function pendingCookie(response) {
  return response.headers.getSetCookie().filter(value => value.startsWith("amautai-verification=") && !value.startsWith("amautai-verification=;")).at(-1)?.split(";")[0]
}
test("signup validates input and rejects attempts to bypass email verification", async () => {
  const s = setup()
  for (const body of [{ ...registration, email: "invalid" }, { ...registration, password: "short" }, { ...registration, emailVerified: true }, { ...registration, firstName: "" }]) assert.equal((await s.request("signup", body)).status, 400)
  assert.equal(s.calls.length, 0)
})
test("signup creates a user then authenticates with a sealed HttpOnly session", async () => {
  const s = setup()
  const response = await s.request("signup", registration)
  assert.equal(response.status, 200)
  assert.equal((await response.json()).authenticated, true)
  assert.equal(s.calls[0][0], "create")
  assert.equal(s.calls[0][1].emailVerified, undefined)
  assert.equal(s.calls[1][0], "password")
  assert.equal(s.calls[1][1].session.sealSession, true)
  assert.match(response.headers.get("set-cookie"), /amautai-session=fixture-session/)
  assert.match(response.headers.get("set-cookie"), /HttpOnly/)
  assert.match(response.headers.get("set-cookie"), /Secure/)
})
test("verification challenge is encrypted in a short-lived cookie and never exposed in JSON", async () => {
  const s = setup({ async authenticateWithPassword() { throw verificationError } })
  const response = await s.request("signup", registration)
  assert.deepEqual(await response.json(), { verificationRequired: true })
  const cookie = pendingCookie(response)
  assert.ok(cookie)
  assert.ok(!cookie.includes("fixture-pending-token"))
  assert.match(response.headers.get("set-cookie"), /Max-Age=600/)
  const verified = await s.request("verify-email", { code: "123456" }, cookie)
  assert.equal(verified.status, 200)
  assert.equal(s.calls.at(-1)[1].pendingAuthenticationToken, "fixture-pending-token")
  assert.equal(s.calls.at(-1)[1].code, "123456")
  assert.match(verified.headers.get("set-cookie"), /amautai-session=fixture-verified-session/)
})
test("verification rejects missing or forged cookies and invalid codes", async () => {
  const s = setup()
  assert.equal((await s.request("verify-email", { code: "123456" })).status, 401)
  assert.equal((await s.request("verify-email", { code: "123456" }, "amautai-verification=forged")).status, 401)
  assert.equal((await s.request("verify-email", { code: "123" })).status, 400)
  assert.equal(s.calls.length, 0)
})
test("incorrect verification code preserves the challenge for retry", async () => {
  const s = setup({ async authenticateWithPassword() { throw verificationError }, async authenticateWithEmailVerification() { throw { code: "invalid_code" } } })
  const signup = await s.request("signup", registration)
  const response = await s.request("verify-email", { code: "000000" }, pendingCookie(signup))
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: "verification_failed" })
  assert.ok(!response.headers.get("set-cookie")?.includes("amautai-session="))
})
test("password login resumes email verification for an existing unverified user", async () => {
  const s = setup({ async authenticateWithPassword() { throw verificationError } })
  const response = await s.request("password", { email: registration.email, password: registration.password })
  assert.deepEqual(await response.json(), { verificationRequired: true })
  assert.ok(pendingCookie(response))
})
test("signup errors do not expose upstream details or tokens", async () => {
  const s = setup({ async createUser() { throw { code: "email_exists", message: "sensitive-provider-detail" } } })
  assert.deepEqual(await (await s.request("signup", registration)).json(), { error: "signup_failed" })
  const weak = setup({ async createUser() { throw { code: "password_strength_error" } } })
  assert.deepEqual(await (await weak.request("signup", registration)).json(), { error: "password_policy" })
})

test("password login distinguishes network outages and rate limits from wrong credentials", async () => {
  for (const error of [new TypeError("network unavailable"), { status: 503 }, { status: 401 }, { status: 403 }]) {
    const s = setup({ async authenticateWithPassword() { throw error } })
    const response = await s.request("password", { email: registration.email, password: registration.password })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "auth_unavailable" })
  }
  const limited = setup({ async authenticateWithPassword() { throw { status: 429 } } })
  assert.equal((await limited.request("password", { email: registration.email, password: registration.password })).status, 429)
  const rejected = setup({ async authenticateWithPassword() { throw { status: 400, code: "invalid_credentials" } } })
  assert.equal((await rejected.request("password", { email: registration.email, password: registration.password })).status, 401)
})
test("signup does not misreport a network outage as an existing account", async () => {
  const s = setup({ async createUser() { throw new TypeError("network unavailable") } })
  const response = await s.request("signup", registration)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: "auth_unavailable" })
})
