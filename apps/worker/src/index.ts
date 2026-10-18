import { dispatchAssignments } from "./modules/rooms/application/assignment-service.ts"
import { d1Assignments } from "./modules/rooms/infrastructure/d1-assignments.ts"
import { dispatchEmail } from "./modules/notifications/application/email-service.ts"
import { d1Email } from "./modules/notifications/infrastructure/d1-email.ts"
import { stalwartEmail } from "./modules/notifications/infrastructure/stalwart-email.ts"
import { createApp, assignmentMessenger } from "./app.ts"
import { dispatchNotifications } from "./modules/notifications/application/service.ts"
import { d1Notifications } from "./modules/notifications/infrastructure/d1-notifications.ts"
import { whatsappGateway } from "./modules/notifications/infrastructure/gateway.ts"
import type { Bindings } from "./shared/runtime.ts"
import { dispatchProfileWelcomes } from "./modules/profiles/application/service.ts"
import { d1Profiles } from "./modules/profiles/infrastructure/d1-profiles.ts"
import { notificationService } from "./modules/notifications/index.ts"
const app = createApp()
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Bindings) {
    const whatsapp = whatsappGateway(
      env.WHATSAPP_GATEWAY_URL,
      env.WHATSAPP_GATEWAY_TOKEN
    )
    const notificationRepo = d1Notifications(env.DB)
    const notifications = notificationService(notificationRepo, whatsapp, {
      id: () => crypto.randomUUID(),
    })
    await dispatchProfileWelcomes(d1Profiles(env.DB), notifications.welcome)
    const emailProvider = stalwartEmail({
      sessionUrl: env.EMAIL_JMAP_SESSION_URL,
      username: env.EMAIL_JMAP_USERNAME,
      password: env.EMAIL_JMAP_PASSWORD,
      from: env.EMAIL_FROM,
    })
    await Promise.all([
      dispatchAssignments(
        d1Assignments(env.DB),
        assignmentMessenger(whatsapp)
      ),
      dispatchNotifications(notificationRepo, whatsapp),
      dispatchEmail(d1Email(env.DB), emailProvider),
    ])
  },
}
