import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "./auth-provider"
import { authApi } from "../api/auth-api"
export function useEmailVerification() {
  const navigate = useNavigate()
  const { reloadSession } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const code = String(
      new FormData(event.currentTarget).get("code") || ""
    ).trim()
    if (!/^\d{6}$/.test(code)) {
      setError("Escribe el código de 6 dígitos.")
      return
    }
    setPending(true)
    try {
      await authApi.verify(code)
      if (await reloadSession()) navigate("/panel", { replace: true })
      else
        setError(
          "No pudimos comprobar tu sesión. Intenta iniciar sesión de nuevo."
        )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }
  return { pending, error, submit }
}
