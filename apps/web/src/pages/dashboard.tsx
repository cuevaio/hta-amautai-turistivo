import { Notifications } from "@/features/notifications"
import { WorkspaceSettings } from "@/features/settings"
import { NotFoundPage } from "@/pages/not-found"
import { Projects } from "@/features/projects"
import { MoonIcon, SunIcon } from "lucide-react"
import { motion } from "motion/react"
import { Link, useParams } from "react-router"
import { AppSidebar } from "@/app/ui/app-sidebar"
import { useTheme } from "@/shared/model/theme-provider"
import { Button } from "@workspace/ui/components/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

const sections: Record<string, string> = {
  overview: "Inicio",
  projects: "Proyectos",
  settings: "Configuración",
  notifications: "Notificaciones",
  account: "Mi cuenta",
}

export function DashboardPage() {
  const { section = "overview" } = useParams()
  const title = sections[section] ?? "Página no encontrada"
  const { theme, setTheme } = useTheme()
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link to="/dashboard" />}>
                    Amautai
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </header>
        <motion.div
          key={section}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col gap-4 p-4 pt-0"
        >
          {section === "notifications" ? (
            <Notifications />
          ) : section === "settings" ? (
            <WorkspaceSettings />
          ) : section === "account" ? (
            <WorkspaceSettings account />
          ) : section === "overview" || section === "projects" ? (
            <Projects />
          ) : (
            <NotFoundPage />
          )}
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  )
}
