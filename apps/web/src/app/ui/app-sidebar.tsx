import { useMessages } from "@/shared/i18n/use-messages"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { useProfile } from "@/features/profiles"
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
    title: "Salas de juego",
    url: "/panel/salas",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Notificaciones",
    url: "/panel/notificaciones",
    icon: <BellIcon />,
  },
  { title: "Mi cuenta", url: "/panel/cuenta", icon: <UserIcon /> },
  {
    title: "Configuración",
    url: "/panel/configuracion",
    icon: <SettingsIcon />,
  },
]
const familyNav = [
  { title: "Mis juegos", url: "/panel", icon: <LayoutDashboardIcon /> },
  { title: "Mi cuenta", url: "/panel/cuenta", icon: <UserIcon /> },
  {
    title: "Configuración",
    url: "/panel/configuracion",
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
  const { m } = useMessages()
  const { user } = useAuth()
  const { profile } = useProfile()
  return (
    <Sidebar
      variant="inset"
      mobileTitle={m("Navegación")}
      mobileDescription={m("Menú de navegación")}
      closeLabel={m("Cerrar")}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              aria-label={m("Amautai")}
              render={<Link to="/panel" />}
            >
              <BrandLogo className="group-data-[collapsible=icon]:hidden" />
              <img
                src="/brand/amautai-icon.svg"
                alt=""
                width={32}
                height={32}
                className="hidden size-8 shrink-0 group-data-[collapsible=icon]:block"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={profile?.role === "parent" ? familyNav : navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name:
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              m("Mi cuenta"),
            email: user?.email || "",
            avatar: user?.profilePictureUrl || "/avatar.svg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
