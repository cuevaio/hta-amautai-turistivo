import type { AuthGateway, Registration, SessionOptions } from "./ports.ts"
export function createAuthService(gateway: AuthGateway) {
  return {
    ...gateway,
    async signup(input: Registration, options: SessionOptions) {
      await gateway.createUser(input)
      return gateway.authenticateWithPassword({
        email: input.email,
        password: input.password,
        ...options,
      })
    },
  }
}
export type AuthService = ReturnType<typeof createAuthService>
