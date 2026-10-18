import type { Hono } from "hono"
import {
  fairAnswerInput,
  builderAnswerInput,
  dataAnswerInput,
  nurseryAnswerInput,
  marketAnswerInput,
  marketVersionInput,
  cargoCollectInput,
  cargoPauseInput,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { RoomService } from "../application/service.ts"
import { RoomError } from "../domain/cargo.ts"
import type { Actor } from "../domain/cargo.ts"
export function registerRoomPlayRoutes(
  app: Hono<AppEnv>,
  deps: { service(c: AppContext): RoomService; actor(c: AppContext): Actor },
  base = "/api/game-rooms"
) {
  const actor = deps.actor
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
            : e.code.startsWith("invalid_")
              ? 400
              : 409
        )
      throw e
    }
  }
  app.post(base + "/:room/participants/:id/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .start(actor(c), c.req.param("room") ?? "", c.req.param("id") ?? "")
    )
  )
  app.post(base + "/:room/participants/:id/collect", async (c) => {
    const input = cargoCollectInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .collect(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/pause", async (c) => {
    const input = cargoPauseInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .pause(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/retry", (c) =>
    action(c, () =>
      deps
        .service(c)
        .retry(actor(c), c.req.param("room") ?? "", c.req.param("id") ?? "")
    )
  )
  app.post(base + "/:room/participants/:id/market/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .marketStart(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? ""
        )
    )
  )
  app.post(base + "/:room/participants/:id/market/answer", async (c) => {
    const input = marketAnswerInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .marketAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/market/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .marketAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          {
            ...input.data,
            help: true,
          }
        )
    )
  })
  app.post(base + "/:room/participants/:id/market/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .marketRetry(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data.version
        )
    )
  })
  app.post(base + "/:room/participants/:id/nursery/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .nurseryStart(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? ""
        )
    )
  )
  app.post(base + "/:room/participants/:id/nursery/answer", async (c) => {
    const input = nurseryAnswerInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .nurseryAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/nursery/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .nurseryAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          {
            ...input.data,
            help: true,
          }
        )
    )
  })
  app.post(base + "/:room/participants/:id/nursery/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .nurseryRetry(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data.version
        )
    )
  })
  app.post(base + "/:room/participants/:id/fair/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .fairStart(actor(c), c.req.param("room") ?? "", c.req.param("id") ?? "")
    )
  )
  app.post(base + "/:room/participants/:id/fair/answer", async (c) => {
    const input = fairAnswerInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .fairAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/fair/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .fairAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          {
            ...input.data,
            help: true,
          }
        )
    )
  })
  app.post(base + "/:room/participants/:id/fair/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .fairRetry(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data.version
        )
    )
  })
  app.post(base + "/:room/participants/:id/data/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .dataStart(actor(c), c.req.param("room") ?? "", c.req.param("id") ?? "")
    )
  )
  app.post(base + "/:room/participants/:id/data/answer", async (c) => {
    const input = dataAnswerInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .dataAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/data/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .dataAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          {
            ...input.data,
            help: true,
          }
        )
    )
  })
  app.post(base + "/:room/participants/:id/data/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .dataRetry(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data.version
        )
    )
  })
  app.post(base + "/:room/participants/:id/builder/start", (c) =>
    action(c, () =>
      deps
        .service(c)
        .builderStart(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? ""
        )
    )
  )
  app.post(base + "/:room/participants/:id/builder/answer", async (c) => {
    const input = builderAnswerInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .builderAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data
        )
    )
  })
  app.post(base + "/:room/participants/:id/builder/help", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .builderAction(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          {
            ...input.data,
            help: true,
          }
        )
    )
  })
  app.post(base + "/:room/participants/:id/builder/retry", async (c) => {
    const input = marketVersionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_room_input" }, 400)
    return action(c, () =>
      deps
        .service(c)
        .builderRetry(
          actor(c),
          c.req.param("room") ?? "",
          c.req.param("id") ?? "",
          input.data.version
        )
    )
  })
}
