// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react'
import { useUnit } from '@/contexts/UnitContext';
import { useUnitTasks } from '@/hooks/use-tasks-units';
import { useCompletedByUnit } from '@/hooks/use-tasks-completed-by-unit';
import type { ReactElement } from 'react'
import { ChartAreaInteractive } from "@/components/technical-chart-tasks"
import { TechnicalTaskTable } from "@/components/technical-task-table"
import { TechnicalDashboardCards } from "@/components/technical-dashboard-cards"
import { SiteHeader } from "@/components/layout/site-header"
import { getTaskStatsByUnit } from '@/services/tasks'
import { TechnicalLeaderboard } from '@/components/technical-leaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, TrendingUp } from 'lucide-react'
import { QuickIdSearch } from '@/components/quick-id-search'

export default function AdminTechnicalDashboard(): ReactElement {

  const { unitId } = useUnit();
  const { tasks, loading: _loading, error: _error, refetchTasks } = useUnitTasks(unitId);
  const { data: completedByDay, loading: _loadingCompleted } = useCompletedByUnit(unitId);

  const [stats, setStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [errorStats, setErrorStats] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      if (!unitId) {
        if (mounted) setStats(null)
        return
      }
      setLoadingStats(true)
      setErrorStats(null)
      try {
        const res = await getTaskStatsByUnit(unitId)
        if (!mounted) return
        setStats(res)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
        if (mounted) setErrorStats(msg)
      } finally {
        if (mounted) setLoadingStats(false)
      }
    }
    fetchStats()
    return () => { mounted = false }
  }, [unitId])

  return (
    <div className="container-main">
      <SiteHeader title='Dashboard | Técnico Administrativo' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex items-center justify-between">
              <h2 className="text-lg text-foreground font-semibold">Faça o gerenciamento das tarefas da unidade</h2>
              <QuickIdSearch kind="task" placeholder="Nº da tarefa" />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mx-6'>
              <TechnicalDashboardCards stats={stats} loading={loadingStats} error={errorStats} />
              <TechnicalLeaderboard maxUsers={10} />
            </div>
            
            {/* Tabs Section - Tasks & Chart */}
            <div className="px-4 lg:px-6">
              <Tabs defaultValue="tasks" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-[400px] grid-cols-2" data-tour="dashboard-nav">
                    <TabsTrigger value="tasks" className="gap-2" data-tour="tab-tasks">
                      <FileText className="h-4 w-4" />
                      Tarefas
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tasks.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="gap-2" data-tour="tab-chart">
                      <TrendingUp className="h-4 w-4" />
                      Gráfico
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="mt-0">
                  <Card className="shadow-md border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Tarefas da Unidade</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-sm font-semibold">
                          {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Gerencie e acompanhe as tarefas da unidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TechnicalTaskTable tasks={tasks} onRefresh={refetchTasks} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Chart Tab */}
                <TabsContent value="chart" className="mt-0">
                  <Card className="shadow-md border-2" data-tour="dashboard-charts">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Tarefas Concluídas</CardTitle>
                        </div>
                      </div>
                      <CardDescription>
                        Visualização das tarefas concluídas ao longo do tempo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartAreaInteractive data={completedByDay} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}