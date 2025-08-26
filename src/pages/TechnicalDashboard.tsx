// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { TechnicalDashboardCards } from "@/components/technical-dashboard-cards"
import { SiteHeader } from "@/components/layout/site-header"
import data from "./data.json"

// // Tipagem das métricas do dashboard
// interface DashboardMetrics {
//   tarefasAndamento: number
//   tarefasPendentes: number
//   tarefasAtrasadas: number
//   comissao: number
// }

// // Tipagem de cada tarefa recomendada
// interface RecommendedTask {
//   id: number
//   empresa_nome: string
//   setor_nome: string
//   prazo: string
//   status: 'progress' | 'pendente' | string
// }

export default function TechnicalDashboard(): ReactElement {
  // const { user } = useAuth()
  // const [metrics, setMetrics] = useState<DashboardMetrics>({
  //   tarefasAndamento: 0,
  //   tarefasPendentes: 0,
  //   tarefasAtrasadas: 0,
  //   comissao: 0
  // })
  // const [recommendedTasks, setRecommendedTasks] = useState<RecommendedTask[]>([])
  // const [loading, setLoading] = useState<boolean>(true)

  // useEffect(() => {
  //   const fetchDashboardData = async (): Promise<void> => {
  //     try {
  //       setLoading(true)
  //       const metricsData = await dashboardAPI.getMetrics()
  //       setMetrics(metricsData)
  //       const tasksData = await dashboardAPI.getRecommendedTasks()
  //       setRecommendedTasks(tasksData)
  //     } catch (error) {
  //       console.error('Erro ao carregar dados do dashboard:', error)
  //       // Fallback em caso de erro
  //       setMetrics({
  //         tarefasAndamento: 5,
  //         tarefasPendentes: 12,
  //         tarefasAtrasadas: 3,
  //         comissao: 2450.75
  //       })
  //       setRecommendedTasks([
  //         {
  //           id: 1,
  //           empresa_nome: 'Empresa ABC',
  //           setor_nome: 'Vendas',
  //           prazo: '2024-01-15',
  //           status: 'progress'
  //         },
  //         {
  //           id: 2,
  //           empresa_nome: 'Empresa XYZ',
  //           setor_nome: 'Marketing',
  //           prazo: '2024-01-20',
  //           status: 'pendente'
  //         }
  //       ])
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchDashboardData()
  // }, [])

  // const formatCurrency = (value: number): string =>
  //   new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL'
  //   }).format(value)

  // const formatDate = (dateString: string): string =>
  //   new Date(dateString).toLocaleDateString('pt-BR')

  // const getStatusText = (status: string): string => {
  //   switch (status) {
  //     case 'progress':
  //       return 'Em Andamento'
  //     case 'pendente':
  //       return 'Pendente'
  //     default:
  //       return status
  //   }
  // }

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
              <DataTable data={data} />
            </div>
          </div>
        </div>
    </div>
  )
}