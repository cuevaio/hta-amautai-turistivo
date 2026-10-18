import type { Hono } from "hono"
import { familyProfileInput } from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { FamilyProfileService } from "../application/service.ts"
import { FamilyProfileError } from "../domain/profile.ts"

export function registerFamilyProfileRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => FamilyProfileService
    ensureParent: (c: AppContext) => Promise<boolean>
  }
) {
  app.use("/api/profile/family", async (c, next) => {
    if (!(await deps.ensureParent(c)))
      return c.json({ error: "profile_role_required" }, 403)
    await next()
  })
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  app.get("/api/profile/family", async (c) =>
    c.json({ profile: await deps.service(c).get(actor(c)) })
  )
  app.put("/api/profile/family", async (c) => {
    const body = await c.req.json().catch(() => null)
    const input = familyProfileInput.safeParse(body)
    if (!input.success)
      return c.json({ error: "invalid_family_profile_input" }, 400)
    try {
      return c.json({ profile: await deps.service(c).save(actor(c), input.data) })
    } catch (error) {
      if (error instanceof FamilyProfileError)
        return c.json({ error: error.code }, 400)
      throw error
    }
  })
}
