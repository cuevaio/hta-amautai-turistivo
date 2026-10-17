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

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, user, error } = useAuth()
  if (isLoading)
    return <PageLoading layout="dashboard" message="Comprobando tu sesión…" />
  if (error)
    return (
      <main className="flex min-h-svh items-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No pudimos comprobar tu sesión</EmptyTitle>
            <EmptyDescription role="alert">{error}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  if (!user) return <Navigate to="/login" replace />
  return children
}
