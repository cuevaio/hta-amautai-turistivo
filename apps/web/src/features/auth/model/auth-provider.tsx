import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User, Tenant, Session } from "@amautai/contracts"
import { authApi } from "../api/auth-api"
type Auth = {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  error: string
  reloadSession: () => Promise<boolean>
  signOut: () => Promise<void>
}
const Context = createContext<Auth | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState("")
  async function reloadSession() {
    try {
      const data = await authApi.session()
      setSession(data)
      setError("")
      return data !== null
    } catch {
      setError("No pudimos comprobar tu sesión. Intenta recargar.")
      return false
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const controller = new AbortController()
    authApi
      .session(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSession(data)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("No pudimos comprobar tu sesión. Intenta recargar.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])
  async function signOut() {
    await authApi.logout()
    setSession(null)
    window.location.replace("/login")
  }
  return (
    <Context.Provider
      value={{
        user: session?.user ?? null,
        tenant: session?.tenant ?? null,
        isLoading,
        error,
        reloadSession,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error("AuthProvider required")
  return value
}
