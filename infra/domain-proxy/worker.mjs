const upstreamOrigin = "https://amautai.urday.dev"
const publicOrigin = "https://amautai.turistivo.com"

export async function proxy(request, send = fetch) {
  const target = new URL(request.url)
  target.protocol = "https:"
  target.host = new URL(upstreamOrigin).host
  const forwarded = new Request(target, request)
  // OAuth redirects must reach the browser with their state cookies intact.
  const response = await send(new Request(forwarded, { redirect: "manual" }))
  const headers = new Headers(response.headers)
  const location = headers.get("Location")
  if (location) {
    const redirect = new URL(location, upstreamOrigin)
    if (redirect.origin === upstreamOrigin) {
      headers.set(
        "Location",
        publicOrigin + redirect.pathname + redirect.search + redirect.hash
      )
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  fetch(request) {
    return proxy(request)
  },
}
