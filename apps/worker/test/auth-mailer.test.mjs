import { test } from "node:test"
import assert from "node:assert/strict"
import { createAuthService } from "../src/modules/auth/application/auth-service.ts"
import { workosGateway } from "../src/modules/auth/infrastructure/workos.ts"
import { authMailer } from "../src/modules/auth/infrastructure/auth-mailer.ts"
function setup(result = { status: "accepted" }) {
  const messages = []
  const provider = {
    configured: () => true,
    async send(n) {
      messages.push(n)
      return result
    },
  }
  const challenge = {
    code: "email_verification_required",
    rawData: {
      email_verification_id: "emailv_fixture",
      pending_authentication_token: "pending_fixture",
    },
  }
  const userManagement = {
    async createUser() {
      return {}
    },
    async authenticateWithPassword() {
      throw challenge
    },
    async authenticateWithCode() {
      throw challenge
    },
    async getEmailVerification(id) {
      assert.equal(id, "emailv_fixture")
      return { id, email: "verified-destination@example.test", code: "123456" }
    },
    async createPasswordReset() {
      return {
        id: "pr_fixture",
        email: "account@example.test",
        passwordResetUrl:
          "https://amautai.turistivo.com/api/auth/password-reset/start?token=fixture-token",
      }
    },
  }
  return {
    messages,
    provider,
    service: createAuthService(
      workosGateway({ userManagement }),
      authMailer(provider)
    ),
  }
}
test("password, signup and OAuth challenges use WorkOS codes and preserve encrypted continuation metadata", async () => {
  const s = setup()
  for (const run of [
    () => s.service.authenticateWithPassword({}),
    () => s.service.authenticateWithCode({}),
    () =>
      s.service.signup(
        { email: "request@example.test", password: "fixture" },
        {}
      ),
  ]) {
    await assert.rejects(
      run(),
      (e) =>
        e.code === "email_verification_required" &&
        e.pendingToken === "pending_fixture" &&
        e.verificationId === "emailv_fixture"
    )
  }
  assert.equal(s.messages.length, 3)
  assert.ok(
    s.messages.every(
      (n) =>
        n.email === "verified-destination@example.test" &&
        n.body.includes("123456") &&
        n.title === "Verifica tu correo en Amautai"
    )
  )
})
test("recovery mail uses only provider-returned recipient and an approved Amautai recovery link", async () => {
  const s = setup()
  await s.service.createPasswordReset({ email: "input@example.test" })
  assert.equal(s.messages[0].email, "account@example.test")
  assert.match(
    s.messages[0].body,
    /https:\/\/amautai.turistivo.com\/api\/auth\/password-reset\/start\?token=fixture-token/
  )
  await assert.rejects(
    authMailer(s.provider).recovery({
      id: "pr_bad",
      email: "account@example.test",
      passwordResetUrl: "https://evil.test/?token=secret",
    })
  )
  assert.equal(s.messages.length, 1)
})
test("custom auth email failures never fall back or claim successful sends", async () => {
  for (const status of ["retry", "failed", "uncertain"]) {
    const s = setup({ status })
    await assert.rejects(
      s.service.authenticateWithCode({}),
      (e) => e.code === "auth_email_unavailable" && e.status === 503
    )
    await assert.rejects(
      s.service.createPasswordReset({ email: "input@example.test" }),
      (e) => e.code === "auth_email_unavailable" && e.status === 503
    )
    assert.equal(s.messages.length, 2)
  }
  const s = setup()
  await assert.rejects(
    authMailer({ ...s.provider, configured: () => false }).verification({
      id: "emailv_fixture",
      email: "user@example.test",
      code: "123456",
    }),
    (e) => e.status === 503
  )
  assert.equal(s.messages.length, 0)
})
