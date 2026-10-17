import { useAuth } from "@/features/auth"
import type { ComponentProps } from "react"
import {
  LayoutDashboardIcon,
  BellIcon,
  SettingsIcon,
  UserIcon,
  ExternalLinkIcon,
} from "lucide-react"
import { Link } from "react-router"
import { NavMain } from "@/app/ui/nav-main"
import { NavSecondary } from "@/app/ui/nav-secondary"
import { NavUser } from "@/features/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

const navMain = [
  {
    title: "Inicio",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [
      { title: "Vista general", url: "/dashboard" },
      { title: "Proyectos", url: "/dashboard/projects" },
    ],
  },
  {
    title: "Notificaciones",
    url: "/dashboard/notifications",
    icon: <BellIcon />,
  },
  { title: "Mi cuenta", url: "/dashboard/account", icon: <UserIcon /> },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: <SettingsIcon />,
  },
]
const navSecondary = [
  {
    title: "Hack the Andes",
    url: "https://hacktheandes.com/",
    icon: <ExternalLinkIcon />,
  },
]

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <img src="/favicon.svg" alt="" className="size-8" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Amautai</span>
                <span className="truncate text-xs">Hack the Andes</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name:
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              "Mi cuenta",
            email: user?.email || "",
            avatar: user?.profilePictureUrl || "/avatar.svg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
