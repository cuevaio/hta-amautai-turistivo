import type { Hono } from "hono"
import {
  teacherProfileInput,
  learningSessionInput,
  learningSessionUpdate,
} from "@amautai/contracts"
import type { AppContext, AppEnv } from "../../../shared/http/context.ts"
import type { EducationService } from "../application/service.ts"
import { curriculumCatalog } from "../domain/catalog.ts"
import {
  EducationError,
  missingFields,
  type LearningSession,
} from "../domain/education.ts"
const dto = (session: LearningSession) => ({
  ...session,
  missingFields: missingFields(session),
})
export function registerEducationRoutes(
  app: Hono<AppEnv>,
  deps: {
    service: (c: AppContext) => EducationService
    ensure: (c: AppContext) => Promise<boolean>
  }
) {
  app.use("/api/education/*", async (c, next) => {
    if (!(await deps.ensure(c)))
      return c.json({ error: "profile_role_required" }, 403)
    await next()
  })
  app.use("/api/learning-sessions", async (c, next) => {
    if (!(await deps.ensure(c)))
      return c.json({ error: "profile_role_required" }, 403)
    await next()
  })
  app.use("/api/learning-sessions/*", async (c, next) => {
    if (!(await deps.ensure(c)))
      return c.json({ error: "profile_role_required" }, 403)
    await next()
  })
  const actor = (c: AppContext) => ({
    tenantId: c.get("tenant").id,
    userId: c.get("identity").user.id,
  })
  const body = (c: AppContext) => c.req.json().catch(() => null)
  async function action(
    c: AppContext,
    run: () => Promise<unknown>,
    created = false
  ) {
    try {
      return c.json(await run(), created ? 201 : 200)
    } catch (error) {
      if (error instanceof EducationError)
        return c.json(
          { error: error.code },
          error.code === "education_not_found"
            ? 404
            : error.code === "education_version_conflict" ||
                error.code === "education_profile_required"
              ? 409
              : 400
        )
      throw error
    }
  }
  app.get("/api/education/catalog", (c) => c.json(curriculumCatalog))
  app.get("/api/education/profile", (c) =>
    action(c, async () => ({
      profile: await deps.service(c).profile(actor(c)),
    }))
  )
  app.put("/api/education/profile", async (c) => {
    const input = teacherProfileInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_education_input" }, 400)
    return action(c, async () => ({
      profile: await deps.service(c).saveProfile(actor(c), input.data),
    }))
  })
  app.get("/api/learning-sessions", (c) =>
    action(c, async () => ({
      sessions: (await deps.service(c).list(actor(c))).map(dto),
    }))
  )
  app.post("/api/learning-sessions", async (c) => {
    const input = learningSessionInput.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_education_input" }, 400)
    return action(
      c,
      async () => ({
        session: dto(await deps.service(c).create(actor(c), input.data)),
      }),
      true
    )
  })
  app.get("/api/learning-sessions/:id", (c) =>
    action(c, async () => ({
      session: dto(await deps.service(c).get(actor(c), c.req.param("id"))),
    }))
  )
  app.put("/api/learning-sessions/:id", async (c) => {
    const input = learningSessionUpdate.safeParse(await body(c))
    if (!input.success) return c.json({ error: "invalid_education_input" }, 400)
    const { version, ...values } = input.data
    return action(c, async () => ({
      session: dto(
        await deps
          .service(c)
          .update(actor(c), c.req.param("id"), values, version)
      ),
    }))
  })
}
