import { test } from "node:test"
import assert from "node:assert/strict"
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose"
import { verifyAccessToken } from "../src/modules/auth/infrastructure/token-verifier.ts"
import { createApp } from "../src/app.ts"
const app = createApp()

const config = {
  clientId: "client_amautai_test",
  audience: "urn:walpia:api:staging",
  issuer: "https://api.workos.com/user_management/client_01M1NJTDMTZBJB2H981H14CK1S",
}
const { publicKey, privateKey } = await generateKeyPair("RS256")
const jwk = { ...(await exportJWK(publicKey)), kid: "test" }
const jwks = createLocalJWKSet({ keys: [jwk] })
const base = {
  sub: "user_test",
  sid: "session_test",
  client_id: config.clientId,
  aud: config.audience,
}
async function sign(claims = {}, key = privateKey) {
  return new SignJWT({ ...base, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(config.issuer)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key)
}
test("accepts valid Amautai session", async () => {
  const claims = await verifyAccessToken(await sign(), config, jwks)
  assert.equal(claims.sub, "user_test")
})
test("rejects a session issued for another application", async () => {
  await assert.rejects(
    verifyAccessToken(await sign({ client_id: "client_other" }), config, jwks)
  )
})
test("rejects a mismatched audience", async () => {
  await assert.rejects(
    verifyAccessToken(await sign({ aud: "client_other" }), config, jwks)
  )
})
test("rejects untrusted issuer", async () => {
  const token = await new SignJWT(base)
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://untrusted.example")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey)
  await assert.rejects(verifyAccessToken(token, config, jwks))
})
test("rejects expired sessions", async () => {
  const token = await new SignJWT(base)
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(config.issuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(privateKey)
  await assert.rejects(verifyAccessToken(token, config, jwks))
})
test("rejects forged signature", async () => {
  const other = await generateKeyPair("RS256")
  await assert.rejects(
    verifyAccessToken(await sign({}, other.privateKey), config, jwks)
  )
})
test("rejects missing expiry", async () => {
  const token = await new SignJWT(base)
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(config.issuer)
    .setIssuedAt()
    .sign(privateKey)
  await assert.rejects(verifyAccessToken(token, config, jwks))
})
test("API rejects anonymous and malformed requests while health reports database availability", async () => {
  assert.equal((await app.request("https://test/api/me")).status, 401)
  assert.equal(
    (
      await app.request(
        "https://test/api/me",
        { headers: { Authorization: "Bearer invalid" } },
        {
          WORKOS_CLIENT_ID: config.clientId,
          WORKOS_TOKEN_ISSUER: config.issuer,
        }
      )
    ).status,
    401
  )
  assert.equal((await app.request("https://test/api/health")).status, 503)
})

test("rejects a missing audience when the environment requires one", async () => {
  await assert.rejects(verifyAccessToken(await sign({ aud: undefined }), config, jwks))
})

test("isolated environment accepts its own session without a custom audience", async () => {
  const isolated = { clientId: "client_isolated", issuer: "https://api.workos.com/user_management/client_isolated" }
  const token = await new SignJWT({ sub: "user_new", sid: "session_new", client_id: isolated.clientId })
    .setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer(isolated.issuer).setIssuedAt().setExpirationTime("5m").sign(privateKey)
  assert.equal((await verifyAccessToken(token, isolated, jwks)).sub, "user_new")
})
test("isolated environment rejects a token from the original shared environment", async () => {
  const isolated = { clientId: "client_isolated", issuer: "https://api.workos.com/user_management/client_isolated" }
  await assert.rejects(verifyAccessToken(await sign(), isolated, jwks))
})
