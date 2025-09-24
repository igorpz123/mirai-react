import React from 'react'
import { useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { getTasksByUnitId, getAllTasks } from '@/services/tasks'
import type { Task } from '@/services/tasks'
import { useUnit } from '@/contexts/UnitContext'

export default function TechnicalFluxogramaSetor() {
  const { setorSlug } = useParams()
  const { unitId } = useUnit()
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetch = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (unitId && Number(unitId) > 0) {
        res = await getTasksByUnitId(Number(unitId))
      } else {
        res = await getAllTasks()
      }

      const all: Task[] = res.tasks || []
      const slug = String(setorSlug || '').toLowerCase()

      const normalize = (v: any) =>
        String(v || '')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

      const sid = Number(setorSlug)
      const filtered = all.filter((t: any) => {
        // prefer explicit setorId on the task when slug is numeric
        if (!Number.isNaN(sid) && typeof t.setorId !== 'undefined' && t.setorId !== null) {
          if (Number(t.setorId) === sid) return true
        }

        // try matching normalized setor name
        const taskNormalized = normalize(t.setor || t.setorNome || t.setor_nome || '')
        return taskNormalized === normalize(slug)
      })

      setTasks(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [setorSlug, unitId])

  React.useEffect(() => {
    fetch()
  }, [fetch])

  return (
    <div className="container-main">
      <SiteHeader title={`Fluxograma | Setor ${setorSlug}`} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {loading ? (
              <div>Carregando tarefas do setor...</div>
            ) : error ? (
              <div className="text-destructive">{error}</div>
            ) : (
              <TechnicalTaskTable tasks={tasks} onRefresh={fetch} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
