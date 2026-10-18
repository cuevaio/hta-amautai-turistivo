import type {
  AuthGateway,
  AuthFailure,
  Registration,
  SessionOptions,
} from "./ports.ts"
export interface AuthMailer {
  verification(input: {
    id: string
    email: string
    code: string
  }): Promise<void>
  recovery(input: unknown): Promise<void>
}
export function createAuthService(gateway: AuthGateway, mailer?: AuthMailer) {
  async function authenticate<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    } catch (error) {
      const failure = error as AuthFailure
      if (mailer && failure.code === "email_verification_required") {
        if (!failure.verificationId)
          throw { code: "auth_email_unavailable", status: 503 }
        await mailer.verification(
          await gateway.getEmailVerification(failure.verificationId)
        )
      }
      throw error
    }
  }
  const service = {
    ...gateway,
    authenticateWithPassword: (
      input: Parameters<AuthGateway["authenticateWithPassword"]>[0]
    ) => authenticate(() => gateway.authenticateWithPassword(input)),
    authenticateWithCode: (
      input: Parameters<AuthGateway["authenticateWithCode"]>[0]
    ) => authenticate(() => gateway.authenticateWithCode(input)),
    async createPasswordReset(input: { email: string }) {
      const result = await gateway.createPasswordReset(input)
      if (mailer) await mailer.recovery(result)
      return result
    },
    async signup(input: Registration, options: SessionOptions) {
      await gateway.createUser(input)
      return service.authenticateWithPassword({
        email: input.email,
        password: input.password,
        ...options,
      })
    },
  }
  return service
}
export type AuthService = ReturnType<typeof createAuthService>
