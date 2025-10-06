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

  // Parse 'YYYY-MM-DD' (or ISO starting with it) as a LOCAL date to avoid timezone shifting months
  function parseLocalDate(value?: string | null): Date | null {
    if (!value) return null
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(value)
    if (m) {
      const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3])
      return new Date(y, mo, d)
    }
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  // Load user and tasks when uid changes
  useEffect(() => {
    let mounted = true
    async function fetchUserAndTasks() {
      setLoading(true)
      setError(null)
      try {
        if (!uid || Number.isNaN(uid)) {
          if (mounted) {
            setError('ID de usuário inválido')
            setUser(null)
            setTasks([])
          }
          return
        }
        // Resolve user (cache first)
        try {
          const { users: cached } = usersCtx.getFilteredUsersForTask({})
          const found = (cached || []).find(u => Number((u as any).id) === Number(uid))
          if (mounted) {
            if (found) setUser(found as any)
            else {
              const uResp = await getUserById(uid)
              const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
              if (mounted) setUser(actualUser || null)
            }
          }
        } catch {
          const uResp = await getUserById(uid)
          const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
          if (mounted) setUser(actualUser || null)
        }
        // Tasks
        const tResp = await getTasksByResponsavel(uid)
        if (mounted) setTasks(tResp.tasks || [])
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchUserAndTasks()
    return () => { mounted = false }
  }, [uid])

  // Load events when month or uid changes
  useEffect(() => {
    let mounted = true
    async function fetchEvents() {
      try {
        if (!uid || Number.isNaN(uid)) return
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
        const from = monthStart.toISOString().slice(0, 10)
        const to = monthEnd.toISOString().slice(0, 10)
        const evResp = await getEventsByResponsavel(uid, { from, to })
        if (mounted) setEvents(evResp.events || [])
      } catch (err) {
        if (mounted) setEvents([])
        console.debug('Erro ao buscar eventos da agenda:', err)
      }
    }
    fetchEvents()
    return () => { mounted = false }
  }, [uid, selectedMonth])

  // (removed monthsWithCounts - we now use input type=month and allow free navigation)

  // filter tasks by selectedMonth
  const tasksForMonth = useMemo(() => {
    const filtered = tasks.filter(t => {
      if (!t.prazo) return false
      const d = parseLocalDate(t.prazo as any)
      if (!d) return false
      return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth()
    })
    if (filtered.length === 0) {
      const sample = tasks.slice(0,3).map(t => t.prazo)
      console.debug('[AgendaUser] Nenhuma tarefa no mês filtrado', { selectedMonth: selectedMonth.toISOString(), samplePrazos: sample })
    }
    return filtered
  }, [tasks, selectedMonth])

  // allow navigation beyond current month; still compute currentMonth for informational purposes
  // no longer tracking currentMonth locally

  const goPrev = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goNext = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

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
              {/* <div className="flex items-center gap-2 text-sm">
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
              </div> */}

              {/* <div>
                <label htmlFor="month-select" className="sr-only">Selecionar mês</label>
                <input
                  id="month-select"
                  type="month"
                  value={`${selectedMonth.getFullYear().toString().padStart(4,'0')}-${(selectedMonth.getMonth()+1).toString().padStart(2,'0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number)
                    const next = new Date(y, m - 1, 1)
                    setSelectedMonth(prev => (prev.getFullYear() === next.getFullYear() && prev.getMonth() === next.getMonth()) ? prev : next)
                  }}
                  className="border-input rounded-md px-2 py-1 text-sm"
                />
              </div> */}

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
                <Button size="sm" className='button-primary' onClick={async () => {
                  // build title and filter tasks according to date range
                  const title = `Agenda ${user?.nome || usuarioId}`
                  const filtered = tasks.filter(t => {
                    if (!t.prazo) return false
                    const d = parseLocalDate(t.prazo as any)
                    if (!d) return false
                    if (fromDate) {
                      const f = parseLocalDate(fromDate)
                      if (f && d < f) return false
                    }
                    if (toDate) {
                      const tmax = parseLocalDate(toDate)
                      if (tmax && d > tmax) return false
                    }
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
                <TechnicalCalendar
                  events={events}
                  currentMonth={selectedMonth}
                  onMonthChange={async (d) => {
                    setSelectedMonth(prev => (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth()) ? prev : d)
                    try {
                      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
                      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
                      const from = monthStart.toISOString().slice(0, 10)
                      const to = monthEnd.toISOString().slice(0, 10)
                      const evResp = await getEventsByResponsavel(uid, { from, to })
                      setEvents(evResp.events || [])
                    } catch (err) {
                      console.debug('Erro ao buscar eventos da agenda (nav interna):', err)
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
