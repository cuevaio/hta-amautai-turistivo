import { jwtVerify, type JWTVerifyGetKey } from "jose"

export type AuthConfig = { clientId: string; issuer: string; audience?: string }

export async function verifyAccessToken(
  token: string,
  config: AuthConfig,
  jwks: JWTVerifyGetKey
) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "exp", "iat", "sid"],
    clockTolerance: 5,
  })
  // Bind every session to Amautai even when environment signing keys are shared.
  if (payload.client_id !== config.clientId) throw new Error("Invalid client")
  if (payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!audiences.includes(config.audience || config.clientId))
      throw new Error("Invalid audience")
  }
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string")
    throw new Error("Invalid session")
  return payload
}
