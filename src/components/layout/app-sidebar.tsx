import * as React from "react"
import {
  AudioWaveform,
  ClipboardCheck,
  FileSliders,
  Command,
  GalleryVerticalEnd,
  User,
  Wallet,
  HardHat,
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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  unidades: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Técnico",
      url: "#",
      icon: HardHat,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "#",
        },
        {
          title: "Fluxograma",
          url: "#",
        },
        {
          title: "Mapas",
          url: "#",
        },
        {
          title: "Agenda",
          url: "#",
        },
      ],
    },
    {
      title: "Comercial",
      url: "#",
      icon: Wallet,
      items: [
        {
          title: "Dashboard",
          url: "#",
        },
        {
          title: "CRM",
          url: "#",
        },
        {
          title: "Livro de Registros",
          url: "#",
        },
        {
          title: "Cursos",
          url: "#",
        },
      ],
    },
    {
      title: "Administração",
      url: "#",
      icon: FileSliders,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  userInfo: [
    {
      name: "Tarefas",
      url: "#",
      icon: ClipboardCheck,
    },
    {
      name: "Dados",
      url: "#",
      icon: User,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <UnitSwitcher units={data.unidades} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavUserInfo users={data.userInfo} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
