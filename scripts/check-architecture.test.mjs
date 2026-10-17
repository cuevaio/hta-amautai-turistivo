import { test } from "node:test"
import assert from "node:assert/strict"
import { checkArchitecture } from "./check-architecture.mjs"
const d = "apps/worker/src/modules/projects/domain/project.ts"
const a = "apps/worker/src/modules/projects/application/service.ts"
const i = "apps/worker/src/modules/projects/infrastructure/repository.ts"
const h = "apps/worker/src/modules/projects/http/routes.ts"
const u = "apps/web/src/features/projects/ui/form.tsx"
const api = "apps/web/src/features/projects/api/client.ts"
test("accepts inward dependencies and an isolated fetch transport", () => {
  const files = new Map([
    [d, "export type Project = { id: string }"],
    [
      a,
      'import type { Project } from "../domain/project.ts"; export type Result = Project',
    ],
    [i, 'import type { Result } from "../application/service.ts"'],
    [h, 'import type { Result } from "../application/service.ts"'],
    ["apps/web/src/shared/api/client.ts", "export const request = fetch"],
  ])
  assert.deepEqual(checkArchitecture(files), [])
})
test("rejects framework imports in domain, including re-exports and import types", () => {
  for (const source of [
    'import { Hono } from "hono"',
    'export * from "hono"',
    'type H = import("hono").Hono',
  ])
    assert.ok(
      checkArchitecture(new Map([[d, source]])).some((error) =>
        error.includes("external package")
      )
    )
})
test("rejects application to infrastructure and infrastructure to HTTP", () => {
  const errors = checkArchitecture(
    new Map([
      [a, 'import "../infrastructure/repository.ts"'],
      [i, 'import "../http/routes.ts"'],
      [h, "export {}"],
    ])
  )
  assert.ok(errors.some((error) => error.includes("Application cannot")))
  assert.ok(errors.some((error) => error.includes("Infrastructure cannot")))
})
test("rejects UI API calls, private feature imports, and aliased network access", () => {
  const files = new Map([
    [
      u,
      'import "../api/client"; import "@/features/auth/model/private"; window["fetch"]("/")',
    ],
    [api, "export {}"],
    ["apps/web/src/features/auth/model/private.ts", "export {}"],
  ])
  const errors = checkArchitecture(files)
  assert.ok(errors.some((error) => error.includes("UI must call")))
  assert.ok(errors.some((error) => error.includes("public index")))
  assert.ok(errors.some((error) => error.includes("Network access")))
})
test("rejects SQL outside repositories, dynamic escape hatches, and axios manifests", () => {
  const errors = checkArchitecture(
    new Map([[h, "db.prepare('SELECT 1'); import(variable)"]]),
    [["package.json", { dependencies: { axios: "*" } }]]
  )
  for (const expected of ["D1 queries", "Nonliteral", "Native fetch policy"])
    assert.ok(errors.some((error) => error.includes(expected)))
})
test("rejects cycles and unresolved local imports", () => {
  const files = new Map([
    ["apps/web/src/shared/lib/a.ts", 'export * from "./b"'],
    ["apps/web/src/shared/lib/b.ts", 'export * from "./a"; import "./missing"'],
  ])
  const errors = checkArchitecture(files)
  assert.ok(errors.some((error) => error.includes("cycle")))
  assert.ok(errors.some((error) => error.includes("Unresolved")))
})

test("rejects Worker packages imported by browser code", () => {
  const errors = checkArchitecture(
    new Map([
      ["apps/web/src/features/auth/api/bad.ts", 'import "@amautai/worker"'],
    ])
  )
  assert.ok(errors.some((error) => error.includes("server packages")))
})

test("accepts Worker handler export while rejecting network calls in composition", () => {
  const entry = "apps/worker/src/index.ts"
  assert.deepEqual(
    checkArchitecture(
      new Map([[entry, "export default { fetch: app.fetch, scheduled() {} }"]])
    ),
    []
  )
  assert.ok(
    checkArchitecture(
      new Map([[entry, "export default { fetch: app.fetch }; fetch(url)"]])
    ).some((e) => e.includes("Network access"))
  )
})
test("gateway remains isolated from Worker/browser internals", () => {
  assert.ok(
    checkArchitecture(
      new Map([
        [
          "apps/whatsapp-gateway/src/server.ts",
          'import "../../worker/src/app.ts"',
        ],
        ["apps/worker/src/app.ts", "export {}"],
      ])
    ).some((e) => e.includes("Gateway cannot"))
  )
})
