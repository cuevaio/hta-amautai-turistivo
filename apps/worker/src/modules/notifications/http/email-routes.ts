import type { Hono } from "hono"
import { z } from "zod"
import {
  notificationScheduleInput,
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
  const account = (c: AppContext) => ({
    email: z.email().max(254).parse(c.get("identity").user.email),
    emailVerified: c.get("identity").user.emailVerified === true,
  })
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
              : e.code === "email_verification_required"
                ? 403
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
    action(c, () => service(c).overview(actor(c), account(c)))
  )
  // Old clients cannot start a second verification flow.
  for (const path of ["/api/notifications/email/verify/request","/api/notifications/email/verify"]) {
    app.post(path,c=>c.json({error:"email_verification_in_login"},410))
  }
  app.put("/api/notifications/email/preferences", (c) =>
    action(c, async () => {
      const data = emailPreferencesInput.parse(await input(c))
      await service(c).preferences(actor(c), account(c), data.enabled)
      return { saved: true }
    })
  )
  app.post("/api/notifications/email", (c) =>
    action(c, async () => {
      const n = await service(c).schedule(
        actor(c),
        account(c),
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
        account(c),
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
