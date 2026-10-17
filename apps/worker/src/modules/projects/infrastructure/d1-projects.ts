import type {
  Actor,
  ProjectRepository,
  WriteResult,
} from "../application/project-service.ts"
import type { Project, ProjectValues } from "../domain/project.ts"
type Row = ProjectValues & {
  id: string
  version: number
  created_at: string
  updated_at: string
}
const columns = "id,name,description,status,version,created_at,updated_at"
function entity(row: Row): Project {
  const { created_at, updated_at, ...values } = row
  return { ...values, createdAt: created_at, updatedAt: updated_at }
}
export function d1Projects(db: D1Database): ProjectRepository {
  async function find(tenantId: string, id: string) {
    const row = await db
      .prepare(
        "SELECT " +
          columns +
          " FROM projects WHERE id=? AND tenant_id=? AND deleted_at IS NULL"
      )
      .bind(id, tenantId)
      .first<Row>()
    return row ? entity(row) : null
  }
  async function outcome(
    changes: number | undefined,
    tenantId: string,
    id: string
  ): Promise<WriteResult> {
    return changes
      ? "ok"
      : (await find(tenantId, id))
        ? "version_conflict"
        : "not_found"
  }
  return {
    find,
    async list(tenantId) {
      const result = await db
        .prepare(
          "SELECT " +
            columns +
            " FROM projects WHERE tenant_id=? AND deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 100"
        )
        .bind(tenantId)
        .all<Row>()
      return result.results.map(entity)
    },
    async create(actor: Actor, id, values) {
      await db
        .prepare(
          "INSERT INTO projects (id,tenant_id,name,description,status,created_by) VALUES (?,?,?,?,?,?)"
        )
        .bind(
          id,
          actor.tenantId,
          values.name,
          values.description,
          values.status,
          actor.userId
        )
        .run()
      const project = await find(actor.tenantId, id)
      if (!project) throw new Error("Project persistence unavailable")
      return project
    },
    async update(tenantId, id, values, version) {
      const result = await db
        .prepare(
          "UPDATE projects SET name=?,description=?,status=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND tenant_id=? AND version=? AND deleted_at IS NULL"
        )
        .bind(
          values.name,
          values.description,
          values.status,
          id,
          tenantId,
          version
        )
        .run()
      return outcome(result.meta.changes, tenantId, id)
    },
    async remove(tenantId, id, version) {
      const result = await db
        .prepare(
          "UPDATE projects SET deleted_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),version=version+1 WHERE id=? AND tenant_id=? AND version=? AND deleted_at IS NULL"
        )
        .bind(id, tenantId, version)
        .run()
      return outcome(result.meta.changes, tenantId, id)
    },
  }
}
