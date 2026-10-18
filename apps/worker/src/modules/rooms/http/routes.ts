import type { Hono } from "hono"
import {
  nurseryAnswerInput,
  marketAnswerInput,
  marketVersionInput,
  roomInput,
  participantInput,
  cargoCollectInput,
  cargoPauseInput,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { RoomService } from "../application/service.ts"
import { RoomError } from "../domain/cargo.ts"
export function registerRoomRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => RoomService
    ensure: (c: AppContext) => Promise<unknown>
  }
) {
  app.use("/api/game-rooms/*", async (c, next) => {
    await deps.ensure(c)
    await next()
  })
  app.use("/api/game-rooms", async (c, next) => {
    await deps.ensure(c)
    await next()
  })
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  const body = (c: AppContext) => c.req.json().catch(() => null)
  async function action(c: AppContext, run: () => Promise<unknown>) {
    try {
      return c.json(await run())
    } catch (e) {
      if (e instanceof RoomError)
        return c.json(
          { error: e.code },
          e.code.endsWith("not_found")
            ? 404
            : e.code === "invalid_room_input"
              ? 400
              : 409
        )
      throw e
    }
  }
  app.get("/api/game-rooms", (c) =>
    action(c, async () => ({ rooms: await deps.service(c).list(actor(c)) }))
  )
  app.post("/api/game-rooms", async (c) => {
    const input = roomInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, async () => ({
      room: await deps
        .service(c)
        .create(
          actor(c),
          input.data.region,
          input.data.kind,
          input.data.mode,
          input.data.name
        ),
    }))
  })
  app.delete("/api/game-rooms/:room", (c) =>
    action(c, async () => {
      await deps.service(c).deleteRoom(actor(c), c.req.param("room"))
      return { ok: true }
    })
  )
  app.get("/api/game-rooms/:room", (c) =>
    action(c, () => deps.service(c).detail(actor(c), c.req.param("room")))
  )
  app.post("/api/game-rooms/:room/participants", async (c) => {
    const input = participantInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, async () => {
      await deps.service(c).add(actor(c), c.req.param("room"), input.data.name)
      return { ok: true }
    })
  })
  app.delete("/api/game-rooms/:room/participants/:id", (c) =>
    action(c, async () => {
      await deps
        .service(c)
        .remove(actor(c), c.req.param("room"), c.req.param("id"))
      return { ok: true }
    })
  )
  app.post("/api/game-rooms/:room/participants/:id/start", (c) =>
    action(c, () =>
      deps.service(c).start(actor(c), c.req.param("room"), c.req.param("id"))
    )
  )
  app.post("/api/game-rooms/:room/participants/:id/collect", async (c) => {
    const input = cargoCollectInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .collect(actor(c), c.req.param("room"), c.req.param("id"), input.data)
    )
  })
  app.post("/api/game-rooms/:room/participants/:id/pause", async (c) => {
    const input = cargoPauseInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .pause(actor(c), c.req.param("room"), c.req.param("id"), input.data)
    )
  })
  app.post("/api/game-rooms/:room/participants/:id/retry", (c) =>
    action(c, () =>
      deps.service(c).retry(actor(c), c.req.param("room"), c.req.param("id"))
    )
  )
  app.post("/api/game-rooms/:room/participants/:id/market/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .marketStart(actor(c), c.req.param("room"), c.req.param("id"))
    )
  )
  app.post(
    "/api/game-rooms/:room/participants/:id/market/answer",
    async (c) => {
      const input = marketAnswerInput.safeParse(await body(c))
      if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
      return action(c, () =>
        deps
          .service(c)
          .marketAction(
            actor(c),
            c.req.param("room"),
            c.req.param("id"),
            input.data
          )
      )
    }
  )
  app.post("/api/game-rooms/:room/participants/:id/market/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .marketAction(actor(c), c.req.param("room"), c.req.param("id"), {
          ...input.data,
          help: true,
        })
    )
  })
  app.post("/api/game-rooms/:room/participants/:id/market/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .marketRetry(
          actor(c),
          c.req.param("room"),
          c.req.param("id"),
          input.data.version
        )
    )
  })
  app.post("/api/game-rooms/:room/participants/:id/nursery/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .nurseryStart(actor(c), c.req.param("room"), c.req.param("id"))
    )
  )
  app.post(
    "/api/game-rooms/:room/participants/:id/nursery/answer",
    async (c) => {
      const input = nurseryAnswerInput.safeParse(await body(c))
      if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
      return action(c, () =>
        deps
          .service(c)
          .nurseryAction(
            actor(c),
            c.req.param("room"),
            c.req.param("id"),
            input.data
          )
      )
    }
  )
  app.post("/api/game-rooms/:room/participants/:id/nursery/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .nurseryAction(actor(c), c.req.param("room"), c.req.param("id"), {
          ...input.data,
          help: true,
        })
    )
  })
  app.post(
    "/api/game-rooms/:room/participants/:id/nursery/retry",
    async (c) => {
      const input = marketVersionInput.safeParse(await body(c))
      if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
      return action(c, () =>
        deps
          .service(c)
          .nurseryRetry(
            actor(c),
            c.req.param("room"),
            c.req.param("id"),
            input.data.version
          )
      )
    }
  )
}
