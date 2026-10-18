import { useMessages } from "@/shared/i18n/use-messages"
import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useEducation } from "../model/education-provider"
import { PageLoading } from "@/shared/ui/page-loading"
import { Button } from "@workspace/ui/components/button"
import { useProfile } from "@/features/profiles"
export function EducationGate({
  children,
  onboarding = false,
  loadingLayout = "dashboard",
}: {
  children: ReactNode
  onboarding?: boolean
  loadingLayout?: "auth" | "dashboard"
}) {
  const { m, errorMessage } = useMessages()

  const { profile, loading, error, retry } = useEducation()
  const { profile: accountProfile } = useProfile()
  if (accountProfile?.role === "parent")
    return onboarding ? <Navigate to="/panel" replace /> : children
  if (loading)
    return (
      <PageLoading
        layout={loadingLayout}
        message="Cargando tu perfil docente…"
      />
    )
  if (error)
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">
          {m("No pudimos cargar tu perfil")}
        </h1>
        <p role="alert">{errorMessage(error)}</p>
        <Button onClick={retry}>{m("Reintentar")}</Button>
      </main>
    )
  if (!profile && !onboarding)
    return <Navigate to="/registro/docente" replace />
  if (profile && onboarding) return <Navigate to="/panel" replace />
  return children
}
