// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useUnit } from '@/contexts/UnitContext';
import { useUnitTasks } from '@/hooks/use-tasks-units';
import type { ReactElement } from 'react'
import { ChartAreaInteractive } from "@/components/technical-chart-tasks"
import { TechnicalTaskTable } from "@/components/technical-task-table"
import { TechnicalDashboardCards } from "@/components/technical-dashboard-cards"
import { SiteHeader } from "@/components/layout/site-header"

// Tipagem das métricas do dashboard
interface DashboardMetrics {
  tarefasAndamento: number
  tarefasPendentes: number
  tarefasAtrasadas: number
  tarefasConcluidas: number
}

export default function AdminDashboard(): ReactElement {

  const { unitId } = useUnit();
  const { tasks, loading, error, refetchTasks } = useUnitTasks(unitId);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
  //     </div>
  //   )
  // }

  return (
    <div className="w-full">
      <SiteHeader title='Dashboard | Setor Técnico' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TechnicalDashboardCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <TechnicalTaskTable tasks={tasks} onRefresh={refetchTasks} />
          </div>
        </div>
      </div>
    </div>
  )
}