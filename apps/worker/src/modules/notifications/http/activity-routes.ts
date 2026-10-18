import type { Hono } from "hono"
import { activityPreferenceInput } from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import { NotificationError } from "../domain/notification.ts"
import type { activityPreferences } from "../application/activity-service.ts"
export function registerActivityRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => ReturnType<typeof activityPreferences>
    channels: (
      c: AppContext
    ) => Promise<{
      email: { configured: boolean; verified: boolean; optedOut: boolean }
      whatsapp: { registered: boolean }
    }>
  }
) {
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  app.get("/api/notifications/settings", async (c) =>
    c.json(await deps.service(c).overview(actor(c), await deps.channels(c)))
  )
  app.put("/api/notifications/settings", async (c) => {
    const input = activityPreferenceInput.safeParse(
      await c.req.json().catch(() => null)
    )
    if (!input.success)
      return c.json({ error: "invalid_notification_input" }, 400)
    try {
      await deps.service(c).save(actor(c), input.data, await deps.channels(c))
      return c.json({ saved: true })
    } catch (e) {
      if (e instanceof NotificationError) return c.json({ error: e.code }, 400)
      throw e
    }
  })
}
