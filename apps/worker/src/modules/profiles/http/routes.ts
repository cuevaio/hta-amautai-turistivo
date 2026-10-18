import type { Hono } from "hono"
import { accountProfileInput } from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { ProfileService } from "../application/service.ts"
import type { Actor } from "../domain/profile.ts"

export function registerProfileRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => ProfileService
    ensure: (c: AppContext) => Promise<unknown>
    registered: (c: AppContext, actor: Actor) => void
  }
) {
  app.use("/api/profile", async (c, next) => {
    await deps.ensure(c)
    await next()
  })
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  app.get("/api/profile", async (c) =>
    c.json({ profile: await deps.service(c).get(actor(c)) })
  )
  app.put("/api/profile", async (c) => {
    const body = await c.req.json().catch(() => null)
    const input = accountProfileInput.safeParse(body)
    if (!input.success) return c.json({ error: "invalid_profile_input" }, 400)
    const owner = actor(c)
    const profile = await deps.service(c).save(owner, input.data)
    deps.registered(c, owner)
    return c.json({ profile })
  })
}
