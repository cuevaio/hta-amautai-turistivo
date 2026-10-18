import { test } from "node:test"
import assert from "node:assert/strict"
import { proxy } from "./worker.mjs"

test("fixed upstream preserves request body, origin, query and cookies", async () => {
  const result = await proxy(
    new Request("https://amautai.turistivo.com/api/auth/login?next=1", {
      method: "POST",
      body: "fixture",
      headers: {
        Origin: "https://amautai.turistivo.com",
        Cookie: "session=fixture",
      },
    }),
    async (request) => {
      assert.equal(
        request.url,
        "https://amautai.urday.dev/api/auth/login?next=1"
      )
      assert.equal(request.redirect, "manual")
      assert.equal(request.method, "POST")
      assert.equal(await request.text(), "fixture")
      assert.equal(
        request.headers.get("Origin"),
        "https://amautai.turistivo.com"
      )
      assert.equal(request.headers.get("Cookie"), "session=fixture")
      return new Response("ok", {
        headers: { "Set-Cookie": "session=new; Secure; HttpOnly; Path=/" },
      })
    }
  )
  assert.equal(await result.text(), "ok")
  assert.equal(
    result.headers.get("Set-Cookie"),
    "session=new; Secure; HttpOnly; Path=/"
  )
})

test("redirects preserve OAuth provider and rewrite only the upstream origin", async () => {
  for (const [location, expected] of [
    [
      "https://api.workos.com/user_management/authorize?state=fixture",
      "https://api.workos.com/user_management/authorize?state=fixture",
    ],
    [
      "https://amautai.urday.dev/dashboard?x=1#lesson",
      "https://amautai.turistivo.com/dashboard?x=1#lesson",
    ],
    [
      "/login?error=expired",
      "https://amautai.turistivo.com/login?error=expired",
    ],
  ]) {
    const result = await proxy(
      new Request("https://amautai.turistivo.com/callback"),
      async () =>
        new Response(null, {
          status: 302,
          headers: {
            Location: location,
            "Set-Cookie": "oauth=fixture; Secure; HttpOnly",
          },
        })
    )
    assert.equal(result.status, 302)
    assert.equal(result.headers.get("Location"), expected)
    assert.equal(
      result.headers.get("Set-Cookie"),
      "oauth=fixture; Secure; HttpOnly"
    )
  }
})
