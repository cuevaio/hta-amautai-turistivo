import type { Hono } from "hono"
import { z } from "zod"
import {
  notificationVerifyInput,
  notificationScheduleInput,
  emailConsentInput,
  emailPreferencesInput,
  emailTestInput,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { emailService } from "../application/email-service.ts"
import { EmailError } from "../domain/email.ts"
import { NotificationError } from "../domain/notification.ts"
export function registerEmailRoutes(
  app: Hono<AppEnv>,
  service: (c: AppContext) => ReturnType<typeof emailService>
) {
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  const email = (c: AppContext) =>
    z.email().max(254).parse(c.get("identity").user.email)
  async function action(c: AppContext, run: () => Promise<unknown>) {
    try {
      return c.json(await run())
    } catch (e) {
      if (e instanceof EmailError || e instanceof NotificationError)
        return c.json(
          { error: e.code },
          e.code === "email_rate_limited"
            ? 429
            : e.code === "email_not_configured"
              ? 503
              : e.code === "email_request_conflict"
                ? 409
                : 400
        )
      if (e instanceof z.ZodError)
        return c.json({ error: "invalid_email_input" }, 400)
      throw e
    }
  }
  const input = (c: AppContext) => c.req.json().catch(() => null)
  app.get("/api/notifications/email", (c) =>
    action(c, () => service(c).overview(actor(c), email(c)))
  )
  app.post("/api/notifications/email/verify/request", (c) =>
    action(c, async () => {
      emailConsentInput.parse(await input(c))
      await service(c).requestCode(actor(c), email(c))
      return { queued: true }
    })
  )
  app.post("/api/notifications/email/verify", (c) =>
    action(c, async () => {
      const data = notificationVerifyInput.parse(await input(c))
      await service(c).verify(actor(c), email(c), data.code)
      return { verified: true }
    })
  )
  app.put("/api/notifications/email/preferences", (c) =>
    action(c, async () => {
      const data = emailPreferencesInput.parse(await input(c))
      await service(c).preferences(actor(c), email(c), data.enabled)
      return { saved: true }
    })
  )
  app.post("/api/notifications/email", (c) =>
    action(c, async () => {
      const n = await service(c).schedule(
        actor(c),
        email(c),
        notificationScheduleInput.parse(await input(c))
      )
      return { id: n.id, status: n.status }
    })
  )
  app.post("/api/notifications/email/test", (c) =>
    action(c, async () => {
      const data = emailTestInput.parse(await input(c))
      const n = await service(c).schedule(
        actor(c),
        email(c),
        { ...data, title: "Mensaje de prueba", scheduledAt: Date.now() },
        true
      )
      return { id: n.id, status: n.status }
    })
  )
  app.delete("/api/notifications/email/:id", (c) =>
    action(c, async () => {
      await service(c).cancel(actor(c), c.req.param("id"))
      return { cancelled: true }
    })
  )
}
