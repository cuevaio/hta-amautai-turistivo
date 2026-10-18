import { useMessages } from "@/shared/i18n/use-messages"
import { useLocation } from "react-router"
import { PageLoading } from "@/shared/ui/page-loading"
export function RouteLoading() {
  const { m } = useMessages()

  const { pathname } = useLocation()
  if (["/", "/privacy", "/terms"].includes(pathname)) {
    return (
      <div
        role="status"
        className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground"
      >
        {m("Preparando Amautai…")}
      </div>
    )
  }
  const dashboard =
    pathname.startsWith("/dashboard") || pathname === "/callback"
  return (
    <PageLoading
      layout={dashboard ? "dashboard" : "auth"}
      message={
        dashboard ? m("Preparando tu espacio…") : m("Preparando tu acceso…")
      }
    />
  )
}
