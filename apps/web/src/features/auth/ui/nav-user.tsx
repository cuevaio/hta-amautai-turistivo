import { useState } from "react"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { useAuth } from "../model/auth-provider"
import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function logout() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await signOut()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <SidebarMenu>
      {error && (
        <SidebarMenuItem>
          <p role="alert" className="px-2 text-sm text-destructive">
            {error}
          </p>
          <Button variant="link" disabled={busy} onClick={() => void logout()}>
            Reintentar cierre
          </Button>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuItem render={<Link to="/dashboard/account" />}>
                <UserIcon />
                Mi cuenta
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => void logout()}>
                <LogOutIcon />
                {busy ? "Cerrando sesión…" : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
