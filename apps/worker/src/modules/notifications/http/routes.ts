import type { Hono } from "hono"
import { z } from "zod"
import {
  notificationPhoneInput,
  notificationPreferencesInput,
  notificationScheduleInput,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { notificationService } from "../application/service.ts"
import { NotificationError } from "../domain/notification.ts"
export function registerNotificationRoutes(
  app: Hono<AppEnv>,
  service: (c: AppContext) => ReturnType<typeof notificationService>,
  ensure: (c: AppContext) => Promise<void>
) {
  app.use("/api/notifications/*", async (c, next) => {
    await ensure(c)
    await next()
  })
  app.use("/api/notifications", async (c, next) => {
    await ensure(c)
    await next()
  })
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  async function action(c: AppContext, run: () => Promise<unknown>) {
    try {
      return c.json(await run())
    } catch (e) {
      if (e instanceof NotificationError)
        return c.json(
          { error: e.code },
          e.code === "notification_rate_limited"
            ? 429
            : e.code === "whatsapp_unavailable"
              ? 503
              : 400
        )
      if (e instanceof z.ZodError)
        return c.json({ error: "invalid_notification_input" }, 400)
      throw e
    }
  }
  async function input(c: AppContext) {
    return c.req.json().catch(() => null)
  }
  app.get("/api/notifications", (c) =>
    action(c, () => service(c).overview(actor(c)))
  )
  app.post("/api/notifications/phone", (c) =>
    action(c, async () => {
      const data = notificationPhoneInput.parse(await input(c))
      await service(c).register(actor(c), data.phone)
      return { registered: true, enabled: true }
    })
  )
  app.put("/api/notifications/preferences", (c) =>
    action(c, async () => {
      const data = notificationPreferencesInput.parse(await input(c))
      await service(c).preferences(actor(c), data.enabled, data.timezone)
      return { saved: true }
    })
  )
  app.post("/api/notifications", (c) =>
    action(c, async () => {
      const data = notificationScheduleInput.parse(await input(c))
      const item = await service(c).schedule(actor(c), data)
      return { id: item.id, status: item.status }
    })
  )
  app.post("/api/notifications/test", (c) =>
    action(c, async () => {
      const data = z
        .object({ requestKey: z.uuid() })
        .strict()
        .parse(await input(c))
      const item = await service(c).schedule(
        actor(c),
        { title: "Mensaje de prueba", scheduledAt: Date.now(), ...data },
        true
      )
      return { id: item.id, status: item.status }
    })
  )
  app.delete("/api/notifications/:id", (c) =>
    action(c, async () => {
      await service(c).cancel(actor(c), c.req.param("id"))
      return { cancelled: true }
    })
  )
}
