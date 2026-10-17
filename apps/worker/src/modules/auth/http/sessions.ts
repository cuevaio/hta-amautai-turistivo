import { beginEmailVerification } from "./email-verification.ts"
import { logAuthFailure } from "./errors.ts"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"
import { EncryptJWT, jwtDecrypt } from "jose"
import type { AppContext } from "../../../shared/http/context.ts"
import type { Identity } from "../../../shared/domain/identity.ts"
import type { AuthService } from "../application/auth-service.ts"

const SESSION = "amautai-session"
const OAUTH = "amautai-oauth"
export function origins(c: AppContext) {
  return (c.env.APP_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
export function setSession(c: AppContext, value: string) {
  setCookie(c, SESSION, value, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}
export function clearSession(c: AppContext) {
  deleteCookie(c, SESSION, { path: "/" })
}
export type SessionResolver = (
  cookie: string
) => Promise<{ identity: Identity; refreshedSession?: string } | null>
export async function resolveIdentity(
  c: AppContext,
  resolve: SessionResolver
): Promise<Identity | null> {
  const cookie = getCookie(c, SESSION)
  if (!cookie || !c.env.WORKOS_COOKIE_PASSWORD) return null
  const result = await resolve(cookie)
  if (!result) return null
  if (result.refreshedSession) setSession(c, result.refreshedSession)
  return result.identity
}
async function encryptionKey(c: AppContext) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(c.env.WORKOS_COOKIE_PASSWORD)
    )
  )
}
export async function startOAuth(
  c: AppContext,
  provider: "GoogleOAuth" | "GitHubOAuth",
  origin: string,
  service: AuthService
) {
  const flow = await service.getAuthorizationUrlWithPKCE({
    provider,
    redirectUri: origin + "/callback",
  })
  const encrypted = await new EncryptJWT({
    state: flow.state,
    verifier: flow.codeVerifier,
    origin,
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .encrypt(await encryptionKey(c))
  setCookie(c, OAUTH, encrypted, {
    httpOnly: true,
    secure: origin.startsWith("https:"),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  })
  return c.redirect(flow.url)
}
export async function finishOAuth(
  c: AppContext,
  factory: (c: AppContext) => AuthService
) {
  const cookie = getCookie(c, OAUTH)
  deleteCookie(c, OAUTH, { path: "/" })
  if (!cookie) return c.redirect("/login?error=oauth_expired")
  try {
    const { payload } = await jwtDecrypt(cookie, await encryptionKey(c))
    if (
      payload.state !== c.req.query("state") ||
      typeof payload.origin !== "string" ||
      !origins(c).includes(payload.origin) ||
      typeof payload.verifier !== "string"
    ) {
      return c.redirect("/login?error=oauth_state")
    }
    const code = c.req.query("code")
    if (!code) return c.redirect("/login?error=oauth_denied")
    const result = await factory(c).authenticateWithCode({
      code,
      codeVerifier: payload.verifier,
      session: {
        sealSession: true,
        cookiePassword: c.env.WORKOS_COOKIE_PASSWORD,
      },
    })
    if (!result.sealedSession) throw new Error("Session unavailable")
    setSession(c, result.sealedSession)
    return c.redirect(payload.origin + "/dashboard/projects")
  } catch (error) {
    if (await beginEmailVerification(c, error))
      return c.redirect("/verify-email")
    logAuthFailure("oauth_callback", error)
    return c.redirect("/login?error=oauth_failed")
  }
}
