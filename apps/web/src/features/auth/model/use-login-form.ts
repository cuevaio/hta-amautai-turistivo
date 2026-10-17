import { useState } from "react"
import { z } from "zod"
import { credentialsInput, signupInput } from "@amautai/contracts"
import { useNavigate } from "react-router"
import { useAuth } from "./auth-provider"
import { authApi } from "../api/auth-api"
const credentials = credentialsInput
const registration = signupInput
  .extend({ confirm: z.string() })
  .refine((input) => input.password === input.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden.",
  })
export function useLoginForm(mode: "login" | "signup") {
  const signup = mode === "signup"
  const { reloadSession } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(
    new URLSearchParams(window.location.search).has("error")
      ? "No se completó el acceso. Inténtalo de nuevo."
      : ""
  )
  const [issues, setIssues] = useState<Record<string, string>>({})
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIssues({})
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const input = (signup ? registration : credentials).safeParse(data)
    if (!input.success) {
      setIssues(
        Object.fromEntries(
          input.error.issues.map((issue) => [
            issue.path.join("."),
            issue.path[0] === "confirm"
              ? "Las contraseñas no coinciden."
              : issue.path[0] === "password" && signup
                ? "Usa al menos 12 caracteres."
                : issue.path[0] === "firstName"
                  ? "Escribe tu nombre."
                  : "Revisa este campo.",
          ])
        )
      )
      return
    }
    setPending(true)
    try {
      const result = await authApi.signIn(signup, input.data)
      if (result.verificationRequired) {
        navigate("/verify-email", { replace: true })
        return
      }
      if (await reloadSession())
        navigate("/dashboard/projects", { replace: true })
      else
        setError(
          "No pudimos comprobar tu sesión. Recarga para intentarlo de nuevo."
        )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }
  const oauth = authApi.oauth
  return { signup, pending, error, issues, submit, oauth }
}
