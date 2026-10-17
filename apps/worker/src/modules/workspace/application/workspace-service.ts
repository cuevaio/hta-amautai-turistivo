import { tenantFor } from "../domain/tenant.ts"
import type { Identity, Tenant } from "../../../shared/domain/identity.ts"
export interface WorkspaceRepository {
  ensure(tenant: Tenant, identity: Identity): Promise<void>
  healthy(): Promise<void>
}
export function createWorkspaceService(repository: WorkspaceRepository) {
  return {
    async ensure(identity: Identity) {
      const tenant = tenantFor(identity)
      await repository.ensure(tenant, identity)
      return tenant
    },
    async healthy() {
      try {
        await repository.healthy()
        return true
      } catch {
        return false
      }
    },
  }
}
