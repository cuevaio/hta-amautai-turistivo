import { emailService } from "./modules/notifications/application/email-service.ts"
import { d1Email } from "./modules/notifications/infrastructure/d1-email.ts"
import { stalwartEmail } from "./modules/notifications/infrastructure/stalwart-email.ts"
import { registerEmailRoutes } from "./modules/notifications/http/email-routes.ts"
import type { WhatsAppGateway } from "./modules/notifications/application/ports.ts"
import { notificationService } from "./modules/notifications/application/service.ts"
import { d1Notifications } from "./modules/notifications/infrastructure/d1-notifications.ts"
import { whatsappGateway } from "./modules/notifications/infrastructure/gateway.ts"
import { verificationCrypto } from "./modules/notifications/infrastructure/crypto.ts"
import { registerNotificationRoutes } from "./modules/notifications/http/routes.ts"
import { Hono } from "hono"
import type { AppContext, AppEnv } from "./shared/http/context.ts"
import type { Identity } from "./shared/domain/identity.ts"
import { createAuthService } from "./modules/auth/application/auth-service.ts"
import { client, workosGateway } from "./modules/auth/infrastructure/workos.ts"
import { resolveWorkosSession } from "./modules/auth/infrastructure/session-verifier.ts"
import { resolveIdentity } from "./modules/auth/http/sessions.ts"
import { registerAuthRoutes } from "./modules/auth/http/routes.ts"
import { createWorkspaceService } from "./modules/workspace/application/workspace-service.ts"
import { d1Workspaces } from "./modules/workspace/infrastructure/d1-workspaces.ts"
import { createProjectService } from "./modules/projects/application/project-service.ts"
import { d1Projects } from "./modules/projects/infrastructure/d1-projects.ts"
import {
  registerProjectRoutes,
  handleApiError,
} from "./modules/projects/http/routes.ts"
export function createApp(
  authenticate: (c: AppContext) => Promise<Identity | null> = (c) =>
    resolveIdentity(c, (cookie) => resolveWorkosSession(cookie, c.env)),
  provider: (c: AppContext) => Parameters<typeof workosGateway>[0] = (c) =>
    client(c.env),
  gateway: (c: AppContext) => WhatsAppGateway = (c) =>
    whatsappGateway(c.env.WHATSAPP_GATEWAY_URL, c.env.WHATSAPP_GATEWAY_TOKEN)
) {
  const app = new Hono<AppEnv>()
  const workspace = (c: AppContext) =>
    createWorkspaceService(d1Workspaces(c.env.DB))
  async function ensureTenant(c: AppContext) {
    const tenant = await workspace(c).ensure(c.get("identity"))
    c.set("tenant", tenant)
    return tenant
  }
  registerAuthRoutes(app, {
    authenticate,
    service: (c) => createAuthService(workosGateway(provider(c))),
    ensureTenant,
    healthy: (c) => workspace(c).healthy(),
  })
  registerProjectRoutes(
    app,
    (c) =>
      createProjectService(d1Projects(c.env.DB), () => crypto.randomUUID()),
    async (c) => {
      await ensureTenant(c)
    }
  )
  registerNotificationRoutes(
    app,
    (c) =>
      notificationService(
        d1Notifications(c.env.DB),
        gateway(c),
        verificationCrypto(c.env.WORKOS_COOKIE_PASSWORD)
      ),
    async (c) => {
      await ensureTenant(c)
    }
  )
  registerEmailRoutes(app, c => emailService(d1Email(c.env.DB), stalwartEmail({
    sessionUrl:c.env.EMAIL_JMAP_SESSION_URL, username:c.env.EMAIL_JMAP_USERNAME,
    password:c.env.EMAIL_JMAP_PASSWORD, from:c.env.EMAIL_FROM,
  }), verificationCrypto(c.env.WORKOS_COOKIE_PASSWORD)))
  app.onError(handleApiError)
  app.notFound((c) => c.json({ error: "not_found" }, 404))
  return app
}
