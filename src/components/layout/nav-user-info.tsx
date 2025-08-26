import {
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUserInfo({
  users,
}: {
  users: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Meu Usuário</SidebarGroupLabel>
      <SidebarMenu>
        {users.map((user) => (
          <SidebarMenuItem key={user.name}>
            <SidebarMenuButton asChild>
              <a href={user.url}>
                <user.icon />
                <span>{user.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
