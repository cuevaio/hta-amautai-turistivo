import { test } from "node:test"
import assert from "node:assert/strict"
import { client } from "../src/modules/auth/infrastructure/workos.ts"

test("WorkOS client reuses signing-key cache and changes with credentials or application", () => {
  const context = { env: { WORKOS_API_KEY: "sk_test_cache_a", WORKOS_CLIENT_ID: "client_cache_a" } }
  const first = client(context.env)
  assert.equal(client(context.env), first)
  const rotated = client({ ...context.env, WORKOS_API_KEY: "sk_test_cache_b" })
  assert.notEqual(rotated, first)
  const isolated = client({ ...context.env, WORKOS_CLIENT_ID: "client_cache_b" })
  assert.notEqual(isolated, rotated)
  assert.equal(client(context.env).clientId, "client_cache_a")
})
