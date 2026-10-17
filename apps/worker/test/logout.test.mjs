import { test } from "node:test"
import assert from "node:assert/strict"
import { createApp } from "../src/app.ts"

const env = { APP_ORIGINS: "https://amautai.test" }
const identity = { user: { id: "user_amautai" }, sessionId: "session_verified" }
function request(app, origin = "https://amautai.test") {
  return app.request("https://amautai.test/api/auth/logout", {
    method: "POST",
    headers: { Origin: origin, "X-Amautai-Request": "1" },
  }, env)
}
test("logout revokes the verified session and expires the browser cookie", async () => {
  let revoked
  const app = createApp(async () => identity, () => ({ userManagement: { async revokeSession(input) { revoked = input.sessionId } } }))
  const response = await request(app)
  assert.equal(response.status, 200)
  assert.equal(revoked, "session_verified")
  assert.match(response.headers.get("set-cookie"), /amautai-session=;.*Max-Age=0/i)
})
test("logout keeps its cookie and offers retry when revocation fails", async () => {
  const app = createApp(async () => identity, () => ({ userManagement: { async revokeSession() { throw new Error("unavailable") } } }))
  const response = await request(app)
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error, "logout_unavailable")
  assert.equal(response.headers.get("set-cookie"), null)
})
test("logout is idempotent for expired sessions and still enforces the allowed origin", async () => {
  const app = createApp(async () => null)
  assert.equal((await request(app, "https://other.test")).status, 403)
  const response = await request(app)
  assert.equal(response.status, 200)
  assert.match(response.headers.get("set-cookie"), /amautai-session=;.*Max-Age=0/i)
})
