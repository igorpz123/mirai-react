// src/components/layout/unit-switcher.tsx
import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Unit {
  id: number
  name: string
  logo: React.ElementType
  plan: string
}

interface UnitSwitcherProps {
  units: Unit[]
  unitId: number | null
  onUnitChange: (id: number) => void
}

export function UnitSwitcher({
  units,
  unitId,
  onUnitChange,
}: UnitSwitcherProps) {
  const { isMobile } = useSidebar()
  
  // Encontra a unidade ativa baseada no unitId do contexto
  const activeUnit = React.useMemo(() => {
    if (!unitId) return units[0] // Fallback para a primeira unidade
    return units.find(unit => unit.id === unitId) || units[0]
  }, [unitId, units])

  if (!activeUnit || units.length === 0) {
    return null
  }

  const handleUnitSelect = (unit: Unit) => {
    onUnitChange(unit.id)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeUnit.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeUnit.name}</span>
                <span className="truncate text-xs">{activeUnit.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Unidades
            </DropdownMenuLabel>
            {units.map((unit, index) => (
              <DropdownMenuItem
                key={unit.id}
                onClick={() => handleUnitSelect(unit)}
                className={`gap-2 p-2 ${
                  unit.id === unitId ? 'bg-sidebar-accent' : ''
                }`}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <unit.logo className="size-3.5 shrink-0" />
                </div>
                {unit.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}