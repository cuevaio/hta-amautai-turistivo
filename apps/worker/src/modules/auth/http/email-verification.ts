import { setCookie } from "hono/cookie"
import { EncryptJWT } from "jose"
import type { AppContext } from "../../../shared/http/context.ts"

async function key(c: AppContext) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(c.env.WORKOS_COOKIE_PASSWORD)
    )
  )
}
export async function beginEmailVerification(c: AppContext, error: unknown) {
  const detail = error as { code?: string; pendingToken?: string }
  const code = detail.code
  const token = detail.pendingToken
  if (code !== "email_verification_required" || !token) return false
  const sealed = await new EncryptJWT({ token })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setAudience(c.env.WORKOS_CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime("10m")
    .encrypt(await key(c))
  setCookie(c, "amautai-verification", sealed, {
    path: "/api/auth",
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Strict",
    maxAge: 600,
  })
  return true
}
