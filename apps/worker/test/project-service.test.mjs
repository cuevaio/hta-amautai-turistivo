import { test } from "node:test"
import assert from "node:assert/strict"
import {
  createProjectService,
  ProjectError,
} from "../src/modules/projects/application/project-service.ts"
const actor = { tenantId: "user:fixture", userId: "fixture" }
const values = {
  name: "  Test project  ",
  description: "  Context  ",
  status: "idea",
}
test("create use case normalizes domain values and forwards only the trusted actor", async () => {
  let saved
  const service = createProjectService(
    {
      async create(context, id, input) {
        saved = { context, id, input }
        return { ...input, id, version: 1, createdAt: "now", updatedAt: "now" }
      },
    },
    () => "generated-id"
  )
  const project = await service.create(actor, values)
  assert.equal(project.name, "Test project")
  assert.equal(project.description, "Context")
  assert.deepEqual(saved.context, actor)
  assert.equal(saved.id, "generated-id")
})
test("invalid domain input and versions fail before persistence", async () => {
  let writes = 0
  const service = createProjectService(
    {
      async update() {
        writes++
        return "ok"
      },
      async create() {
        writes++
      },
    },
    () => "id"
  )
  assert.throws(
    () => service.create(actor, { ...values, name: "a" }),
    ProjectError
  )
  await assert.rejects(
    service.update(actor, "id", values, 0),
    (error) => error.code === "validation_failed"
  )
  assert.equal(writes, 0)
})
test("use case distinguishes tenant-scoped missing records from stale writes", async () => {
  const service = createProjectService(
    {
      async update(tenantId) {
        assert.equal(tenantId, actor.tenantId)
        return "version_conflict"
      },
      async find() {
        return null
      },
    },
    () => "id"
  )
  await assert.rejects(
    service.update(actor, "id", values, 1),
    (error) => error.code === "version_conflict"
  )
  await assert.rejects(
    service.get(actor, "other-id"),
    (error) => error.code === "not_found"
  )
})
