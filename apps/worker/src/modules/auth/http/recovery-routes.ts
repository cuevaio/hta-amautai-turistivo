import type { AuthService } from "../application/auth-service.ts"
import { authFailure, logAuthFailure } from "./errors.ts"
import type { Hono } from "hono"
import { z } from "zod"
import { recoveryInput, resetPasswordInput } from "@amautai/contracts"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"
import { EncryptJWT, jwtDecrypt } from "jose"
import { clearSession } from "./sessions.ts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"

const COOKIE = "amautai-password-reset"
async function key(c: AppContext) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(c.env.WORKOS_COOKIE_PASSWORD)
    )
  )
}
function clear(c: AppContext) {
  deleteCookie(c, COOKIE, { path: "/api/auth" })
}
async function readToken(c: AppContext) {
  const value = getCookie(c, COOKIE)
  if (!value || !c.env.WORKOS_COOKIE_PASSWORD) return null
  try {
    const { payload } = await jwtDecrypt(value, await key(c), {
      audience: c.env.WORKOS_CLIENT_ID,
    })
    return typeof payload.token === "string" ? payload.token : null
  } catch {
    return null
  }
}
export function registerRecoveryRoutes(
  app: Hono<AppEnv>,
  factory: (c: AppContext) => AuthService
) {
  app.post("/api/auth/forgot-password", async (c) => {
    const input = recoveryInput.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: "invalid_recovery_email" }, 400)
    if (!c.env.WORKOS_API_KEY) return c.json({ error: "auth_unavailable" }, 503)
    try {
      await factory(c).createPasswordReset(input.data)
    } catch (error) {
      logAuthFailure("password_reset_request", error)
      const failure = authFailure(error)
      if (failure.limited)
        return c.json({ error: "recovery_rate_limited" }, 429)
      if (
        failure.status !== 404 &&
        !["email_not_found", "user_not_found"].includes(failure.code)
      )
        return c.json({ error: "auth_unavailable" }, 503)
    }
    // Keep the response identical for registered and unknown email addresses.
    return c.json({ sent: true })
  })
  app.get("/api/auth/password-reset/start", async (c) => {
    const token = z.string().min(1).max(2048).safeParse(c.req.query("token"))
    c.header("Referrer-Policy", "no-referrer")
    if (!token.success || !c.env.WORKOS_COOKIE_PASSWORD) {
      clear(c)
      return c.redirect("/reset-password")
    }
    const value = await new EncryptJWT({ token: token.data })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setAudience(c.env.WORKOS_CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime("15m")
      .encrypt(await key(c))
    setCookie(c, COOKIE, value, {
      path: "/api/auth",
      httpOnly: true,
      sameSite: "Lax",
      secure: new URL(c.req.url).protocol === "https:",
      maxAge: 900,
    })
    return c.redirect("/reset-password")
  })
  app.get("/api/auth/password-reset/status", async (c) =>
    c.json({ valid: !!(await readToken(c)) })
  )
  app.post("/api/auth/reset-password", async (c) => {
    const input = resetPasswordInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success) return c.json({ error: "invalid_reset_password" }, 400)
    const token = await readToken(c)
    if (!token) {
      clear(c)
      return c.json({ error: "reset_expired" }, 401)
    }
    try {
      await factory(c).resetPassword({
        token,
        newPassword: input.data.newPassword,
      })
    } catch (error) {
      const detail = error as { code?: string; status?: number }
      const code = detail.code || ""
      if (code.startsWith("password"))
        return c.json({ error: "password_policy" }, 400)
      if (detail.status === 429)
        return c.json({ error: "recovery_rate_limited" }, 429)
      if (detail.status && detail.status >= 500)
        return c.json({ error: "auth_unavailable" }, 503)
      return c.json({ error: "reset_failed" }, 400)
    }
    clear(c)
    clearSession(c)
    deleteCookie(c, "amautai-verification", { path: "/api/auth" })
    return c.json({ reset: true })
  })
}
