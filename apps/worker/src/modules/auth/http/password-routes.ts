import type { AuthService } from "../application/auth-service.ts"
import { beginEmailVerification } from "./email-verification.ts"
import { authFailure, logAuthFailure } from "./errors.ts"
import type { Hono } from "hono"
import {
  credentialsInput as credentials,
  signupInput as signup,
  verificationInput,
} from "@amautai/contracts"
import { getCookie, deleteCookie } from "hono/cookie"
import { jwtDecrypt } from "jose"
import { setSession } from "./sessions.ts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"

const PENDING = "amautai-verification"
type Factory = (c: AppContext) => AuthService
async function key(c: AppContext) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(c.env.WORKOS_COOKIE_PASSWORD)
    )
  )
}
function clearPending(c: AppContext) {
  deleteCookie(c, PENDING, { path: "/api/auth" })
}
function complete(c: AppContext, sealedSession?: string) {
  if (!sealedSession) return c.json({ error: "auth_unavailable" }, 503)
  setSession(c, sealedSession)
  clearPending(c)
  return c.json({ authenticated: true })
}
export function registerPasswordRoutes(app: Hono<AppEnv>, factory: Factory) {
  app.post("/api/auth/signup", async (c) => {
    const input = signup.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: "invalid_signup" }, 400)
    if (!c.env.WORKOS_API_KEY || !c.env.WORKOS_COOKIE_PASSWORD)
      return c.json({ error: "auth_unavailable" }, 503)
    clearPending(c)
    let operation = "signup_create"
    try {
      const service = factory(c)
      operation = "signup"
      const result = await service.signup(input.data, {
        session: {
          sealSession: true,
          cookiePassword: c.env.WORKOS_COOKIE_PASSWORD,
        },
      })
      return complete(c, result.sealedSession)
    } catch (error) {
      if (await beginEmailVerification(c, error))
        return c.json({ verificationRequired: true })
      logAuthFailure(operation, error)
      const failure = authFailure(error)
      if (failure.code.startsWith("password"))
        return c.json({ error: "password_policy" }, 400)
      if (failure.limited) return c.json({ error: "auth_rate_limited" }, 429)
      if (failure.unavailable) return c.json({ error: "auth_unavailable" }, 503)
      return c.json({ error: "signup_failed" }, 400)
    }
  })
  app.post("/api/auth/password", async (c) => {
    const input = credentials.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: "invalid_credentials" }, 400)
    if (!c.env.WORKOS_API_KEY || !c.env.WORKOS_COOKIE_PASSWORD)
      return c.json({ error: "auth_unavailable" }, 503)
    clearPending(c)
    try {
      const result = await factory(c).authenticateWithPassword({
        ...input.data,
        session: {
          sealSession: true,
          cookiePassword: c.env.WORKOS_COOKIE_PASSWORD,
        },
      })
      return complete(c, result.sealedSession)
    } catch (error) {
      if (await beginEmailVerification(c, error))
        return c.json({ verificationRequired: true })
      logAuthFailure("password", error)
      const failure = authFailure(error)
      if (failure.limited) return c.json({ error: "auth_rate_limited" }, 429)
      if (failure.unavailable) return c.json({ error: "auth_unavailable" }, 503)
      if (failure.code === "organization_selection_required")
        return c.json({ error: "organization_selection_required" }, 403)
      return c.json({ error: "sign_in_failed" }, 401)
    }
  })
  app.post("/api/auth/verify-email", async (c) => {
    const input = verificationInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success)
      return c.json({ error: "invalid_verification_code" }, 400)
    const cookie = getCookie(c, PENDING)
    if (!cookie || !c.env.WORKOS_COOKIE_PASSWORD)
      return c.json({ error: "verification_expired" }, 401)
    let token: string
    try {
      const { payload } = await jwtDecrypt(cookie, await key(c), {
        audience: c.env.WORKOS_CLIENT_ID,
      })
      if (typeof payload.token !== "string") throw new Error()
      token = payload.token
    } catch {
      clearPending(c)
      return c.json({ error: "verification_expired" }, 401)
    }
    try {
      const result = await factory(c).authenticateWithEmailVerification({
        code: input.data.code,
        pendingAuthenticationToken: token,
        session: {
          sealSession: true,
          cookiePassword: c.env.WORKOS_COOKIE_PASSWORD,
        },
      })
      return complete(c, result.sealedSession)
    } catch (error) {
      logAuthFailure("verify_email", error)
      const failure = authFailure(error)
      if (failure.unavailable) return c.json({ error: "auth_unavailable" }, 503)
      return c.json({ error: "verification_failed" }, 400)
    }
  })
}
