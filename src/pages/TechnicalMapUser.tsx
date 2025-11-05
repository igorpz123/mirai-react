import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { useEffect, useState } from 'react'
import { getUserById } from '@/services/users'
import { useUsers } from '@/contexts/UsersContext'
import { getCompaniesByResponsible, type Company } from '@/services/companies'
import { getTasksByCompany, getAllTasks, type Task as TaskItem } from '@/services/tasks'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { IconCircleCheckFilled, IconProgress, IconLoader, IconDotsVertical } from '@tabler/icons-react'
import { formatDateBRSafe } from '@/lib/date'

export default function TechnicalMapUser() {
  const { usuarioId } = useParams()
  const uid = usuarioId ? Number(usuarioId) : NaN

  const [user, setUser] = useState<any | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { user: authUser } = useAuth() || {}

  const [userNameCache, setUserNameCache] = useState<Record<number, string>>({})
  const [unitNameCache, setUnitNameCache] = useState<Record<number, string>>({})
  const usersCtx = useUsers()

  // when a company is selected/opened, resolve tecnico_responsavel and unidade names
  useEffect(() => {
    if (!sheetOpen || !selectedCompany) return

    // resolve tecnico_responsavel
    const techId = selectedCompany.tecnico_responsavel
    if (techId != null && !(techId in userNameCache)) {
      // try resolve from UsersContext cache first
      try {
        const { users } = usersCtx.getFilteredUsersForTask({ unidadeId: selectedCompany?.unidade_id ?? undefined })
        const found = (users || []).find(u => Number((u as any).id) === Number(techId))
        if (found) {
          setUserNameCache(prev => ({ ...prev, [techId]: (found as any).nome }))
        } else {
          getUserById(Number(techId)).then(res => {
            const u = (res && (res as any).user) ? (res as any).user : res
            if (u && u.id) {
              setUserNameCache(prev => ({ ...prev, [u.id]: u.nome }))
            }
          }).catch(() => {
            // ignore
          })
        }
      } catch (e) {
        // fallback to network call
        getUserById(Number(techId)).then(res => {
          const u = (res && (res as any).user) ? (res as any).user : res
          if (u && u.id) {
            setUserNameCache(prev => ({ ...prev, [u.id]: u.nome }))
          }
        }).catch(() => {})
      }
    }

    // resolve unidade via authUser.unidades if available
    const unitId = selectedCompany.unidade_id
    if (unitId != null && !(unitId in unitNameCache)) {
      const found = authUser?.unidades?.find((u: any) => Number(u.id) === Number(unitId))
      if (found) {
        setUnitNameCache(prev => ({ ...prev, [unitId]: found.nome }))
      } else {
        // fallback: store numeric id as string
        setUnitNameCache(prev => ({ ...prev, [unitId]: String(unitId) }))
      }
    }
  }, [sheetOpen, selectedCompany, authUser, userNameCache, unitNameCache])

  // fetch tasks related to the selected company when sheet opens
  const [companyTasks, setCompanyTasks] = useState<TaskItem[]>([])
  const [companyTasksLoading, setCompanyTasksLoading] = useState(false)
  const [companyTasksError, setCompanyTasksError] = useState<string | null>(null)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)

  useEffect(() => {
    let mounted = true
    async function fetchCompanyTasks() {
      setCompanyTasks([])
      setCompanyTasksError(null)
      if (!sheetOpen || !selectedCompany) return
      setCompanyTasksLoading(true)

      try {
        if (!selectedCompany) {
          if (!mounted) return
          setCompanyTasks([])
          return
        }

        let resp = await getTasksByCompany(Number(selectedCompany.id))
        let tasksArray: TaskItem[] = Array.isArray(resp) ? resp : (resp.tasks || resp)

        // If the server returns 0 or 1 tasks, maybe the empresa_id mapping is different;
        // attempt a fallback: fetch all tasks and filter by company name or CNPJ to collect related tasks.
        if ((!tasksArray || tasksArray.length <= 1) && selectedCompany) {
          try {
            const allRes = await getAllTasks()
            const allTasks: TaskItem[] = Array.isArray(allRes) ? allRes : (allRes.tasks || allRes)
            const companyName = (selectedCompany.nome || '').toString().toLowerCase()
            const companyCnpj = (selectedCompany.cnpj || '').toString()
            tasksArray = (allTasks || []).filter((t: any) => {
              const tEmpresa = (t.empresa || t.empresa_nome || '').toString().toLowerCase()
              const tCnpj = (t.cnpj || t.empresa_cnpj || '').toString()
              return tEmpresa === companyName || (companyCnpj && tCnpj === companyCnpj)
            })
          } catch (err) {
            // ignore fallback errors, we'll just use the original response
          }
        }

        if (!mounted) return
        setCompanyTasks(tasksArray || [])
      } catch (err) {
        if (!mounted) return
        setCompanyTasksError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!mounted) return
        setCompanyTasksLoading(false)
      }
    }

    fetchCompanyTasks()
    return () => { mounted = false }
  }, [sheetOpen, selectedCompany])

  useEffect(() => {
    let mounted = true
    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        if (!uid || Number.isNaN(uid)) {
          setError('ID de usuário inválido')
          setUser(null)
          setCompanies([])
          return
        }

        const uResp = await getUserById(uid)
        if (!mounted) return
        const actualUser = (uResp && (uResp as any).user) ? (uResp as any).user : uResp
        setUser(actualUser || null)

        const cResp = await getCompaniesByResponsible(uid)
        if (!mounted) return
        setCompanies(cResp.companies || [])
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

  return (
    <div className="container-main">
      <SiteHeader title={user?.nome ? `Mapa | ${user.nome}` : `Mapa | Usuário ${usuarioId}`} />

      <div className="px-6 py-4 max-w-7xl mx-auto">
        {/* Header com informações do usuário */}
        {user && (
          <div className="mb-6 rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-primary/20 shadow-md">
                <AvatarImage 
                  src={user.foto_url || user.fotoUrl} 
                  alt={`${user.nome} ${user.sobrenome || ''}`}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {user.nome?.charAt(0)}{user.sobrenome?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.nome} {user.sobrenome || ''}</h2>
                <p className="text-sm text-muted-foreground">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} sob responsabilidade
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Barra de pesquisa premium */}
        <div className="mb-6">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar empresa ou cidade..."
              className="w-full pl-10 pr-24 py-3 border border-input rounded-lg bg-background shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar pesquisa"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-muted-foreground mt-3">Carregando mapa do usuário...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Nome
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-sm">CNPJ</th>
                    <th className="text-left p-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Cidade
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-sm">Contabilidade</th>
                    <th className="text-left p-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefone
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {companies
                    .filter(c => {
                      if (!query) return true
                      const q = query.toLowerCase()
                      return (c.nome || '').toLowerCase().includes(q) || (c.cidade || '').toLowerCase().includes(q)
                    })
                    .map(c => (
                      <tr
                        key={c.id}
                        className="hover:bg-accent/50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setSelectedCompany(c)
                          setSheetOpen(true)
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedCompany(c); setSheetOpen(true) } }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="font-medium group-hover:text-primary transition-colors">{c.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{c.cnpj || '—'}</td>
                        <td className="p-4 text-sm">{c.cidade || '—'}</td>
                        <td className="p-4 text-sm text-muted-foreground">{c.contabilidade || '—'}</td>
                        <td className="p-4 text-sm">{c.telefone || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {companies.filter(c => {
              if (!query) return true
              const q = query.toLowerCase()
              return (c.nome || '').toLowerCase().includes(q) || (c.cidade || '').toLowerCase().includes(q)
            }).length === 0 && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company details sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) setSelectedCompany(null); setSheetOpen(v) }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-3 pb-6 border-b">
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <SheetTitle className="text-2xl">{selectedCompany?.nome || 'Detalhes da empresa'}</SheetTitle>
                <SheetDescription className="text-sm mt-1">Informações completas e tarefas vinculadas</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Informações da empresa em cards */}
          <div className="py-6 space-y-4">
            <div className="rounded-lg border bg-accent/30 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informações Gerais</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                  <p className="text-sm font-medium">{selectedCompany?.nome || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Razão Social</p>
                  <p className="text-sm font-medium">{selectedCompany?.razao_social || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">CNPJ</p>
                  <p className="text-sm font-medium font-mono">{selectedCompany?.cnpj || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cidade</p>
                  <p className="text-sm font-medium">{selectedCompany?.cidade || '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-accent/30 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contato & Responsabilidade</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{selectedCompany?.telefone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Contabilidade</p>
                  <p className="text-sm font-medium">{selectedCompany?.contabilidade || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Responsável Técnico</p>
                  <p className="text-sm font-medium">
                    {selectedCompany?.tecnico_responsavel == null ? '—' : (userNameCache[selectedCompany!.tecnico_responsavel] ?? String(selectedCompany!.tecnico_responsavel))}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Unidade</p>
                  <p className="text-sm font-medium">
                    {selectedCompany?.unidade_id == null ? '—' : (unitNameCache[selectedCompany!.unidade_id] ?? String(selectedCompany!.unidade_id))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarefas vinculadas */}
          <div className="pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold">Tarefas Vinculadas</h3>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={showCompletedTasks}
                  onChange={(e) => setShowCompletedTasks(e.target.checked)}
                  className="rounded"
                />
                <span className="text-muted-foreground">Mostrar concluídas</span>
              </label>
            </div>
            {companyTasksLoading ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-muted-foreground mt-3">Carregando tarefas...</p>
              </div>
            ) : companyTasksError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {companyTasksError}
              </div>
            ) : companyTasks.length === 0 ? (
              <div className="text-center py-12 rounded-lg border bg-accent/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-muted-foreground">Não há tarefas vinculadas a esta empresa</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Finalidade</th>
                        <th className="text-left p-3 text-sm font-semibold">Prazo</th>
                        <th className="text-left p-3 text-sm font-semibold">Responsável</th>
                        <th className="text-left p-3 text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-sm font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {companyTasks
                        .filter((t: any) => {
                          if (showCompletedTasks) return true
                          const status = (t.status ?? '').toString().toLowerCase()
                          return status !== 'concluída'
                        })
                        .map((t: any) => (
                        <tr key={t.id} className="hover:bg-accent/50 transition-colors">
                          <td className="p-3 text-sm font-medium">{t.finalidade || '—'}</td>
                          <td className="p-3 text-sm text-muted-foreground">{t.prazo ? formatDateBRSafe(t.prazo) : '—'}</td>
                          <td className="p-3 text-sm">{t.responsavel || '—'}</td>
                          <td className="p-3">
                            {t.status ? (() => {
                              const status = t.status
                              const statusText = (() => {
                                switch (status) {
                                  case 'progress':
                                    return 'Em Andamento'
                                  case 'concluída':
                                    return 'Concluída'
                                  case 'pendente':
                                    return 'Pendente'
                                  default:
                                    return status
                                }
                              })()

                              let badgeClass = ''
                              let icon = null
                              if (status === "concluída") {
                                badgeClass = "button-success";
                                icon = <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />;
                              } else if (status === "progress") {
                                badgeClass = "text-blue-600 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer";
                                icon = <IconProgress />;
                              } else if (status === "pendente") {
                                badgeClass = "button-primary";
                                icon = <IconLoader className="animate-spin" />;
                              } else {
                                icon = null;
                              }

                              return (
                                <Badge variant="outline" className={badgeClass}>
                                  {icon}
                                  {statusText}
                                </Badge>
                              )
                            })() : '—'}
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 data-[state=open]:bg-muted text-muted-foreground"
                                >
                                  <IconDotsVertical className="size-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem asChild className="cursor-pointer" onSelect={() => setSheetOpen(false)}>
                                  <Link to={`/technical/tarefa/${t.id}`} onClick={() => setSheetOpen(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  Favoritar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="border-t pt-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Fechar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
