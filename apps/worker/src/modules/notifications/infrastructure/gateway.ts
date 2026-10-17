import type { WhatsAppGateway } from "../application/ports.ts"
import type { Status } from "../domain/notification.ts"
const states = new Set([
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
  "expired",
  "cancelled",
  "uncertain",
])
export function whatsappGateway(
  base?: string,
  token?: string
): WhatsAppGateway {
  async function call(path: string, body?: unknown) {
    if (!base || !token || !base.startsWith("https://")) {
      console.info(
        "amautai_gateway_not_configured",
        JSON.stringify({ base: !!base, token: !!token })
      )
      throw new Error("gateway_not_configured")
    }
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "Amautai-Notifications/1.0",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
    }).catch((error) => {
      console.info(
        "amautai_gateway_transport_error",
        JSON.stringify({
          name: error instanceof Error ? error.name : "unknown",
          message: error instanceof Error ? error.message.replaceAll(token || "__missing__", "[redacted]").slice(0,160) : "",
        })
      )
      throw error
    })
    if (response.status === 404) {
      console.info("amautai_gateway_missing_endpoint")
      return null
    }
    if (!response.ok) {
      console.info(
        "amautai_gateway_http_error",
        JSON.stringify({ status: response.status })
      )
      throw new Error("gateway_unavailable")
    }
    return response.json() as Promise<{
      status?: string
      connection?: string
      providerId?: string
    }>
  }
  function result(data: Awaited<ReturnType<typeof call>>) {
    if (!data?.status || !states.has(data.status))
      throw new Error("invalid_gateway_response")
    return { status: data.status as Status, providerId: data.providerId }
  }
  return {
    async connection() {
      return (await call("/connection"))?.connection || "unavailable"
    },
    async send(item) {
      return result(
        await call("/notifications", {
          id: item.id,
          phone: item.phone,
          text: item.body,
          expiresAt: Math.min(item.expires_at, Date.now() + 60000),
        })
      )
    },
    async status(id) {
      const data = await call("/notifications/" + encodeURIComponent(id))
      return data ? result(data) : null
    },
  }
}
