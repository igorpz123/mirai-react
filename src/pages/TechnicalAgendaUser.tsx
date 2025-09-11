import { useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { useEffect, useMemo, useState } from 'react'
import { getUserById } from '@/services/users'
import { getTasksByResponsavel, type Task } from '@/services/tasks'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

export default function TechnicalAgendaUser() {
  const { usuarioId } = useParams()
  const uid = usuarioId ? Number(usuarioId) : NaN

  const [user, setUser] = useState<any | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // selected month (Date) - defaults to current month
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  useEffect(() => {
    let mounted = true
    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        if (!uid || Number.isNaN(uid)) {
          setError('ID de usuário inválido')
          setUser(null)
          setTasks([])
          return
        }

  const uResp = await getUserById(uid)
  if (!mounted) return
  // backend returns the user object directly (not { user }), so handle both cases
  const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
  setUser(actualUser || null)

        const tResp = await getTasksByResponsavel(uid)
        if (!mounted) return
        setTasks(tResp.tasks || [])
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [uid])

  // (removed monthsWithCounts - we now use input type=month and allow free navigation)

  // filter tasks by selectedMonth
  const tasksForMonth = useMemo(() => {
    return tasks.filter(t => {
      if (!t.prazo) return false
      const d = new Date(t.prazo)
      if (isNaN(d.getTime())) return false
      return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth()
    })
  }, [tasks, selectedMonth])

  // allow navigation beyond current month; still compute currentMonth for informational purposes
  // no longer tracking currentMonth locally

  const goPrev = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const goNext = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <div className="w-full">
      <SiteHeader title={user?.nome ? `Agenda | ${user.nome}` : `Agenda | Usuário ${usuarioId}`} />

      <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
        {loading ? (
          <div>Carregando agenda do usuário...</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={goPrev} aria-label="Mês anterior">
                  <IconChevronLeft />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                  <Badge variant="secondary">{tasksForMonth.length} tarefas</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={goNext} aria-label="Próximo mês">
                  <IconChevronRight />
                </Button>
              </div>

              <div>
                <label htmlFor="month-select" className="sr-only">Selecionar mês</label>
                <input
                  id="month-select"
                  type="month"
                  value={`${selectedMonth.getFullYear().toString().padStart(4,'0')}-${(selectedMonth.getMonth()+1).toString().padStart(2,'0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number)
                    setSelectedMonth(new Date(y, m - 1, 1))
                  }}
                  className="border-input rounded-md px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div>
              <TechnicalTaskTable tasks={tasksForMonth} onRefresh={async () => {
                // refetch tasks
                try {
                  setLoading(true)
                  const tResp = await getTasksByResponsavel(uid)
                  setTasks(tResp.tasks || [])
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err))
                } finally {
                  setLoading(false)
                }
              }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
