import type { Context } from "hono"
import type { Identity, Tenant } from "../domain/identity.ts"
import type { Bindings } from "../runtime.ts"
export type AppEnv = {
  Bindings: Bindings
  Variables: {
    assignedGame: {
      assignment: { tenantId: string; userId: string }
      room: import("@amautai/contracts").CargoRoom
      participant: import("@amautai/contracts").CargoParticipant
    }
    identity: Identity
    tenant: Tenant
  }
}
export type AppContext = Context<AppEnv>
