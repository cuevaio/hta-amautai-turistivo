import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type {
  AccountProfile,
  AccountProfileRole,
  FamilyProfile,
  FamilyProfileInput,
} from "@amautai/contracts"
import { useAuth } from "@/features/auth"
import { profileApi } from "../api/profile-api"

type ProfileState = {
  key: string
  attempt: number
  profile: AccountProfile | null
  familyProfile: FamilyProfile | null
  error: string
  loading: boolean
}
type ProfileContextValue = Omit<ProfileState, "attempt"> & {
  retry: () => void
  save: (role: AccountProfileRole) => Promise<void>
  saveFamily: (input: FamilyProfileInput) => Promise<void>
}
const Context = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, tenant } = useAuth()
  const key = user && tenant ? `${tenant.id}:${user.id}` : ""
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ProfileState>({
    key: "",
    attempt: -1,
    profile: null,
    familyProfile: null,
    error: "",
    loading: true,
  })

  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    profileApi
      .get(controller.signal)
      .then(async ({ profile }) => {
        const familyProfile =
          profile?.role === "parent"
            ? (await profileApi.getFamily(controller.signal)).profile
            : null
        if (!controller.signal.aborted)
          setState({
            key,
            attempt,
            profile,
            familyProfile,
            error: "",
            loading: false,
          })
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            attempt,
            profile: null,
            familyProfile: null,
            error: error.message,
            loading: false,
          })
      })
    return () => controller.abort()
  }, [key, attempt])

  async function save(role: AccountProfileRole) {
    const { profile } = await profileApi.save(role)
    const familyProfile =
      role === "parent" ? (await profileApi.getFamily()).profile : null
    setState({ key, attempt, profile, familyProfile, error: "", loading: false })
  }

  async function saveFamily(input: FamilyProfileInput) {
    const { profile: familyProfile } = await profileApi.saveFamily(input)
    setState((previous) =>
      previous.key === key
        ? { ...previous, familyProfile, error: "", loading: false }
        : previous
    )
  }

  const current = state.key === key && state.attempt === attempt
  return (
    <Context.Provider
      value={{
        key,
        profile: current ? state.profile : null,
        familyProfile: current ? state.familyProfile : null,
        error: current ? state.error : "",
        loading: !!key && (!current || state.loading),
        retry: () => setAttempt((value) => value + 1),
        save,
        saveFamily,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useProfile() {
  const value = useContext(Context)
  if (!value) throw new Error("ProfileProvider required")
  return value
}
