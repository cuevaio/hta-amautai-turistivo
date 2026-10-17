import { useEffect, useState } from "react"
import { settingsApi } from "../api/settings-api"
export function useWorkspaceHealth(account: boolean) {
  const [health, setHealth] = useState<"checking" | "ok" | "error">("checking")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (account) return
    const controller = new AbortController()
    settingsApi
      .health(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setHealth(
            result.status === "ok" && result.database === "connected"
              ? "ok"
              : "error"
          )
      })
      .catch(() => {
        if (!controller.signal.aborted) setHealth("error")
      })
    return () => controller.abort()
  }, [account, attempt])
  return {
    health,
    retry() {
      setHealth("checking")
      setAttempt((value) => value + 1)
    },
  }
}
