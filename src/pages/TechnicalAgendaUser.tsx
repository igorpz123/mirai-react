import { useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { useEffect, useMemo, useState } from 'react'
import { getUserById } from '@/services/users'
import { useUsers } from '@/contexts/UsersContext'
import { getTasksByResponsavel, type Task } from '@/services/tasks'
import { exportTasksToPdf } from '@/services/export'
import { getEventsByResponsavel } from '@/services/agenda'
import TechnicalCalendar from '@/components/technical-calendar'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

export default function TechnicalAgendaUser() {
  const { usuarioId } = useParams()
  const uid = usuarioId ? Number(usuarioId) : NaN

  const [user, setUser] = useState<any | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
    const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const usersCtx = useUsers()

  // selected month (Date) - defaults to current month
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [fromDate, setFromDate] = useState<string | undefined>(undefined)
  const [toDate, setToDate] = useState<string | undefined>(undefined)

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

  // try resolve user from UsersContext cache first
  try {
    const { users: cached } = usersCtx.getFilteredUsersForTask({})
    const found = (cached || []).find(u => Number((u as any).id) === Number(uid))
    if (found) {
      setUser(found as any)
    } else {
      const uResp = await getUserById(uid)
      if (!mounted) return
      // backend returns the user object directly (not { user }), so handle both cases
      const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
      setUser(actualUser || null)
    }
  } catch (e) {
    // fallback to network call
    const uResp = await getUserById(uid)
    if (!mounted) return
    const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
    setUser(actualUser || null)
  }

        const tResp = await getTasksByResponsavel(uid)
        if (!mounted) return
        setTasks(tResp.tasks || [])

        try {
          // fetch events for the visible month range
          const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
          const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
          const from = monthStart.toISOString().slice(0, 10)
          const to = monthEnd.toISOString().slice(0, 10)
          const evResp = await getEventsByResponsavel(uid, { from, to })
          if (!mounted) return
          setEvents(evResp.events || [])
        } catch (err) {
          console.debug('Erro ao buscar eventos da agenda:', err)
        }
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
  }, [uid, selectedMonth])

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
    <div className="container-main">
      <SiteHeader title={user?.nome ? `Agenda | ${user.nome}` : `Agenda | Usuário ${usuarioId}`} />

      <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
        {loading ? (
          <div>Carregando agenda do usuário...</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Button variant="ghost" size="icon" onClick={goPrev} aria-label="Mês anterior">
                  <IconChevronLeft />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="text-base font-medium">{selectedMonth.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}</div>
                  <Badge variant="secondary" className="text-xs">{tasksForMonth.length} tarefas</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={goNext} aria-label="Próximo mês">
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

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate || ''}
                  onChange={(e) => setFromDate(e.target.value || undefined)}
                  className="border-input rounded-md px-2 py-1 text-sm"
                  aria-label="De"
                />
                <input
                  type="date"
                  value={toDate || ''}
                  onChange={(e) => setToDate(e.target.value || undefined)}
                  className="border-input rounded-md px-2 py-1 text-sm"
                  aria-label="Até"
                />
                <Button size="sm" onClick={async () => {
                  // build title and filter tasks according to date range
                  const title = `Agenda ${user?.nome || usuarioId}`
                  const filtered = tasks.filter(t => {
                    if (!t.prazo) return false
                    const d = new Date(t.prazo)
                    if (isNaN(d.getTime())) return false
                    if (fromDate && new Date(d) < new Date(fromDate)) return false
                    if (toDate && new Date(d) > new Date(toDate)) return false
                    return true
                  })
                  try {
                    const blob = await exportTasksToPdf(filtered, { title, from: fromDate, to: toDate })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `agenda-${user?.nome || usuarioId}-${fromDate || 'all'}-${toDate || 'all'}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch (err) {
                    console.error('Erro ao exportar PDF', err)
                    alert('Falha ao gerar PDF')
                  }
                }}>Exportar</Button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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

              <div>
                <TechnicalCalendar events={events} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
