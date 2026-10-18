import { test } from "node:test"
import { URL } from "node:url"
import crypto from "node:crypto"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { readFileSync, readdirSync } from "node:fs"
import { createApp } from "../src/app.ts"
import { d1Education } from "../src/modules/education/infrastructure/d1-education.ts"
import { educationService } from "../src/modules/education/application/service.ts"
import { curriculumCatalog } from "../src/modules/education/domain/catalog.ts"
import {
  validateProfile,
  validateSession,
} from "../src/modules/education/domain/education.ts"
const context = {
  location: "Comunidad de prueba",
  region: "highlands",
  setting: "urban",
  language: "Quechua, variedad indicada por el docente",
}
const profile = {
  role: "teacher",
  level: "primary",
  area: "mathematics",
  grade: 2,
  context,
}
const input = {
  title: "Mi sesión incompleta",
  level: "primary",
  area: "mathematics",
  grade: 2,
  catalogVersion: curriculumCatalog.version,
  competenceId: "",
  capacityIds: [],
  purpose: "",
  performance: "",
  situation: "",
  approachIds: [],
  moment: "",
  durationMinutes: null,
  context,
}
const actor = { tenantId: "user:alice", userId: "alice" }
function setup() {
  const db = new DatabaseSync(":memory:")
  const migrations = new URL("../migrations/", import.meta.url)
  for (const name of readdirSync(migrations)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    db.exec(readFileSync(new URL(name, migrations), "utf8"))
  const DB = {
    prepare(sql) {
      let args = []
      return {
        bind(...values) {
          args = values
          return this
        },
        async run() {
          return {
            meta: { changes: Number(db.prepare(sql).run(...args).changes) },
          }
        },
        async first() {
          return db.prepare(sql).get(...args) || null
        },
        async all() {
          return { results: db.prepare(sql).all(...args) }
        },
      }
    },
  }
  db.prepare(
    "INSERT INTO tenants(id,kind,name,created_by) VALUES(?,'personal','Alice','alice'),('user:bob','personal','Bob','bob')"
  ).run(actor.tenantId)
  const repo = d1Education(DB),
    service = educationService(repo, () => crypto.randomUUID())
  const app = createApp(async (c) => {
    const id = c.req.header("x-test-user")
    if (!id) return null
    return {
      sessionId: "test-session",
      user: {
        id,
        email: id + "@example.test",
        emailVerified: true,
        firstName: id,
        lastName: null,
        profilePictureUrl: null,
      },
    }
  })
  const env = { DB, APP_ORIGINS: "http://localhost:5173" }
  const request = (
    path,
    {
      method = "GET",
      data,
      user = "alice",
      csrf = true,
      origin = "http://localhost:5173",
    } = {}
  ) =>
    app.request(
      "http://localhost:5173" + path,
      {
        method,
        headers: {
          "x-test-user": user,
          "Content-Type": "application/json",
          Origin: origin,
          ...(csrf ? { "X-Amautai-Request": "1" } : {}),
        },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      },
      env
    )
  return { db, DB, repo, service, request }
}
test("catalog derives primary cycles and enables only second grade", () => {
  assert.deepEqual(
    curriculumCatalog.grades
      .filter((g) => g.enabled)
      .map((g) => [g.grade, g.cycle]),
    [[2, "III"]]
  )
  assert.deepEqual(
    curriculumCatalog.grades.map((g) => g.cycle),
    ["III", "III", "IV", "IV", "V", "V"]
  )
  assert.equal(curriculumCatalog.competencies.length, 4)
  assert.equal(curriculumCatalog.approaches.length, 7)
  assert.ok(
    curriculumCatalog.sources.every((s) =>
      s.url.startsWith("https://www.minedu.gob.pe/")
    )
  )
})
test("profile persists optional independent context and isolates users even within one tenant", async () => {
  const s = setup()
  assert.equal(await s.service.profile(actor), null)
  await s.service.saveProfile(actor, profile)
  assert.deepEqual(
    (
      await educationService(d1Education(s.DB), crypto.randomUUID).profile(
        actor
      )
    ).context,
    context
  )
  assert.equal(
    await s.service.profile({ ...actor, userId: "another-member" }),
    null
  )
  assert.equal(
    await s.service.profile({ ...actor, tenantId: "user:bob" }),
    null
  )
  await s.service.saveProfile(actor, {
    ...profile,
    context: { location: "", region: "", setting: "", language: "" },
  })
  assert.equal((await s.service.profile(actor)).context.region, "")
})
test("draft requires onboarding, allows missing purpose and retains context after profile edits", async () => {
  const s = setup()
  await assert.rejects(s.service.create(actor, input), {
    code: "education_profile_required",
  })
  await s.service.saveProfile(actor, profile)
  const draft = await s.service.create(actor, input)
  await s.service.saveProfile(actor, {
    ...profile,
    context: { ...context, region: "jungle", location: "Otro lugar" },
  })
  const reloaded = await educationService(
    d1Education(s.DB),
    crypto.randomUUID
  ).get(actor, draft.id)
  assert.deepEqual(reloaded.context, context)
  assert.equal(reloaded.purpose, "")
  assert.equal(reloaded.version, 1)
  assert.equal((await s.service.list(actor)).length, 1)
  assert.equal((await s.service.list({ ...actor, userId: "other" })).length, 0)
})
test("domain rejects disabled curriculum and mismatched or repeated catalogue entries", () => {
  for (const grade of [1, 3, 4, 5, 6])
    assert.throws(() => validateProfile({ ...profile, grade }), {
      code: "invalid_education_input",
    })
  for (const bad of [
    { area: "communication" },
    { level: "secondary" },
    { catalogVersion: "unknown" },
    { competenceId: "invalid" },
    { capacityIds: ["quantity-argue"] },
    { competenceId: "quantity", capacityIds: ["data-support"] },
    {
      competenceId: "quantity",
      capacityIds: ["quantity-argue", "quantity-argue"],
    },
    { approachIds: ["invalid"] },
    { approachIds: ["rights", "rights"] },
    { durationMinutes: 0 },
    { durationMinutes: 1.5 },
    { title: "ab" },
  ])
    assert.throws(() => validateSession({ ...input, ...bad }), {
      code: "invalid_education_input",
    })
})
test("optimistic updates prevent stale writes and owner isolation covers get and update", async () => {
  const s = setup()
  await s.service.saveProfile(actor, profile)
  const first = await s.service.create(actor, input)
  const complete = {
    ...input,
    title: "Título guardado",
    competenceId: "quantity",
    capacityIds: ["quantity-translate"],
    purpose: "Comparamos cantidades",
    performance: "Texto aportado, no una cita oficial",
    situation: "Una cosecha local",
    approachIds: ["environment"],
    moment: "start",
    durationMinutes: 10,
  }
  assert.equal(
    (await s.service.update(actor, first.id, complete, 1)).version,
    2
  )
  await assert.rejects(
    s.service.update(actor, first.id, { ...input, title: "Stale" }, 1),
    { code: "education_version_conflict" }
  )
  assert.equal((await s.service.get(actor, first.id)).title, complete.title)
  for (const other of [
    { ...actor, userId: "other" },
    { ...actor, tenantId: "user:bob" },
  ]) {
    await assert.rejects(s.service.get(other, first.id), {
      code: "education_not_found",
    })
    await assert.rejects(s.service.update(other, first.id, input, 2), {
      code: "education_not_found",
    })
  }
})
test("HTTP enforces auth, mutation origin, strict scope and absent onboarding", async () => {
  const s = setup()
  assert.equal(
    (await s.request("/api/education/profile", { user: "" })).status,
    401
  )
  assert.equal((await s.request("/api/education/catalog")).status, 200)
  assert.deepEqual(await (await s.request("/api/education/profile")).json(), {
    profile: null,
  })
  for (const data of [
    { ...profile, grade: 3 },
    { ...profile, level: "initial" },
    { ...profile, area: "communication" },
    { ...profile, tenantId: "user:bob" },
    { ...profile, context: { ...context, setting: "coast" } },
  ])
    assert.equal(
      (await s.request("/api/education/profile", { method: "PUT", data }))
        .status,
      400
    )
  assert.equal(
    (
      await s.request("/api/education/profile", {
        method: "PUT",
        data: profile,
        csrf: false,
      })
    ).status,
    403
  )
  assert.equal(
    (
      await s.request("/api/education/profile", {
        method: "PUT",
        data: profile,
        origin: "https://foreign.test",
      })
    ).status,
    403
  )
  assert.equal(
    (await s.request("/api/learning-sessions", { method: "POST", data: input }))
      .status,
    409
  )
})
test("HTTP round trip persists independent session versions and reports only missing fields", async () => {
  const s = setup()
  assert.equal(
    (
      await s.request("/api/education/profile", {
        method: "PUT",
        data: profile,
      })
    ).status,
    200
  )
  const created = await s.request("/api/learning-sessions", {
    method: "POST",
    data: input,
  })
  assert.equal(created.status, 201)
  const { session } = await created.json()
  assert.ok(session.missingFields.includes("Competencia"))
  assert.ok(!session.missingFields.includes("Desempeño"))
  const path = "/api/learning-sessions/" + session.id
  assert.equal(
    (
      await s.request(path, {
        method: "PUT",
        data: { ...input, title: "Nueva versión", version: 1 },
      })
    ).status,
    200
  )
  assert.equal(
    (
      await s.request(path, {
        method: "PUT",
        data: { ...input, title: "Sobrescritura", version: 1 },
      })
    ).status,
    409
  )
  assert.equal((await s.request(path, { user: "bob" })).status, 404)
  assert.deepEqual(
    await (await s.request("/api/learning-sessions", { user: "bob" })).json(),
    { sessions: [] }
  )
  assert.equal(
    (
      await s.request(path, {
        method: "PUT",
        data: { ...input, version: 2, grade: 6 },
      })
    ).status,
    400
  )
  assert.equal(
    (await (await s.request(path)).json()).session.title,
    "Nueva versión"
  )
})
