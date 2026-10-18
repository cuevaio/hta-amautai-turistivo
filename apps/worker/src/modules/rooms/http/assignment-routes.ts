import type { Hono } from "hono"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { AssignmentService } from "../application/assignment-service.ts"
import type { RoomService } from "../application/service.ts"
import { RoomError } from "../domain/cargo.ts"
import { registerRoomPlayRoutes } from "./play-routes.ts"
export function registerAssignedGameRoutes(
  app: Hono<AppEnv>,
  deps: {
    assignments(c: AppContext): AssignmentService
    service(c: AppContext): RoomService
  }
) {
  async function authorize(c: AppContext, next: () => Promise<void>) {
    c.header("Referrer-Policy", "no-referrer")
    try {
      const bearer = c.req.header("Authorization") ?? ""
      const game = await deps
        .assignments(c)
        .access(bearer.startsWith("Bearer ") ? bearer.slice(7) : "")
      const prefix = `/api/assigned-games/${game.room.id}/participants/${game.participant.id}/`
      const suffix = c.req.path.startsWith(prefix)
        ? c.req.path.slice(prefix.length)
        : ""
      const kind = game.room.kind
      const allowed =
        kind === "cargo"
          ? /^(start|collect|pause|retry)$/
          : new RegExp(`^${kind}/(start|answer|help|retry)$`)
      if (
        !(c.req.method === "GET" && c.req.path === "/api/assigned-games") &&
        !(c.req.method === "POST" && allowed.test(suffix))
      )
        return c.json({ error: "assignment_not_found" }, 404)
      c.set("assignedGame", game)
    } catch (e) {
      if (e instanceof RoomError)
        return c.json({ error: "assignment_not_found" }, 404)
      throw e
    }
    await next()
  }
  app.use("/api/assigned-games", authorize)
  app.use("/api/assigned-games/*", authorize)
  app.get("/api/assigned-games", (c) => {
    const { room, participant } = c.get("assignedGame")
    return c.json({ room, participant })
  })
  registerRoomPlayRoutes(
    app,
    {
      service: deps.service,
      actor: (c) => {
        const a = c.get("assignedGame").assignment
        return { tenantId: a.tenantId, userId: a.userId }
      },
    },
    "/api/assigned-games"
  )
  app.all("/api/assigned-games/*", (c) =>
    c.json({ error: "assignment_not_found" }, 404)
  )
}
