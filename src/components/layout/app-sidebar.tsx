import * as React from "react"
import { useUnit } from '../../contexts/UnitContext';

import {
  FileSliders,
  Wallet,
  HardHat,
  GalleryVerticalEnd,
  Calendar,
  Map,
  LayoutDashboard,
  Activity,
  SquarePen,
  CircleDollarSign,
  Search,
  // Sparkles,
} from "lucide-react"

import { NavTechnical } from "@/components/layout/nav-technical"
import { NavComercial } from "./nav-comercial"
import { NavAdmin } from "./nav-admin"
import { NavUser } from "@/components/layout/nav-user"
import { UnitSwitcher } from "@/components/layout/unit-switcher"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from '@/hooks/use-auth'
import { useGlobalSearch } from '@/contexts/GlobalSearchContext'
import { getTasksByUnitId } from '@/services/tasks'
import { useEffect, useState } from 'react'

//Página comercial para usuários internos (equipe comercial)
const navComercialData = [
  { title: "Dashboard", url: "/comercial/dashboard", icon: LayoutDashboard },
  {
    title: "CRM", url: "", icon: Wallet, items: [
      { title: "Criar proposta", url: "/comercial/proposta/nova" },
      { title: "Items", url: "/comercial/items" },
    ]
  },
  { title: "Livro de Registros", url: "/comercial/livro-de-registros", icon: FileSliders },
  { title: "Controle de Prática", url: "/comercial/controle-pratica", icon: Activity },
];

//Página comercial para usuários externos (fora da equipe comercial)
const navComercialDataOutside = [
  {
    title: "CRM", url: "/crm", icon: Wallet, items: [
      { title: "Visualizar", url: "/comercial/dashboard/" },
      { title: "Criar proposta", url: "/comercial/proposta/nova" },
    ]
  },
];

const navAdminData = [
  { title: "Dashboard Técnico", url: "/admin/dashboard-technical", icon: LayoutDashboard },
  { title: "Dashboard Comercial", url: "/admin/dashboard-commercial", icon: CircleDollarSign },
  { title: "Relatórios", url: "/admin/relatorios", icon: FileSliders },
  {
    title: "Gerenciar", url: "#", icon: HardHat, items: [
      { title: "Usuários", url: "/admin/usuarios" },
      { title: "Unidades", url: "/admin/unidades" },
      { title: "Setores", url: "/admin/setores" },
      { title: "Permissões", url: "/admin/permissoes" },
      { title: "Agenda", url: "/admin/agenda" },
      { title: "Empresas", url: "/empresas" },
      { title: "Auditoria", url: "/admin/auditoria" },
    ]
  },
  { title: "Changelog", url: "/changelog", icon: SquarePen },
  // { title: "Chat IA", url: "/ai/chat", icon: Sparkles },
]

const navAdminDataOutside = [
  { title: "Changelog", url: "/changelog", icon: SquarePen },
  // { title: "Chat IA", url: "/ai/chat", icon: Sparkles },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const { unitId, setUnitId } = useUnit()
  const { open: openSearch } = useGlobalSearch()
  const { state } = useSidebar()

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
        const uid = unitId || user?.unidades?.[0]?.id
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
          const status = (t.status || '').toString().toLowerCase()
          const open = ['pendente','progress','pending','open','andamento'].some(st => status.includes(st))
          if (!slug) return
          if (open) counts[slug] = (counts[slug] || 0) + 1
        })

        if (mounted) setPendingCounts(counts)
      } catch (err) {
        console.debug('Erro ao buscar contagem de tarefas para sidebar', err)
      }
    }
    fetchCounts()
    return () => { mounted = false }
  }, [user, unitId])

  const NavTechnicalData = [
    {
      title: "Dashboard",
      url: "/technical/dashboard",
      icon: LayoutDashboard,
      dataTour: "tasks-dashboard",
    },
    {
      title: "Agenda",
      url: "/technical/agenda",
      icon: Calendar,
    },
    {
      title: "Mapa",
      url: "/technical/mapa",
      icon: Map,
    },
    {
      title: "Fluxograma",
      url: "/technical/fluxograma",
      icon: HardHat,
      isActive: true,
      dataTour: "tasks-fluxograma",
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
    <Sidebar collapsible="icon" {...props} data-tour="sidebar">
      <SidebarHeader>
        <UnitSwitcher
          units={units}
          unitId={unitId}
          onUnitChange={setUnitId}
        />
        <div className="px-2 py-1">
          {state === "collapsed" ? (
            <Button
              variant="outline"
              size="icon"
              className="w-full h-9"
              onClick={openSearch}
              data-tour="search"
            >
              <Search className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-sm text-muted-foreground font-normal h-9"
              onClick={openSearch}
              data-tour="search"
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Buscar...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}
        </div>
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
        ) : <NavAdmin items={navAdminDataOutside} />}
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{ id: user.id, nome: user.nome, email: user.email, avatar: user.fotoUrl, cargoId: user.cargoId, cargo: user.cargo }}
            onSignOut={signOut}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
