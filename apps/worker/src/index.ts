import { dispatchEmail } from "./modules/notifications/application/email-service.ts"
import { d1Email } from "./modules/notifications/infrastructure/d1-email.ts"
import { stalwartEmail } from "./modules/notifications/infrastructure/stalwart-email.ts"
import { createApp } from "./app.ts"
import { dispatchNotifications } from "./modules/notifications/application/service.ts"
import { d1Notifications } from "./modules/notifications/infrastructure/d1-notifications.ts"
import { whatsappGateway } from "./modules/notifications/infrastructure/gateway.ts"
import type { Bindings } from "./shared/runtime.ts"
const app = createApp()
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Bindings) {
    const emailProvider = stalwartEmail({ sessionUrl: env.EMAIL_JMAP_SESSION_URL, username: env.EMAIL_JMAP_USERNAME, password: env.EMAIL_JMAP_PASSWORD, from: env.EMAIL_FROM })
    await Promise.all([
      dispatchNotifications(d1Notifications(env.DB), whatsappGateway(env.WHATSAPP_GATEWAY_URL, env.WHATSAPP_GATEWAY_TOKEN)),
      dispatchEmail(d1Email(env.DB), emailProvider),
    ])
  },
}
