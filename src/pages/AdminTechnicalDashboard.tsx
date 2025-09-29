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
      <SiteHeader title='Dashboard | Administrativo' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <TechnicalDashboardCards stats={stats} loading={loadingStats} error={errorStats} />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive data={completedByDay} />
            </div>
            <div className="px-4 lg:px-6 overflow-x-auto">
              <TechnicalTaskTable tasks={tasks} onRefresh={refetchTasks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}