import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "./auth-provider"
import { authApi } from "../api/auth-api"
import { createEmailVerification } from "./email-verification"
export function useEmailVerification() {
  const navigate = useNavigate()
  const { reloadSession } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [verification] = useState(() => createEmailVerification(authApi.verify))
  const [accepted, setAccepted] = useState(false)
  const submitting = useRef(false)
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setError("")
    const code = String(
      new FormData(event.currentTarget).get("code") || ""
    ).trim()
    setPending(true)
    try {
      const result = await verification.continue(code, () =>
        reloadSession({ background: true })
      )
      if (result === "complete") navigate("/panel", { replace: true })
      else if (result === "session-unavailable")
        setError(
          "Tu correo está verificado. Reintenta el acceso para abrir tu sesión."
        )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      submitting.current = false
      setAccepted(verification.isAccepted())
      setPending(false)
    }
  }
  return { pending, accepted, error, submit }
}
