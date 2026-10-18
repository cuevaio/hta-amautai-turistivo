import type { Hono } from "hono"
import {
  familyChildInput,
  familyChildUpdateInput,
  familyGameInput,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { familyGameService } from "../application/family-service.ts"
import { FamilyGameError } from "../domain/family.ts"
import { RoomError } from "../domain/cargo.ts"
export function registerFamilyGameRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => ReturnType<typeof familyGameService>
    ensureParent: (c: AppContext) => Promise<boolean>
  }
) {
  const ensure = async (c: AppContext, next: () => Promise<void>) => {
    if (!(await deps.ensureParent(c)))
      return c.json({ error: "profile_role_required" }, 403)
    await next()
  }
  app.use("/api/family-games", ensure)
  app.use("/api/family-games/*", ensure)
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  async function action(c: AppContext, run: () => Promise<unknown>) {
    try {
      return c.json(await run())
    } catch (e) {
      if (e instanceof FamilyGameError || e instanceof RoomError)
        return c.json(
          { error: e.code },
          e.code === "child_not_found"
            ? 404
            : e.code.startsWith("invalid_")
              ? 400
              : 409
        )
      throw e
    }
  }
  app.get("/api/family-games", (c) =>
    action(c, () => deps.service(c).overview(actor(c)))
  )
  app.post("/api/family-games/children", async (c) => {
    const input = familyChildInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success) return c.json({ error: "invalid_family_game" }, 400)
    return action(c, async () => {
      return {
        child: await deps
          .service(c)
          .add(actor(c), input.data.name, input.data.region),
      }
    })
  })
  app.put("/api/family-games/children/:id", async (c) => {
    const input = familyChildUpdateInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success) return c.json({ error: "invalid_family_game" }, 400)
    return action(c, async () => {
      const child = await deps
        .service(c)
        .update(
          actor(c),
          c.req.param("id"),
          input.data.name,
          input.data.region,
          input.data.version
        )
      return { child }
    })
  })
  app.delete("/api/family-games/children/:id", (c) =>
    action(c, async () => {
      await deps.service(c).remove(actor(c), c.req.param("id"))
      return { ok: true }
    })
  )
  app.post("/api/family-games", async (c) => {
    const input = familyGameInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success) return c.json({ error: "invalid_family_game" }, 400)
    return action(c, async () => ({
      game: await deps
        .service(c)
        .create(
          actor(c),
          input.data.childId,
          input.data.kind,
          input.data.requestId
        ),
    }))
  })
}
