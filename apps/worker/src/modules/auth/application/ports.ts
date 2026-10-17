export type Credentials = { email: string; password: string }
export type Registration = Credentials & {
  firstName: string
  lastName?: string
}
export type SessionOptions = {
  session: { sealSession: true; cookiePassword: string }
}
export type AuthResult = { sealedSession?: string }
export interface AuthGateway {
  createUser(input: Registration): Promise<unknown>
  authenticateWithPassword(
    input: Credentials & SessionOptions
  ): Promise<AuthResult>
  authenticateWithEmailVerification(
    input: { code: string; pendingAuthenticationToken: string } & SessionOptions
  ): Promise<AuthResult>
  authenticateWithCode(
    input: { code: string; codeVerifier: string } & SessionOptions
  ): Promise<AuthResult>
  getAuthorizationUrlWithPKCE(input: {
    provider: "GoogleOAuth" | "GitHubOAuth"
    redirectUri: string
  }): Promise<{ url: string; state: string; codeVerifier: string }>
  createPasswordReset(input: { email: string }): Promise<unknown>
  resetPassword(input: { token: string; newPassword: string }): Promise<unknown>
  revokeSession(input: { sessionId: string }): Promise<unknown>
}
export type AuthFailure = {
  code?: string
  status?: number
  pendingToken?: string
}
