import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import { timingSafeEqual } from "node:crypto"
import type { Store } from "./store.ts"
export function apiServer(
  store: Store,
  token: string,
  state: () => { connection: string }
) {
  if (token.length < 32)
    throw new Error("Gateway token must have at least 32 characters")
  const expected = Buffer.from("Bearer " + token)
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("Content-Type", "application/json")
    const send = (code: number, body: unknown) => {
      res.writeHead(code)
      res.end(JSON.stringify(body))
    }
    const provided = Buffer.from(req.headers.authorization || "")
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      send(401, { error: "unauthorized" })
      return
    }
    const url = new URL(req.url || "/", "http://localhost")
    if (req.method === "GET" && url.pathname === "/connection") {
      send(200, { connection: state().connection })
      return
    }
    const match = url.pathname.match(/^\/notifications\/([a-zA-Z0-9-]{1,80})$/)
    const dto = (job: ReturnType<Store["find"]>) =>
      job
        ? {
            id: job.id,
            status: job.status === "sending" ? "accepted" : job.status,
            providerId: job.providerId,
          }
        : null
    if (req.method === "GET" && match) {
      const job = store.find(match[1]!)
      send(job ? 200 : 404, dto(job) || { error: "not_found" })
      return
    }
    if (req.method !== "POST" || url.pathname !== "/notifications") {
      send(404, { error: "not_found" })
      return
    }
    try {
      let size = 0
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        size += chunk.length
        if (size > 4096) {
          send(413, { error: "too_large" })
          return
        }
        chunks.push(chunk)
      }
      const data = JSON.parse(Buffer.concat(chunks).toString()) as Record<
        string,
        unknown
      >
      if (
        typeof data.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(data.id) ||
        typeof data.phone !== "string" ||
        !/^\+[1-9]\d{7,14}$/.test(data.phone) ||
        typeof data.text !== "string" ||
        data.text.length < 1 ||
        data.text.length > 1500 ||
        typeof data.expiresAt !== "number" ||
        !Number.isSafeInteger(data.expiresAt)
      ) {
        send(400, { error: "invalid_input" })
        return
      }
      const existing = store.find(data.id)
      if (existing) {
        if (
          existing.phone !== data.phone ||
          (existing.text && existing.text !== data.text)
        ) {
          send(409, { error: "id_conflict" })
          return
        }
        send(200, dto(existing))
        return
      }
      if (
        data.expiresAt <= Date.now() ||
        data.expiresAt > Date.now() + 600000
      ) {
        send(400, { error: "expired" })
        return
      }
      if (state().connection !== "connected") {
        send(503, { error: "not_connected" })
        return
      }
      send(
        202,
        dto(
          store.insert({
            id: data.id,
            phone: data.phone,
            text: data.text,
            expiresAt: data.expiresAt,
          })
        )
      )
    } catch {
      send(400, { error: "invalid_input" })
    }
  })
}
