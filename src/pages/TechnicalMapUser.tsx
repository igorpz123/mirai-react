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
import { IconCircleCheckFilled, IconProgress, IconLoader, IconDotsVertical } from '@tabler/icons-react'

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

      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar empresa ou cidade..."
            className="border-input rounded-md px-3 py-2 w-full"
          />
          <button
            type="button"
            onClick={() => setQuery('')}
            className="btn btn-ghost px-3"
            aria-label="Limpar pesquisa"
          >
            Limpar
          </button>
        </div>

        {loading ? (
          <div>Carregando mapa do usuário...</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto border rounded">
            <table className="w-full table-auto">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">CNPJ</th>
                  <th className="text-left p-2">Cidade</th>
                  <th className="text-left p-2">Contabilidade</th>
                  <th className="text-left p-2">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {companies
                  .filter(c => {
                    if (!query) return true
                    const q = query.toLowerCase()
                    return (c.nome || '').toLowerCase().includes(q) || (c.cidade || '').toLowerCase().includes(q)
                  })
                  .map(c => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedCompany(c)
                        setSheetOpen(true)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedCompany(c); setSheetOpen(true) } }}
                    >
                      <td className="p-2 font-medium">{c.nome}</td>
                      <td className="p-2">{c.cnpj || '—'}</td>
                      <td className="p-2">{c.cidade || '—'}</td>
                      <td className="p-2">{c.contabilidade || '—'}</td>
                      <td className="p-2">{c.telefone || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Company details sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) setSelectedCompany(null); setSheetOpen(v) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedCompany?.nome || 'Detalhes da empresa'}</SheetTitle>
            <SheetDescription>Informações completas da empresa selecionada.</SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-2">
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div><strong>Nome Fantasia:</strong> {selectedCompany?.nome || '—'}</div>
              <div><strong>Razão Social:</strong> {selectedCompany?.razao_social || '—'}</div>
              <div><strong>CNPJ:</strong> {selectedCompany?.cnpj || '—'}</div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
              <div><strong>Cidade:</strong> {selectedCompany?.cidade || '—'}</div>
              <div><strong>Telefone:</strong> {selectedCompany?.telefone || '—'}</div>
              <div><strong>Contabilidade:</strong> {selectedCompany?.contabilidade || '—'}</div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
              <div>
                <strong>Responsável técnico:</strong>{' '}
                {selectedCompany?.tecnico_responsavel == null ? '—' : (userNameCache[selectedCompany!.tecnico_responsavel] ?? String(selectedCompany!.tecnico_responsavel))}
              </div>
              <div>
                <strong>Unidade:</strong>{' '}
                {selectedCompany?.unidade_id == null ? '—' : (unitNameCache[selectedCompany!.unidade_id] ?? String(selectedCompany!.unidade_id))}
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Tarefas vinculadas à empresa</h3>
            {companyTasksLoading ? (
              <div>Carregando tarefas...</div>
            ) : companyTasksError ? (
              <div className="text-destructive">{companyTasksError}</div>
            ) : companyTasks.length === 0 ? (
              <div>Não há tarefas vinculadas a esta empresa.</div>
            ) : (
              <div className="overflow-x-auto border rounded">
                <table className="w-full table-auto">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Finalidade</th>
                      <th className="text-left p-2">Prazo</th>
                      <th className="text-left p-2">Responsável</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyTasks.map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/50">
                        <td className="p-2">{t.finalidade || '—'}</td>
                        <td className="p-2">
                          {t.prazo ? (
                            (() => {
                              try {
                                const d = new Date(t.prazo)
                                if (isNaN(d.getTime())) return '—'
                                return new Intl.DateTimeFormat('pt-BR').format(d)
                              } catch {
                                return '—'
                              }
                            })()
                          ) : '—'}
                        </td>
                        <td className="p-2">{t.responsavel || '—'}</td>
                        <td className="p-2">
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
                        <td>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="data-[state=open]:bg-muted text-muted-foreground"
                              >
                                <IconDotsVertical />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem asChild className="cursor-pointer" onSelect={() => setSheetOpen(false)}>
                                <Link to={`/technical/tarefa/${t.id}`} onClick={() => setSheetOpen(false)}>
                                  Visualizar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">Favoritar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">Deletar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <SheetFooter>
            <SheetClose className="btn cursor-pointer">Fechar</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
