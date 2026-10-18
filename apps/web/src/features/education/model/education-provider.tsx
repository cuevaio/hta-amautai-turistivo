import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/features/auth"
import { educationApi } from "../api/education-api"
import type {
  CurriculumCatalog,
  TeacherProfile,
  TeacherProfileInput,
} from "@amautai/contracts"
type Resource = {
  key: string
  attempt: number
  catalog: CurriculumCatalog | null
  profile: TeacherProfile | null
  error: string
}
type Education = Omit<Resource, "key" | "attempt"> & {
  loading: boolean
  retry: () => void
  saveProfile: (input: TeacherProfileInput) => Promise<void>
}
const Context = createContext<Education | null>(null)
export function EducationProvider({ children }: { children: ReactNode }) {
  const { user, tenant } = useAuth()
  const key = user && tenant ? tenant.id + ":" + user.id : ""
  const [attempt, setAttempt] = useState(0)
  const [resource, setResource] = useState<Resource>({
    key: "",
    attempt: -1,
    catalog: null,
    profile: null,
    error: "",
  })
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    Promise.all([
      educationApi.catalog(controller.signal),
      educationApi.profile(controller.signal),
    ])
      .then(([catalog, { profile }]) => {
        if (!controller.signal.aborted)
          setResource({ key, attempt, catalog, profile, error: "" })
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          setResource({
            key,
            attempt,
            catalog: null,
            profile: null,
            error: error.message,
          })
      })
    return () => controller.abort()
  }, [key, attempt])
  const current = key === resource.key && attempt === resource.attempt
  async function saveProfile(input: TeacherProfileInput) {
    const { profile } = await educationApi.saveProfile(input)
    setResource((previous) =>
      previous.key === key ? { ...previous, profile } : previous
    )
  }
  return (
    <Context.Provider
      value={{
        catalog: current ? resource.catalog : null,
        profile: current ? resource.profile : null,
        error: current ? resource.error : "",
        loading: !!key && !current,
        retry: () => setAttempt((value) => value + 1),
        saveProfile,
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useEducation() {
  const value = useContext(Context)
  if (!value) throw new Error("EducationProvider required")
  return value
}
