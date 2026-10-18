import { useMessages } from "@/shared/i18n/use-messages"
import { PageLoading } from "@/shared/ui/page-loading"
import type { ReactNode } from "react"
import { useAuth } from "../model/auth-provider"
import { Navigate } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"

export function AuthGuard({
  children,
  loadingLayout = "dashboard",
}: {
  children: ReactNode
  loadingLayout?: "auth" | "dashboard"
}) {
  const { m, errorMessage } = useMessages()

  const { isLoading, user, error, reloadSession } = useAuth()
  if (isLoading)
    return (
      <PageLoading layout={loadingLayout} message="Comprobando tu sesión…" />
    )
  if (error)
    return (
      <main className="flex min-h-svh items-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{m("No pudimos comprobar tu sesión")}</EmptyTitle>
            <EmptyDescription role="alert">
              {errorMessage(error)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void reloadSession()} disabled={isLoading}>
              {m("Reintentar")}
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  if (!user) return <Navigate to="/iniciar-sesion" replace />
  return children
}
