import { useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { useEffect, useMemo, useState } from 'react'
import { useUnit } from '@/contexts/UnitContext'
import { getUserById } from '@/services/users'
import { useUsers } from '@/contexts/UsersContext'
import { getTasksByResponsavel, type Task } from '@/services/tasks'
import { exportTasksToPdf } from '@/services/export'
import { getEventsByResponsavel } from '@/services/agenda'
import TechnicalCalendar from '@/components/technical-calendar'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CreateEventDialog from '@/components/agenda/create-event-dialog'
import { Download, Loader2, User, FileText, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TechnicalAgendaUser() {
  const { usuarioId } = useParams()
  const uid = usuarioId ? Number(usuarioId) : NaN

  const [user, setUser] = useState<any | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
    const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const usersCtx = useUsers()
  const { unitId, isLoading: unitLoading } = useUnit()

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

  // Cache simples por mês (YYYY-MM) para evitar refetch ao navegar rapidamente
  const eventsCacheRef = useMemo(() => ({ map: new Map<string, any[]>() }), [])
  useEffect(() => {
    let mounted = true
    async function fetchEvents() {
      try {
        if (!uid || Number.isNaN(uid)) return
        const key = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth()+1).padStart(2,'0')}`
        if (eventsCacheRef.map.has(key)) {
          if (mounted) setEvents(eventsCacheRef.map.get(key) || [])
          return
        }
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
        const from = monthStart.toISOString().slice(0, 10)
        const to = monthEnd.toISOString().slice(0, 10)
        const evResp = await getEventsByResponsavel(uid, { from, to })
        const list = evResp.events || []
        eventsCacheRef.map.set(key, list)
        if (mounted) setEvents(list)
      } catch (err) {
        if (mounted) setEvents([])
        console.debug('Erro ao buscar eventos da agenda:', err)
      }
    }
    fetchEvents()
    return () => { mounted = false }
  }, [uid, selectedMonth, eventsCacheRef])

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

  // Prefetch baseado apenas na unidade global (UnitContext)
  useEffect(() => {
    if (unitLoading) return
    ;(async () => {
      try {
        await usersCtx.ensureUsersForUnit(unitId ?? null)
      } catch (e) {
        console.debug('[AgendaUser] Falha ao garantir usuários para unit context', unitId, e)
      }
    })()
  }, [unitId, unitLoading, usersCtx])

  // Fallback: se após carregar a unidade ainda não há unitId válido, garante cache 'all'
  useEffect(() => {
    if (unitLoading) return
    if (unitId == null) {
      (async () => {
        try {
          await usersCtx.ensureUsersForUnit(null)
        } catch (e) {
          console.debug('[AgendaUser] Falha ao garantir usuários (fallback all)', e)
        }
      })()
    }
  }, [unitId, unitLoading, usersCtx])

  // (Create Event dialog moved to a memoized component to avoid heavy page re-renders while typing)

  // Get user initials for avatar
  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Stats calculation
  const stats = useMemo(() => {
    const total = tasksForMonth.length
    const pendentes = tasksForMonth.filter(t => t.status?.toLowerCase().includes('pendent')).length
    const emAndamento = tasksForMonth.filter(t => t.status?.toLowerCase().includes('andamento') || t.status?.toLowerCase().includes('progress')).length
    const concluidas = tasksForMonth.filter(t => t.status?.toLowerCase().includes('concluí')).length
    return { total, pendentes, emAndamento, concluidas }
  }, [tasksForMonth])
  
  return (
    <div className="container-main">
      <SiteHeader title={`Agenda | ${user?.nome || `Usuário ${usuarioId}`}`} />

      <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando agenda do usuário...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* User Profile Card */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                      <AvatarImage src={user?.foto_url || user?.fotoUrl} alt={user?.nome} />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10">
                        {getUserInitials(user?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{user?.nome || 'Usuário'}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        {user?.cargo?.nome || user?.cargo || 'Sem cargo definido'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendentes}</div>
                      <div className="text-xs text-muted-foreground">Pendentes</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.emAndamento}</div>
                      <div className="text-xs text-muted-foreground">Em Andamento</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.concluidas}</div>
                      <div className="text-xs text-muted-foreground">Concluídas</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Mobile Stats */}
            <div className="grid grid-cols-4 gap-3 md:hidden">
              <div className="text-center px-3 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Total</div>
              </div>
              <div className="text-center px-3 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendentes}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Pendentes</div>
              </div>
              <div className="text-center px-3 py-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.emAndamento}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Andamento</div>
              </div>
              <div className="text-center px-3 py-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.concluidas}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Concluídas</div>
              </div>
            </div>

            {/* Actions Bar */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Date Range Filters */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">Período:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="date"
                          value={fromDate || ''}
                          onChange={(e) => setFromDate(e.target.value || undefined)}
                          className="border border-input bg-background rounded-md px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                          aria-label="De"
                          placeholder="De"
                        />
                      </div>
                      <span className="text-muted-foreground">até</span>
                      <div className="relative">
                        <input
                          type="date"
                          value={toDate || ''}
                          onChange={(e) => setToDate(e.target.value || undefined)}
                          className="border border-input bg-background rounded-md px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                          aria-label="Até"
                          placeholder="Até"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 shadow-sm hover:shadow transition-shadow" 
                      onClick={async () => {
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
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                    
                    <CreateEventDialog
                      usuarioId={uid}
                      triggerClassName='gap-2 shadow-sm hover:shadow transition-shadow'
                      onCreated={async () => {
                        const key = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth()+1).padStart(2,'0')}`
                        eventsCacheRef.map.delete(key)
                        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
                        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
                        const from = monthStart.toISOString().slice(0, 10)
                        const to = monthEnd.toISOString().slice(0, 10)
                        const evResp = await getEventsByResponsavel(uid, { from, to })
                        setEvents(evResp.events || [])
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Separator />

            {/* Tabs Section with Month Navigator */}
            <Tabs defaultValue="tasks" className="w-full">
              <div className="flex items-center justify-between mb-4 gap-4">
                {/* Tabs List */}
                <TabsList className="grid w-[400px] grid-cols-2">
                  <TabsTrigger value="tasks" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Tarefas
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tasksForMonth.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Calendário
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {events.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Month Navigator */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
                      setSelectedMonth(prevMonth)
                    }}
                    className="h-8 w-8 p-0 hover:bg-primary/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <div className="text-center min-w-[120px]">
                      <div className="text-sm font-bold text-primary capitalize">
                        {selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <input
                        type="month"
                        value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split('-').map(Number)
                          const newMonth = new Date(year, month - 1, 1)
                          setSelectedMonth(newMonth)
                        }}
                        className="border border-input bg-background rounded-md px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow cursor-pointer"
                        aria-label="Selecionar mês"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
                      setSelectedMonth(nextMonth)
                    }}
                    className="h-8 w-8 p-0 hover:bg-primary/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-0">
                <Card className="shadow-md border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Tarefas do Período</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-sm font-semibold">
                        {tasksForMonth.length} {tasksForMonth.length === 1 ? 'tarefa' : 'tarefas'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Tarefas filtradas para o período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TechnicalTaskTable 
                      tasks={tasksForMonth} 
                      onRefresh={async () => {
                        try {
                          setLoading(true)
                          const tResp = await getTasksByResponsavel(uid)
                          setTasks(tResp.tasks || [])
                        } catch (err) {
                          setError(err instanceof Error ? err.message : String(err))
                        } finally {
                          setLoading(false)
                        }
                      }} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="mt-0">
                <Card className="shadow-md border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Calendário de Eventos</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-sm font-semibold">
                        {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Visualização mensal de eventos agendados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TechnicalCalendar
                      events={events}
                      currentMonth={selectedMonth}
                      onMonthChange={(d) => {
                        setSelectedMonth(prev => (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth()) ? prev : d)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
