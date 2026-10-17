import type { Hono } from "hono"
import { z } from "zod"
import { projectInput } from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { ProjectService } from "../application/project-service.ts"
import { ProjectError, type Project } from "../application/project-service.ts"
const updateInput = projectInput
  .extend({ version: z.number().int().positive() })
  .strict()
const deleteInput = z.object({ version: z.number().int().positive() }).strict()
function dto(project: Project) {
  const { createdAt, updatedAt, ...values } = project
  return { ...values, created_at: createdAt, updated_at: updatedAt }
}
function actor(c: AppContext) {
  return { userId: c.get("identity").user.id, tenantId: c.get("tenant").id }
}
export function registerProjectRoutes(
  app: Hono<AppEnv>,
  service: (c: AppContext) => ProjectService,
  ensure: (c: AppContext) => Promise<void>
) {
  app.use("/api/projects", async (c, next) => {
    await ensure(c)
    await next()
  })
  app.use("/api/projects/*", async (c, next) => {
    await ensure(c)
    await next()
  })
  app.get("/api/projects", async (c) =>
    c.json({
      projects: (await service(c).list(actor(c))).map(dto),
      tenant: c.get("tenant"),
    })
  )
  app.post("/api/projects", async (c) => {
    const input = projectInput.safeParse(await c.req.json().catch(() => null))
    if (!input.success)
      return c.json(
        {
          error: "validation_failed",
          issues: input.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        400
      )
    return c.json(
      { project: dto(await service(c).create(actor(c), input.data)) },
      201
    )
  })
  app.get("/api/projects/:id", async (c) =>
    c.json({ project: dto(await service(c).get(actor(c), c.req.param("id"))) })
  )
  app.put("/api/projects/:id", async (c) => {
    const input = updateInput.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: "validation_failed" }, 400)
    return c.json({
      project: dto(
        await service(c).update(
          actor(c),
          c.req.param("id"),
          input.data,
          input.data.version
        )
      ),
    })
  })
  app.delete("/api/projects/:id", async (c) => {
    const input = deleteInput.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: "validation_failed" }, 400)
    await service(c).remove(actor(c), c.req.param("id"), input.data.version)
    return c.json({ success: true })
  })
}
export function handleApiError(error: Error, c: AppContext) {
  if (error instanceof ProjectError)
    return c.json(
      { error: error.code },
      error.code === "not_found"
        ? 404
        : error.code === "version_conflict"
          ? 409
          : 400
    )
  return c.json({ error: "service_unavailable" }, 503)
}
