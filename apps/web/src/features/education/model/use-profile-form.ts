import { useEffect, useRef, useState } from "react"
import { teacherProfileInput } from "@amautai/contracts"
import { useEducation } from "./education-provider"
import { emptyContext } from "./session"
export function useProfileForm() {
  const { profile, saveProfile } = useEducation()
  const [context, setContext] = useState(() => ({
    ...(profile?.context ?? emptyContext),
  }))
  const [grade, setGrade] = useState<string[]>(profile ? ["2"] : [])
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const locked = useRef(false),
    mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  async function save() {
    if (locked.current) return false
    const parsed = teacherProfileInput.safeParse({
      role: "teacher",
      level: "primary",
      area: "mathematics",
      grade: grade.includes("2") ? 2 : 0,
      context,
    })
    if (!parsed.success) {
      setError("Selecciona 2.º grado y revisa la extensión de los campos.")
      return false
    }
    locked.current = true
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await saveProfile(parsed.data)
      if (mounted.current) setNotice("Perfil docente guardado.")
      return true
    } catch (error) {
      if (mounted.current) setError((error as Error).message)
      return false
    } finally {
      locked.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return {
    context,
    setContext,
    grade,
    setGrade,
    step,
    setStep,
    busy,
    error,
    notice,
    save,
  }
}
