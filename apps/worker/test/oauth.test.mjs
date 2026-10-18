import { createAuthService } from "../src/modules/auth/application/auth-service.ts"
import { workosGateway } from "../src/modules/auth/infrastructure/workos.ts"
import { webcrypto as crypto } from "node:crypto"
import { TextEncoder } from "node:util"
import { test } from "node:test"
import assert from "node:assert/strict"
import { Hono } from "hono"
import { EncryptJWT } from "jose"
import { finishOAuth } from "../src/modules/auth/http/sessions.ts"
import { registerPasswordRoutes } from "../src/modules/auth/http/password-routes.ts"

const origin = "https://amautai.test"
const env = { APP_ORIGINS: origin, WORKOS_CLIENT_ID: "client_oauth_fixture", WORKOS_API_KEY: "fixture-key", WORKOS_COOKIE_PASSWORD: "a-long-test-cookie-secret-that-is-not-a-real-credential" }
async function flowCookie(overrides = {}) {
  const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env.WORKOS_COOKIE_PASSWORD)))
  const value = await new EncryptJWT({ state: "fixture-state", verifier: "fixture-verifier", origin, ...overrides })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" }).setIssuedAt().setExpirationTime("10m").encrypt(key)
  return "amautai-oauth=" + value
}
function setup(error) {
  const calls = []
  const service = {
    async authenticateWithCode(input) {
      calls.push(["code", input])
      if (error) throw error
      return { sealedSession: "fixture-oauth-session" }
    },
    async authenticateWithEmailVerification(input) { calls.push(["verify", input]); return { sealedSession: "fixture-verified-oauth-session" } },
  }
  const factory = () => createAuthService(workosGateway({ userManagement: service }))
  const app = new Hono()
  app.get("/callback", c => finishOAuth(c, factory))
  registerPasswordRoutes(app, factory)
  return { calls, app }
}
test("OAuth email verification continues inside the app and completes a sealed session", async () => {
  const { app, calls } = setup({ code: "email_verification_required", rawData: { pending_authentication_token: "fixture-pending-oauth-token" } })
  const response = await app.request(origin + "/callback?state=fixture-state&code=fixture-code", { headers: { Cookie: await flowCookie() } }, env)
  assert.equal(response.status, 302)
  assert.equal(response.headers.get("location"), "/verificar-correo")
  assert.equal(calls[0][1].codeVerifier, "fixture-verifier")
  const cookie = response.headers.getSetCookie().find(value => value.startsWith("amautai-verification="))
  assert.ok(cookie)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /Secure/)
  assert.match(cookie, /SameSite=Strict/)
  assert.match(cookie, /Max-Age=600/)
  assert.ok(!cookie.includes("fixture-pending-oauth-token"))
  assert.ok(!response.headers.get("location").includes("fixture"))
  const verified = await app.request(origin + "/api/auth/verify-email", { method: "POST", headers: { Cookie: cookie.split(";")[0], "Content-Type": "application/json" }, body: JSON.stringify({ code: "123456" }) }, env)
  assert.equal(verified.status, 200)
  assert.equal(calls[1][1].pendingAuthenticationToken, "fixture-pending-oauth-token")
  assert.match(verified.headers.get("set-cookie"), /amautai-session=fixture-verified-oauth-session/)
})
test("OAuth rejects state mismatches and foreign return origins before code exchange", async () => {
  const { app, calls } = setup()
  for (const [state, overrides] of [["wrong-state", {}], ["fixture-state", { origin: "https://other.test" }]]) {
    const response = await app.request(origin + "/callback?state=" + state + "&code=fixture-code", { headers: { Cookie: await flowCookie(overrides) } }, env)
    assert.equal(response.headers.get("location"), "/iniciar-sesion?error=oauth_state")
    assert.ok(!response.headers.get("set-cookie").includes("amautai-verification="))
  }
  assert.equal(calls.length, 0)
})
test("OAuth without an email challenge returns to the dashboard with a sealed session", async () => {
  const { app } = setup()
  const response = await app.request(origin + "/callback?state=fixture-state&code=fixture-code", { headers: { Cookie: await flowCookie() } }, env)
  assert.equal(response.headers.get("location"), origin + "/panel/proyectos")
  assert.match(response.headers.get("set-cookie"), /amautai-session=fixture-oauth-session/)
})
