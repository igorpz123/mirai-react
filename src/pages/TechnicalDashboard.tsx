// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useUnit } from '@/contexts/UnitContext';
import { useUnitTasks } from '@/hooks/use-tasks-units';
import { Skeleton } from '@/components/ui/skeleton'
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

interface Task {
  id: number
  unidade: string
  empresa: string
  finalidade: string
  status: 'progress' | 'pendente' | string
  prazo: string
  responsavel: string
  prioridade: 'alta' | 'media' | 'baixa' | string
  setor: string
}

export default function TechnicalDashboard(): ReactElement {

  const { unitId } = useUnit();
  const { tasks, total, loading, error, refetchTasks } = useUnitTasks(unitId);
  
  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('pt-BR')

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'progress':
        return 'Em Andamento'
      case 'pendente':
        return 'Pendente'
      default:
        return status
    }
  }

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