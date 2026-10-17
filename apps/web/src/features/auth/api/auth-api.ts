import { api, ApiError } from "@/shared/api/client"
import type { AuthResult, Session } from "@amautai/contracts"
export const authApi = {
  async session(signal?: AbortSignal): Promise<Session | null> {
    try {
      return await api<Session>("/api/auth/session", { signal })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  logout: () => api("/api/auth/logout", { method: "POST" }),
  signIn: (
    signup: boolean,
    input: { email: string; password: string; firstName?: string }
  ) =>
    api<AuthResult>(signup ? "/api/auth/signup" : "/api/auth/password", {
      method: "POST",
      body: JSON.stringify(
        signup
          ? {
              email: input.email,
              password: input.password,
              firstName: input.firstName,
            }
          : { email: input.email, password: input.password }
      ),
    }),
  verify: (code: string) =>
    api<AuthResult>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  resetStatus: (signal?: AbortSignal) =>
    api<{ valid: boolean }>("/api/auth/password-reset/status", { signal }),
  recover: (email: string) =>
    api("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  reset: (newPassword: string) =>
    api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
  oauth(provider: "google" | "github") {
    window.location.assign(
      "/api/auth/oauth/" +
        provider +
        "?origin=" +
        encodeURIComponent(window.location.origin)
    )
  },
}
