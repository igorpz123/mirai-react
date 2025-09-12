import * as React from "react"
import { useUnit } from '../../contexts/UnitContext';

import {
  ClipboardCheck,
  FileSliders,
  User,
  Wallet,
  HardHat,
  GalleryVerticalEnd,
  Calendar,
} from "lucide-react"

import { NavTechnical } from "@/components/layout/nav-technical"
import { NavComercial } from "./nav-comercial"
import { NavAdmin } from "./nav-admin"
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
import { getTasksByUnitId } from '@/services/tasks'
import { useEffect, useState } from 'react'

const navComercialData = [
  { title: "Dashboard", url: "/comercial/dashboard", icon: ClipboardCheck },
  {
    title: "CRM", url: "/crm", icon: Wallet, items: [
      { title: "Criar proposta", url: "comercial/crm/criar-proposta" },
    ]
  },
  { title: "Cursos", url: "/cursos", icon: Calendar },
  { title: "Livro de Registros", url: "/livro-de-registros", icon: FileSliders },
];

const navComercialDataOutside = [
  {
    title: "CRM", url: "/crm", icon: Wallet, items: [
      { title: "Visualizar", url: "comercial/crm/" },
      { title: "Criar proposta", url: "comercial/crm/criar-proposta" },
    ]
  },
  { title: "Cursos", url: "/cursos", icon: Calendar },
];

const navAdminData = [
  { title: "Dashboard", url: "/admin/dashboard", icon: ClipboardCheck },
  { title: "Usuários", url: "/admin/usuarios", icon: User },
  { title: "Unidades", url: "/admin/unidades", icon: GalleryVerticalEnd },
  { title: "Changelog", url: "/admin/changelog", icon: FileSliders },
]

const userInfoData = [
  { name: "Tarefas", url: "#", icon: ClipboardCheck },
  { name: "Dados", url: "#", icon: User },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const { unitId, setUnitId } = useUnit()

  const isAdmin = user?.cargoId === 1 || user?.cargoId === 2 || user?.cargoId === 3; // Ajuste conforme a lógica do seu sistema
  const isComercial = user?.cargoId === 1 || user?.cargoId === 2 || user?.cargoId === 13; // Ajuste conforme a lógica do seu sistema

  const fluxogramaItems = (user?.setores ?? []).map((setor: any) => ({
    title: setor.nome,
    // build a URL-friendly slug from the setor name
    url: `/technical/fluxograma/setor/${encodeURIComponent(
      (setor.nome || '')
        .toString()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    )}`,
  }));

  // pending counts by slug
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let mounted = true
    async function fetchCounts() {
      try {
        const uid = user?.unidades?.[0]?.id
        if (!uid) return
        const res = await getTasksByUnitId(uid)
        const all = res.tasks || []

        const normalize = (v: any) =>
          String(v || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const counts: Record<string, number> = {}
        all.forEach((t: any) => {
          const s = t.setor || t.setorNome || t.setor_nome || ''
          const slug = normalize(s)
          const status = (t.status || '').toString()
          const open = status === 'pendente' || status === 'progress' || status === 'pending' || status === 'open'
          if (!slug) return
          if (open) counts[slug] = (counts[slug] || 0) + 1
        })

        if (mounted) setPendingCounts(counts)
      } catch (err) {
        // ignore errors for sidebar counts
        console.debug('Erro ao buscar contagem de tarefas para sidebar', err)
      }
    }

    fetchCounts()
    return () => { mounted = false }
  }, [user])

  const NavTechnicalData = [
    {
      title: "Dashboard",
      url: "/technical/dashboard",
      icon: ClipboardCheck,
    },
    {
      title: "Agenda",
      url: "/technical/agenda",
      icon: Calendar,
    },
    {
      title: "Mapa",
      url: "/technical/mapa",
      icon: Calendar,
    },
    {
      title: "Fluxograma",
      url: "/technical/fluxograma",
      icon: HardHat,
      isActive: true,
      items: fluxogramaItems.length
        ? // attach badge counts when available
        fluxogramaItems.map((fi: any) => {
          const name = fi.title || ''
          // pendingCounts keys are normalized slugs
          const normalized = (name || '')
            .toString()
            .toLowerCase()
            .normalize('NFKD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
          const badge = pendingCounts[normalized]
          return { ...fi, badge }
        })
        : [
          { title: "Nenhum Setor Cadastrado", url: "#" },
        ],
    },
  ];

  const units =
    user?.unidades?.map(unit => ({
      id: unit.id,
      name: unit.nome,
      logo: GalleryVerticalEnd, // ou algum outro ícone padrão; se o backend fornecer isso, adapte
      plan: "Plano padrão",       // ou outro plano (você pode incluir essa informação no payload também)
    })) || [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <UnitSwitcher
          units={units}
          unitId={unitId}
          onUnitChange={setUnitId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavTechnical items={NavTechnicalData} />
        {isComercial ? (
          <NavComercial items={navComercialData} />
        ) : (
          <NavComercial items={navComercialDataOutside} />
        )}
        {isAdmin ? (
          <NavAdmin items={navAdminData} />
        ) : null}
        <NavUserInfo users={userInfoData} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{ nome: user.nome, email: user.email, avatar: user.fotoUrl, cargoId: user.cargoId, cargo: user.cargo }}
            onSignOut={signOut}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
