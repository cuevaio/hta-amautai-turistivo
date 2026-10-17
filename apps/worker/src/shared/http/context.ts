import type { Context } from "hono"
import type { Identity, Tenant } from "../domain/identity.ts"
import type { Bindings } from "../runtime.ts"
export type AppEnv = {
  Bindings: Bindings
  Variables: { identity: Identity; tenant: Tenant }
}
export type AppContext = Context<AppEnv>
