import { useMessages } from "@/shared/i18n/use-messages"
import { Link, useLocation } from "react-router"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
  label = "Plataforma",
}: {
  label?: string
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { m } = useMessages()

  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{m(label)}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            render={<SidebarMenuItem />}
          >
            <SidebarMenuButton
              tooltip={m(item.title)}
              isActive={pathname === item.url}
              onClick={() => setOpenMobile(false)}
              render={
                item.url.startsWith("/") ? (
                  <Link to={item.url} />
                ) : (
                  <a href={item.url} target="_blank" rel="noreferrer" />
                )
              }
            >
              {item.icon}
              <span>{m(item.title)}</span>
            </SidebarMenuButton>
            {item.items?.length ? (
              <>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuAction className="aria-expanded:rotate-90" />
                  }
                >
                  <ChevronRightIcon />
                  <span className="sr-only">{m("Toggle")}</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={m(subItem.title)}>
                        <SidebarMenuSubButton
                          onClick={() => setOpenMobile(false)}
                          render={<Link to={subItem.url} />}
                          isActive={pathname === subItem.url}
                        >
                          <span>{m(subItem.title)}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
