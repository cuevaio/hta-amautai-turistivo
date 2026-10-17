import { client } from "./workos.ts"
import { verifyAccessToken } from "./token-verifier.ts"
import type { Bindings } from "../../../shared/runtime.ts"
export async function resolveWorkosSession(cookie: string, env: Bindings) {
  let refreshedSession: string | undefined
  const session = client(env).userManagement.loadSealedSession({
    sessionData: cookie,
    cookiePassword: env.WORKOS_COOKIE_PASSWORD,
  })
  let result = await session.authenticate()
  if (!result.authenticated) {
    if (
      ["no_session_cookie_provided", "invalid_session_cookie"].includes(
        result.reason
      )
    )
      return null
    const refreshed = await session.refresh()
    if (!refreshed.authenticated) {
      if (
        ["invalid_grant", "invalid_session_cookie"].includes(
          String(refreshed.reason)
        )
      )
        return null
      throw new Error("Session refresh unavailable")
    }
    if (refreshed.sealedSession) refreshedSession = refreshed.sealedSession
    result = await client(env)
      .userManagement.loadSealedSession({
        sessionData: refreshed.sealedSession!,
        cookiePassword: env.WORKOS_COOKIE_PASSWORD,
      })
      .authenticate()
  }
  if (!result.authenticated) return null
  // Reuse the SDK key cache instead of fetching signing keys twice per request.
  const jwks = await client(env).userManagement.getJWKS()
  if (!jwks) throw new Error("Session keys unavailable")
  await verifyAccessToken(
    result.accessToken,
    {
      clientId: env.WORKOS_CLIENT_ID,
      issuer: env.WORKOS_TOKEN_ISSUER,
      audience: env.WORKOS_TOKEN_AUDIENCE || undefined,
    },
    jwks
  )
  return {
    identity: {
      user: {
        id: result.user.id,
        email: result.user.email,
        emailVerified: result.user.emailVerified === true,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        profilePictureUrl: result.user.profilePictureUrl,
      },
      organizationId: result.organizationId,
      sessionId: result.sessionId,
    },
    refreshedSession,
  }
}
