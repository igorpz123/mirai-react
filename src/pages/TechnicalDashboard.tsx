import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useUserTasks } from '@/hooks/use-tasks-user'
import { useCompletedByUser } from '@/hooks/use-tasks-completed-by-user'
import type { ReactElement } from 'react'
import { ChartAreaInteractive } from "@/components/technical-chart-tasks"
import { TechnicalTaskTable } from "@/components/technical-task-table"
import { TechnicalDashboardCards } from "@/components/technical-dashboard-cards"
import { SiteHeader } from "@/components/layout/site-header"
import { getTaskStatsByUser } from '@/services/tasks'
import { QuickIdSearch } from '@/components/quick-id-search'

export default function TechnicalDashboard(): ReactElement {

  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { tasks, loading: _loading, error: _error, refetchTasks } = useUserTasks(userId);
  const { data: completedByDay, loading: _loadingCompleted } = useCompletedByUser(userId);

  const [stats, setStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [errorStats, setErrorStats] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      if (!userId) {
        if (mounted) setStats(null)
        return
      }
      setLoadingStats(true)
      setErrorStats(null)
      try {
        const res = await getTaskStatsByUser(userId)
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
  }, [userId])

  return (
    <div className="w-full">
      <SiteHeader title='Meu Dashboard' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex items-center justify-end">
              <QuickIdSearch kind="task" placeholder="Nº da tarefa" />
            </div>
            <TechnicalDashboardCards stats={stats} loading={loadingStats} error={errorStats} />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive data={completedByDay} />
            </div>
            <TechnicalTaskTable tasks={tasks} onRefresh={refetchTasks} />
          </div>
        </div>
      </div>
    </div>
  )
}
