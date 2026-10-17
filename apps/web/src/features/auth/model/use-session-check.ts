import { useAuth } from "../model/auth-provider"
export function useSessionCheck() {
  const { user, isLoading, error } = useAuth()
  return error ? "error" : isLoading ? "checking" : user ? "verified" : "error"
}
