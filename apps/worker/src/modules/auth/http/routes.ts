import { bodyLimit } from "hono/body-limit"
import type { Hono } from "hono"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { Identity, Tenant } from "../../../shared/domain/identity.ts"
import type { AuthService } from "../application/auth-service.ts"
import { origins, startOAuth, finishOAuth, clearSession } from "./sessions.ts"
import { registerPasswordRoutes } from "./password-routes.ts"
import { registerRecoveryRoutes } from "./recovery-routes.ts"
export function registerAuthRoutes(
  app: Hono<AppEnv>,
  deps: {
    publicRoutes?: (app: Hono<AppEnv>) => void
    service: (c: AppContext) => AuthService
    authenticate: (c: AppContext) => Promise<Identity | null>
    ensureTenant: (c: AppContext) => Promise<Tenant>
    healthy: (c: AppContext) => Promise<boolean>
  }
) {
  app.use("/api/*", async (c, next) => {
    c.header("Cache-Control", "no-store")
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      const origin = c.req.header("Origin") || ""
      if (
        !origins(c).includes(origin) ||
        c.req.header("X-Amautai-Request") !== "1"
      )
        return c.json({ error: "forbidden_origin" }, 403)
    }
    await next()
  })
  app.use("/api/*", bodyLimit({ maxSize: 16384 }))
  app.get("/api/health", async (c) => {
    return (await deps.healthy(c))
      ? c.json({ status: "ok", service: "amautai", database: "connected" })
      : c.json({ status: "unavailable", database: "unavailable" }, 503)
  })
  app.get("/api/auth/oauth/:provider", async (c) => {
    const provider = c.req.param("provider")
    const origin = c.req.query("origin") || ""
    if (
      !origins(c).includes(origin) ||
      !["google", "github"].includes(provider)
    )
      return c.json({ error: "invalid_oauth_request" }, 400)
    if (!c.env.WORKOS_API_KEY || !c.env.WORKOS_COOKIE_PASSWORD)
      return c.json({ error: "auth_not_configured" }, 503)
    return startOAuth(
      c,
      provider === "google" ? "GoogleOAuth" : "GitHubOAuth",
      origin,
      deps.service(c)
    )
  })
  app.get("/callback", (c) => finishOAuth(c, deps.service))
  registerPasswordRoutes(app, deps.service)
  registerRecoveryRoutes(app, deps.service)
  deps.publicRoutes?.(app)
  app.use("/api/*", async (c, next) => {
    try {
      const identity = await deps.authenticate(c)
      if (!identity) {
        if (c.req.path === "/api/auth/logout" && c.req.method === "POST") {
          clearSession(c)
          return c.json({ success: true })
        }
        return c.json({ error: "unauthorized" }, 401)
      }
      c.set("identity", identity)
    } catch (error) {
      const detail = error as {
        name?: string
        code?: string
        claim?: string
        reason?: string
      }
      console.info(
        "amautai_session_check",
        JSON.stringify({
          name: detail.name,
          code: detail.code,
          claim: detail.claim,
          reason: detail.reason,
        })
      )
      return c.json({ error: "auth_unavailable" }, 503)
    }
    await next()
  })
  app.get("/api/auth/session", async (c) => {
    const tenant = await deps.ensureTenant(c)
    return c.json({
      user: c.get("identity").user,
      tenant,
      database: "connected",
    })
  })
  app.get("/api/me", async (c) => {
    const tenant = await deps.ensureTenant(c)
    return c.json({
      id: c.get("identity").user.id,
      tenant,
      database: "connected",
    })
  })
  app.post("/api/auth/logout", async (c) => {
    try {
      await deps
        .service(c)
        .revokeSession({ sessionId: c.get("identity").sessionId })
    } catch {
      return c.json({ error: "logout_unavailable" }, 503)
    }
    clearSession(c)
    return c.json({ success: true })
  })
}
