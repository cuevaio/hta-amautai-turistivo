import { useEffect, useRef, useState } from "react"
import type { LearningSession, LearningSessionInput } from "@amautai/contracts"
import { learningSessionInput } from "@amautai/contracts"
import { ApiError } from "@/shared/api/client"
import { educationApi } from "../api/education-api"
import { sessionValues } from "./session"
export function useSessions(sessionId?: string) {
  const [attempt, setAttempt] = useState(0)
  const [resource, setResource] = useState<{
    id?: string
    attempt: number
    sessions: LearningSession[]
    session: LearningSession | null
    error: string
  }>({ id: undefined, attempt: -1, sessions: [], session: null, error: "" })
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        let sessions: LearningSession[] = [],
          session: LearningSession | null = null
        if (!sessionId)
          sessions = (await educationApi.list(controller.signal)).sessions
        else if (sessionId !== "new")
          session = (await educationApi.get(sessionId, controller.signal))
            .session
        if (!controller.signal.aborted)
          setResource({ id: sessionId, attempt, sessions, session, error: "" })
      } catch (error) {
        if (!controller.signal.aborted)
          setResource({
            id: sessionId,
            attempt,
            sessions: [],
            session: null,
            error: (error as Error).message,
          })
      }
    }
    void load()
    return () => controller.abort()
  }, [sessionId, attempt])
  const loading = resource.id !== sessionId || resource.attempt !== attempt
  return {
    loading,
    sessions: loading ? [] : resource.sessions,
    session: loading ? null : resource.session,
    error: loading ? "" : resource.error,
    retry: () => setAttempt((a) => a + 1),
  }
}
export function useSessionEditor(
  initial: LearningSessionInput,
  existing: LearningSession | null
) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(existing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState("")
  const [conflict, setConflict] = useState(false)
  const [latest, setLatest] = useState<LearningSession | null>(null)
  const locked = useRef(false),
    mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function save() {
    if (locked.current || conflict) return null
    setNotice("")
    setError("")
    setIssues({})
    const parsed = learningSessionInput.safeParse(values)
    if (!parsed.success) {
      setIssues(
        Object.fromEntries(
          parsed.error.issues.map((i) => [
            i.path.join("."),
            "Revisa este campo.",
          ])
        )
      )
      setError(
        "Revisa el título (3–120 caracteres), los textos y la duración (1–240 minutos)."
      )
      return null
    }
    locked.current = true
    setBusy(true)
    try {
      const { session } = await educationApi.save(
        parsed.data,
        saved?.id,
        saved?.version
      )
      if (!mounted.current) return null
      setSaved(session)
      setNotice("Borrador guardado.")
      return session
    } catch (error) {
      if (mounted.current) {
        setError((error as Error).message)
        if (
          error instanceof ApiError &&
          error.code === "education_version_conflict"
        )
          setConflict(true)
      }
      return null
    } finally {
      locked.current = false
      if (mounted.current) setBusy(false)
    }
  }
  async function loadLatest() {
    if (!saved || locked.current) return
    locked.current = true
    setBusy(true)
    try {
      const { session } = await educationApi.get(saved.id)
      if (mounted.current) setLatest(session)
    } catch (error) {
      if (mounted.current) setError((error as Error).message)
    } finally {
      locked.current = false
      if (mounted.current) setBusy(false)
    }
  }
  function useLatest() {
    if (!latest) return
    setValues(sessionValues(latest))
    setSaved(latest)
    setLatest(null)
    setConflict(false)
    setError("")
    setIssues({})
    setNotice("Se cargó la versión guardada.")
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      if (mounted.current) setNotice("Borrador copiado.")
    } catch {
      if (mounted.current)
        setError(
          "No pudimos copiar. Selecciona el texto del resumen y cópialo manualmente."
        )
    }
  }
  return {
    values,
    setValues,
    saved,
    busy,
    error,
    issues,
    notice,
    conflict,
    latest,
    save,
    loadLatest,
    useLatest,
    copy,
  }
}
