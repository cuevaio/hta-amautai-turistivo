import { useCallback, useEffect, useRef, useState } from "react"
import type { EmailNotificationOverview } from "@amautai/contracts"
import { emailApi } from "../api/email-api"
export function useEmailNotifications() {
  const [data, setData] = useState<EmailNotificationOverview | null>(null)
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false)
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const active = useRef(false),
    locked = useRef(false),
    revision = useRef(0)
  const load = useCallback(async (signal?: AbortSignal) => {
    const current = ++revision.current
    try {
      const value = await emailApi.overview(signal)
      if (active.current && current === revision.current && !signal?.aborted) {
        setData(value)
        setError("")
      }
    } catch (e) {
      if (active.current && current === revision.current && !signal?.aborted)
        setError((e as Error).message)
    } finally {
      if (active.current && current === revision.current && !signal?.aborted)
        setLoading(false)
    }
  }, [])
  useEffect(() => {
    active.current = true
    const controller = new AbortController()
    emailApi.overview(controller.signal).then(value=>{
      if(!controller.signal.aborted){setData(value);setError("")}
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message)})
    .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    const timer = setInterval(() => {
      if (!locked.current) void load(controller.signal)
    }, 15000)
    return () => {
      active.current = false
      controller.abort()
      clearInterval(timer)
    }
  }, [load])
  async function run(action: () => Promise<unknown>, success: string) {
    if (locked.current) return false
    locked.current = true
    setBusy(true)
    setError("")
    setNotice("")
    revision.current++
    try {
      await action()
      if (active.current) {
        setNotice(success)
        await load()
      }
      return true
    } catch (e) {
      if (active.current) setError((e as Error).message)
      return false
    } finally {
      locked.current = false
      if (active.current) setBusy(false)
    }
  }
  return {
    data,
    loading,
    busy,
    error,
    notice,
    refresh: () => load(),
    requestCode: () =>
      run(
        () => emailApi.requestCode(),
        "Código solicitado. El envío puede tardar hasta un minuto; revisa su estado en el historial."
      ),
    verify: (code: string) =>
      run(
        () => emailApi.verify(code),
        "Correo verificado. Las notificaciones están activas."
      ),
    preferences: (enabled: boolean) =>
      run(
        () => emailApi.preferences(enabled),
        enabled
          ? "Notificaciones activadas."
          : "Notificaciones desactivadas. Los avisos pendientes se cancelaron."
      ),
    schedule: (title: string, at: number, key: string) =>
      run(
        () => emailApi.schedule(title, at, key),
        "Recordatorio programado."
      ),
    test: (key: string) =>
      run(
        () => emailApi.test(key),
        "Mensaje de prueba en cola; consulta su estado en el historial."
      ),
    cancel: (id: string) =>
      run(() => emailApi.cancel(id), "Recordatorio cancelado."),
  }
}
