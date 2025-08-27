import * as React from "react"

import {
  ClipboardCheck,
  FileSliders,
  User,
  Wallet,
  HardHat,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUserInfo } from "@/components/layout/nav-user-info"
import { NavUser } from "@/components/layout/nav-user"
import { UnitSwitcher } from "@/components/layout/unit-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from '@/hooks/use-auth'


const navMainData = [
  {
    title: "Técnico",
    url: "#",
    icon: HardHat,
    isActive: true,
    items: [
      { title: "Dashboard", url: "#" },
      { title: "Fluxograma", url: "#" },
      { title: "Mapas", url: "#" },
      { title: "Agenda", url: "#" },
    ],
  },
  {
    title: "Comercial",
    url: "#",
    icon: Wallet,
    items: [
      { title: "Dashboard", url: "#" },
      { title: "CRM", url: "#" },
      { title: "Livro de Registros", url: "#" },
      { title: "Cursos", url: "#" },
    ],
  },
  {
    title: "Administração",
    url: "#",
    icon: FileSliders,
    items: [
      { title: "Usuários", url: "#" },
      { title: "Unidades", url: "#" },
      { title: "Changelog", url: "#" },
    ],
  },
];

const userInfoData = [
  { name: "Tarefas", url: "#", icon: ClipboardCheck },
  { name: "Dados", url: "#", icon: User },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();

  const units =
    user?.unidades?.map(unit => ({
      name: unit.nome,
      logo: GalleryVerticalEnd, // ou algum outro ícone padrão; se o backend fornecer isso, adapte
      plan: "Plano padrão",       // ou outro plano (você pode incluir essa informação no payload também)
    })) || [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <UnitSwitcher units={units} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
        <NavUserInfo users={userInfoData} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{ nome: user.nome, email: user.email, avatar: user.fotoUrl }}
            onSignOut={signOut}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
