import type { Identity, Tenant } from "../../../shared/domain/identity.ts"
export function tenantFor(identity: Identity): Tenant {
  return identity.organizationId
    ? {
        id: "org:" + identity.organizationId,
        kind: "organization",
        name: "Equipo",
      }
    : { id: "user:" + identity.user.id, kind: "personal", name: "Mi espacio" }
}
