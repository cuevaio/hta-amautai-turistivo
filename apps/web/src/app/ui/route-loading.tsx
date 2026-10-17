import { useLocation } from "react-router"
import { PageLoading } from "@/shared/ui/page-loading"
export function RouteLoading() {
  const { pathname } = useLocation()
  const dashboard =
    pathname.startsWith("/dashboard") || pathname === "/callback"
  return (
    <PageLoading
      layout={dashboard ? "dashboard" : "auth"}
      message={dashboard ? "Preparando tu espacio…" : "Preparando tu acceso…"}
    />
  )
}
