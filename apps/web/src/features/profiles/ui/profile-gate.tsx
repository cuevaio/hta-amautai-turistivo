import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useMessages } from "@/shared/i18n/use-messages"
import { Button } from "@workspace/ui/components/button"
import { PageLoading } from "@/shared/ui/page-loading"
import { useProfile } from "../model/profile-provider"

export function ProfileGate({
  children,
  selection = false,
  familyOnboarding = false,
  loadingLayout = "dashboard",
}: {
  children: ReactNode
  selection?: boolean
  familyOnboarding?: boolean
  loadingLayout?: "auth" | "dashboard"
}) {
  const { m } = useMessages()
  const { profile, familyProfile, loading, error, retry } = useProfile()
  if (loading)
    return (
      <PageLoading layout={loadingLayout} message={m("Cargando tu perfil…")} />
    )
  if (error)
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">
          {m("No pudimos cargar tu perfil")}
        </h1>
        <p role="alert">{m("Inténtalo de nuevo en unos momentos.")}</p>
        <Button onClick={retry}>{m("Reintentar")}</Button>
      </main>
    )
  if (selection && profile) return <Navigate to="/panel" replace />
  if (familyOnboarding) {
    if (!profile) return <Navigate to="/registro/perfil" replace />
    if (profile.role !== "parent") return <Navigate to="/panel" replace />
    if (familyProfile) return <Navigate to="/panel" replace />
    return children
  }
  if (!selection && !profile) return <Navigate to="/registro/perfil" replace />
  if (profile?.role === "parent" && !familyProfile)
    return <Navigate to="/registro/familia" replace />
  return children
}
