import type { WorkspaceRepository } from "../application/workspace-service.ts"
export function d1Workspaces(db: D1Database): WorkspaceRepository {
  return {
    async ensure(tenant, identity) {
      await db
        .prepare(
          "INSERT INTO tenants (id,kind,name,workos_org_id,created_by) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING"
        )
        .bind(
          tenant.id,
          tenant.kind,
          tenant.name,
          identity.organizationId || null,
          identity.user.id
        )
        .run()
    },
    async healthy() {
      await db.prepare("SELECT 1 AS ok").first()
    },
  }
}
