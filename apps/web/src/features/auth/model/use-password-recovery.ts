import { recoveryInput, resetPasswordInput } from "@amautai/contracts"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { ApiError } from "@/shared/api/client"
import { useAuth } from "./auth-provider"
import { authApi } from "../api/auth-api"
export function usePasswordRecovery(reset: boolean) {
  const navigate = useNavigate()
  const { reloadSession } = useAuth()
  const [valid, setValid] = useState<boolean | null>(reset ? null : true)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [invalid, setInvalid] = useState(false)
  useEffect(() => {
    if (!reset) return
    const controller = new AbortController()
    authApi
      .resetStatus(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setValid(data.valid)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "No pudimos comprobar el enlace. Recarga para intentarlo de nuevo."
          )
      })
    return () => controller.abort()
  }, [reset])
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setInvalid(false)
    const data = new FormData(event.currentTarget)
    if (reset && data.get("newPassword") !== data.get("confirm")) {
      setInvalid(true)
      setError("Las contraseñas no coinciden.")
      return
    }
    const input = reset
      ? { newPassword: String(data.get("newPassword") || "") }
      : { email: String(data.get("email") || "").trim() }
    const parsed = reset
      ? resetPasswordInput.safeParse(input)
      : recoveryInput.safeParse(input)
    if (!parsed.success) {
      setInvalid(true)
      setError(
        reset
          ? "La nueva contraseña debe tener al menos 12 caracteres."
          : "Escribe un correo electrónico válido."
      )
      return
    }
    setPending(true)
    try {
      await (reset
        ? authApi.reset(String(data.get("newPassword") || ""))
        : authApi.recover(String(data.get("email") || "").trim()))
      if (reset) {
        await reloadSession()
        navigate("/login?password_reset=1", { replace: true })
      } else setSent(true)
    } catch (err) {
      setInvalid(
        err instanceof ApiError &&
          [
            "invalid_recovery_email",
            "invalid_reset_password",
            "password_policy",
          ].includes(err.code || "")
      )
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }
  return { valid, pending, sent, error, invalid, submit }
}
