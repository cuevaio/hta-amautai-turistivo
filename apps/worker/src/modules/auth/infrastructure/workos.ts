import { WorkOS } from "@workos-inc/node"
import type { Bindings } from "../../../shared/runtime.ts"
import type { AuthGateway } from "../application/ports.ts"
let cached:
  { apiKey: string | undefined; clientId: string; workos: WorkOS } | undefined
export function client(
  env: Pick<Bindings, "WORKOS_API_KEY" | "WORKOS_CLIENT_ID">
) {
  const apiKey = env.WORKOS_API_KEY || undefined
  const clientId = env.WORKOS_CLIENT_ID
  if (!cached || cached.apiKey !== apiKey || cached.clientId !== clientId)
    cached = { apiKey, clientId, workos: new WorkOS(apiKey, { clientId }) }
  return cached.workos
}
async function invoke<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const detail = error as {
      code?: string
      status?: number
      rawData?: { code?: string; pending_authentication_token?: string }
    }
    throw {
      code: detail.rawData?.code || detail.code,
      status: detail.status,
      pendingToken: detail.rawData?.pending_authentication_token,
    }
  }
}
export function workosGateway(
  workos: Pick<WorkOS, "userManagement">
): AuthGateway {
  const service = workos.userManagement
  return {
    createUser: (input) => invoke(() => service.createUser(input)),
    authenticateWithPassword: (input) =>
      invoke(() => service.authenticateWithPassword(input)),
    authenticateWithEmailVerification: (input) =>
      invoke(() => service.authenticateWithEmailVerification(input)),
    authenticateWithCode: (input) =>
      invoke(() => service.authenticateWithCode(input)),
    getAuthorizationUrlWithPKCE: (input) =>
      invoke(() => service.getAuthorizationUrlWithPKCE(input)),
    createPasswordReset: (input) =>
      invoke(() => service.createPasswordReset(input)),
    resetPassword: (input) => invoke(() => service.resetPassword(input)),
    revokeSession: (input) => invoke(() => service.revokeSession(input)),
  }
}
