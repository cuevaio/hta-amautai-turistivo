import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useProfile } from "../model/profile-provider"

export function FamilyGameGate({ children }: { children: ReactNode }) {
  const { profile } = useProfile()
  return profile?.role === "parent" ? children : <Navigate to="/panel" replace />
}
