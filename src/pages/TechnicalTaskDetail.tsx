import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskById, getTaskHistory, addTaskObservation, listTaskFiles, uploadTaskFile, deleteTaskFile, updateTask, rateTaskHistory, type Arquivo } from '@/services/tasks'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import TaskStatusBadge from '@/components/task-status-badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { SiteHeader } from '@/components/layout/site-header'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { getSetores } from '@/services/setores'
import { getUsersByDepartmentAndUnit } from '@/services/users'
import { useUnit } from '@/contexts/UnitContext'
import { toastSuccess } from '@/lib/customToast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { ADMIN_ROLES, CAN_EVALUATE_ROLES } from '@/constants/roles'
import { formatDateBRSafe } from '@/lib/date'

export default function TechnicalTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [history, setHistory] = React.useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [files, setFiles] = React.useState<Arquivo[] | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const { user } = useAuth()
  const { unitId } = useUnit()
  const isMounted = useIsMounted()

  // Estados e lógica para iniciar / transferir tarefa
  const [actionLoading, setActionLoading] = React.useState(false)
  const [transfering, setTransfering] = React.useState(false)
  const [setores, setSetores] = React.useState<{ id: number; nome: string }[]>([])
  const [setoresLoading, setSetoresLoading] = React.useState(false)
  const [setoresError, setSetoresError] = React.useState<string | null>(null)
  const [selectedSetorId, setSelectedSetorId] = React.useState<number | null>(null)
  const [usersForSetor, setUsersForSetor] = React.useState<any[] | null>(null)
  const [usersForSetorLoading, setUsersForSetorLoading] = React.useState(false)
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null)
  const [transferError, setTransferError] = React.useState<string | null>(null)

  // Avaliação (admin)
  const [rateOpen, setRateOpen] = React.useState(false)
  const [ratingTarget, setRatingTarget] = React.useState<any | null>(null)
  const [ratingNota, setRatingNota] = React.useState<string>('')
  const [ratingObs, setRatingObs] = React.useState<string>('')
  const [ratingSaving, setRatingSaving] = React.useState(false)
  const [ratingError, setRatingError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    const tid = Number(id)
    getTaskById(tid)
      .then((res) => {
        if (!mounted) return
        // backend returns the task object directly in controller getTaskById
        setTask(res)
      })
      .catch((err: any) => {
        console.error('Erro ao buscar tarefa:', err)
        if (!mounted) return
        setError(err?.message || 'Erro ao buscar tarefa')
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [id])

  React.useEffect(() => {
    if (!id) return
    let mounted = true
    setHistoryLoading(true)
    const tid = Number(id)
    getTaskHistory(tid)
      .then((data) => { if (mounted) setHistory(data) })
      .catch((err: any) => { console.error(err); if (mounted) setHistory(null) })
      .finally(() => { if (mounted) setHistoryLoading(false) })

    return () => { mounted = false }
  }, [id])

  React.useEffect(() => {
    if (!id) return
    let mounted = true
    listTaskFiles(Number(id)).then(lst => { if (mounted) setFiles(lst) }).catch(() => { if (mounted) setFiles([]) })
    return () => { mounted = false }
  }, [id])

  // Carregar setores ao montar (mover antes dos returns para manter ordem de hooks estável)
  React.useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setSetoresLoading(true)
          const res = await getSetores().catch(() => ({ setores: [] }))
          if (!mounted) return
          setSetores(res.setores || [])
        } catch (e) {
          if (mounted) setSetoresError(e instanceof Error ? e.message : 'Erro ao carregar setores')
        } finally {
          if (mounted) setSetoresLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [])

  // Quando setor muda, carregar usuários (também antes dos returns)
  React.useEffect(() => {
    let mounted = true
    if (!selectedSetorId) { setUsersForSetor(null); return }
    ; (async () => {
      try {
        setUsersForSetorLoading(true)
        if (!unitId) { setUsersForSetor([]); return }
        const res = await getUsersByDepartmentAndUnit(Number(selectedSetorId), Number(unitId))
        if (!mounted) return
        setUsersForSetor(res.users || [])
      } catch {
        if (mounted) setUsersForSetor([])
      } finally {
        if (mounted) setUsersForSetorLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [selectedSetorId, unitId])

  // Carregar usuários do setor da tarefa quando não houver responsável
  React.useEffect(() => {
    let mounted = true
    if (!task || task.responsavel_id || !task.setor_id || !unitId) return
    ; (async () => {
      try {
        setUsersForSetorLoading(true)
        const res = await getUsersByDepartmentAndUnit(Number(task.setor_id), Number(unitId))
        if (!mounted) return
        setUsersForSetor(res.users || [])
      } catch {
        if (mounted) setUsersForSetor([])
      } finally {
        if (mounted) setUsersForSetorLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [task?.setor_id, task?.responsavel_id, unitId])

  // Helper para montar URL de arquivo SEM usar hook (evita alterar contagem de hooks entre renders)
  function buildFileUrl(path: string) {
    if (!path) return '#'
    if (/^https?:\/\//i.test(path)) return path
    const rawBase = (import.meta as any).env?.VITE_API_PUBLIC_BASE || (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
    const baseHttp = rawBase.startsWith('http') ? rawBase : 'http://localhost:5000/api'
    const origin = baseHttp.replace(/\/api\/?$/, '')
    // Para arquivos públicos, garantir que usamos a ORIGEM sem /api
    if (path.startsWith('/uploads')) {
      return origin + path
    }
    // Se já vier com /api, também usar a origem + caminho
    if (path.startsWith('/api')) {
      return origin + path
    }
    // Caso geral: anexar ao baseHttp
    return baseHttp.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
  }

  if (loading) return <div>Carregando...</div>
  if (error) return <div className="text-destructive">{error}</div>
  if (!task) return <div>Nenhuma tarefa encontrada.</div>

  // helpers

  const formatDateBR = (value?: string) => {
    const out = formatDateBRSafe(value || '')
    return out || '—'
  }

  // ----- Fluxo de status (similar ao sheet lateral) -----
  const normalizedStatus = (task.status || '').toString().toLowerCase()
  const isPending = normalizedStatus.includes('pend') || normalizedStatus.includes('pending')
  const isProgress = normalizedStatus.includes('progress') || normalizedStatus.includes('andament') || normalizedStatus.includes('prog')

  // Determinar se usuário é responsável
  let isResponsible = false
  if (user) {
    const respId = task.responsavel_id || task.responsavelId || task.usuario_id
    if (respId != null) {
      isResponsible = Number(user.id) === Number(respId)
    }
    if (!isResponsible && task.responsavel) {
      const respStr = String(task.responsavel).toLowerCase()
      const userFullName = `${(user as any).nome || ''} ${(user as any).sobrenome || ''}`.toLowerCase().trim()
      if (respStr.includes(userFullName) || respStr.includes(String(user.id))) isResponsible = true
    }
  }
  const canTransferAny = user && ADMIN_ROLES.has(Number((user as any).cargoId))
  const showStart = isPending && isResponsible
  const showTransferSection = isProgress && (isResponsible || canTransferAny)


  async function handleStart() {
    if (!id) return
    try {
      setActionLoading(true)
      await updateTask(Number(id), { status: 'progress' } as any)
      try { toastSuccess('Tarefa iniciada') } catch { /* ignore */ }
      setTask((prev: any) => prev ? { ...prev, status: 'progress' } : prev)
      getTaskHistory(Number(id)).then(h => setHistory(h)).catch(() => { })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTransfer() {
    if (!id) return
    try {
      setActionLoading(true)
      setTransferError(null)
      const payload: any = {
        status: 'pendente',
        setorId: selectedSetorId ?? null,
        usuarioId: selectedUserId ?? null,
      }
      await updateTask(Number(id), payload)
      try { toastSuccess('Tarefa transferida') } catch { /* ignore */ }
      setTask((prev: any) => prev ? { ...prev, status: 'pendente', setor_id: selectedSetorId ?? prev.setor_id, responsavel_id: selectedUserId ?? prev.responsavel_id } : prev)
      getTaskHistory(Number(id)).then(h => setHistory(h)).catch(() => { })
      setTransfering(false)
      setSelectedSetorId(null)
      setSelectedUserId(null)
    } catch (e: any) {
      setTransferError(e?.message || 'Erro ao transferir tarefa')
    } finally {
      setActionLoading(false)
    }
  }

  // render fields based on controller's row shape

  return (
    <div className="container-main">
      <SiteHeader title="Detalhes da Tarefa" />
      <div className='px-6 mt-4 max-w-7xl mx-auto'>
        {/* Header Premium com gradiente sutil */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Tarefa #{task.tarefa_id || task.id}
                </h1>
                <TaskStatusBadge status={task.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {task.empresa_nome || task.empresa} • {task.unidade_nome || task.unidade}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1)
                } else {
                  navigate('/')
                }
              }}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </Button>
          </div>

          {/* Ações de fluxo com cards premium */}
          {(showStart || showTransferSection) && (
            <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl border border-primary/10 p-6 shadow-sm">
              {showStart && (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Pronto para começar?</h3>
                    <p className="text-sm text-muted-foreground">Inicie esta tarefa para registrar seu progresso</p>
                  </div>
                  <Button onClick={handleStart} disabled={actionLoading} className="button-primary shadow-md hover:shadow-lg transition-shadow">
                    {actionLoading ? 'Processando...' : 'Iniciar Tarefa'}
                  </Button>
                </div>
              )}
              {!showStart && showTransferSection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold">Transferir Tarefa</h3>
                        <p className="text-xs text-muted-foreground">Redirecione para outro setor ou usuário</p>
                      </div>
                    </div>
                    <Button variant="secondary" disabled={actionLoading} onClick={() => setTransfering(v => !v)} className="shadow-sm">
                      {transfering ? 'Cancelar' : 'Transferir'}
                    </Button>
                  </div>
                  {transfering && (
                    <div className="bg-card rounded-lg border p-5 space-y-4 animate-in fade-in-50 slide-in-from-top-3 duration-300">
                      {transferError && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                          {transferError}
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Setor <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                          </label>
                          {!isMounted ? (
                            <div className="text-xs text-muted-foreground">Preparando...</div>
                          ) : (
                            <Select value={selectedSetorId ? String(selectedSetorId) : ''} onValueChange={(v) => setSelectedSetorId(v === '' || v === '__none' ? null : Number(v))}>
                              <SelectTrigger className="w-full" disabled={setoresLoading}>
                                <SelectValue placeholder={setoresLoading ? 'Carregando...' : 'Selecionar setor'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none">-- Nenhum --</SelectItem>
                                {!setoresLoading && setores.map(s => (
                                  <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {setoresError && <div className="text-destructive text-xs">{setoresError}</div>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Usuário <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                          </label>
                          {!isMounted ? (
                            <div className="text-xs text-muted-foreground">Preparando...</div>
                          ) : (
                            <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={(v) => setSelectedUserId(v === '' || v === '__none' ? null : Number(v))}>
                              <SelectTrigger className="w-full" disabled={usersForSetorLoading}>
                                <SelectValue placeholder={usersForSetorLoading ? 'Carregando...' : (usersForSetor ? 'Selecionar usuário' : 'Selecionar usuário')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none">-- Nenhum --</SelectItem>
                                {usersForSetor && usersForSetor.map((u: any) => (
                                  <SelectItem key={u.id} value={String(u.id)}>{u.nome || u.nome_completo || u.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleTransfer} disabled={actionLoading} className="button-primary shadow-md hover:shadow-lg transition-shadow">
                          {actionLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Transferindo...
                            </>
                          ) : 'Confirmar Transferência'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações da Tarefa em Cards Premium */}
        <div className="grid gap-6 mb-8">
          <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Informações Gerais
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Finalidade</p>
                  <p className="text-sm font-semibold">{task.finalidade}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</p>
                  <p className="text-sm font-semibold capitalize">{task.prioridade}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prazo</p>
                  <p className="text-sm font-semibold">{formatDateBR(task.prazo)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setor Responsável</p>
                  <p className="text-sm font-semibold">{task.setor_nome || task.setor}</p>
                </div>

                <div className="space-y-1 grid sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário Responsável</p>
                  {task.responsavel_nome || task.responsavel ? (
                    <p className="text-sm font-semibold">{task.responsavel_nome || task.responsavel}</p>
                  ) : (
                    <div className="space-y-2 grid grid-cols-2">
                      <Select 
                        value={selectedUserId ? String(selectedUserId) : ''} 
                        onValueChange={(v) => setSelectedUserId(v === '' ? null : Number(v))}
                      >
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Selecionar responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersForSetor && usersForSetor.map((u: any) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nome || u.nome_completo || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedUserId || actionLoading}
                        onClick={async () => {
                          if (!id || !selectedUserId) return
                          try {
                            setActionLoading(true)
                            await updateTask(Number(id), { usuarioId: selectedUserId } as any)
                            toastSuccess('Responsável atribuído com sucesso')
                            // Atualizar task local
                            const updatedTask = await getTaskById(Number(id))
                            setTask(updatedTask)
                            // Refresh histórico
                            const data = await getTaskHistory(Number(id))
                            setHistory(data)
                            setSelectedUserId(null)
                          } catch (err: any) {
                            alert(err?.message || 'Erro ao atribuir responsável')
                          } finally {
                            setActionLoading(false)
                          }
                        }}
                        className="w-full max-w-xs"
                      >
                        {actionLoading ? 'Atribuindo...' : 'Atribuir Responsável'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observações e Arquivos lado a lado em cards */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Campo para adicionar observação */}
          <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Nova Observação
              </h2>
              <div className="space-y-3">
                <Textarea
                  placeholder="Escreva uma observação detalhada sobre esta tarefa..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {note.length}/1000 caracteres
                  </span>
                  <Button
                    variant="default"
                    disabled={saving || !note.trim()}
                    onClick={async () => {
                      if (!id || !user?.id || !note.trim()) return
                      try {
                        setSaving(true)
                        await addTaskObservation(Number(id), Number(user.id), note.trim())
                        setNote('')
                        setHistoryLoading(true)
                        const data = await getTaskHistory(Number(id))
                        setHistory(data)
                      } catch (err: any) {
                        console.error(err)
                        alert(err?.message || 'Erro ao salvar observação')
                      } finally {
                        setSaving(false)
                        setHistoryLoading(false)
                      }
                    }}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Arquivos */}
          <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Arquivos Anexados
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium">{uploading ? 'Enviando...' : 'Selecionar arquivo'}</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const inputEl = e.currentTarget
                        const file = inputEl.files?.[0]
                        if (!file || !id) return
                        try {
                          setUploading(true)
                          await uploadTaskFile(Number(id), file)
                          const lst = await listTaskFiles(Number(id))
                          setFiles(lst)
                        } catch (err) {
                          alert('Erro ao enviar arquivo')
                        } finally {
                          try { inputEl.value = '' } catch { }
                          setUploading(false)
                        }
                      }}
                    />
                  </label>
                </div>
                {!files || files.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-12 mx-auto mb-2 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Nenhum arquivo anexado
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-accent/30 hover:bg-accent/50 transition-colors group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 size-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <a href={buildFileUrl(f.caminho)} className="text-sm font-medium hover:text-primary truncate flex-1" target="_blank" rel="noreferrer">
                            {f.nome_arquivo}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a href={buildFileUrl(f.caminho)} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (!id) return
                              const ok = window.confirm('Excluir este arquivo?')
                              if (!ok) return
                              try {
                                await deleteTaskFile(Number(id), f.id)
                                setFiles(prev => prev ? prev.filter(x => x.id !== f.id) : prev)
                              } catch (err) {
                                alert('Erro ao excluir arquivo')
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Histórico Premium com Timeline */}
        <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico da Tarefa
            </h2>
            {historyLoading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-muted-foreground mt-3">Carregando histórico...</p>
              </div>
            ) : history && history.length ? (
              <div className="space-y-6 relative before:absolute before:left-6 before:top-3 before:bottom-3 before:w-px before:bg-border">
                {history.map((h) => (
                  <div key={h.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 relative z-10">
                      <Avatar className="size-12 ring-4 ring-background">
                        {h.actor?.foto ? (
                          <AvatarImage src={h.actor.foto} alt={`${h.actor.nome} ${h.actor.sobrenome || ''}`} />
                        ) : (
                          <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                            {(h.actor?.nome || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="rounded-lg border bg-accent/30 p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {new Date(h.data_alteracao).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {h.acao ? h.acao.replace(/_/g, ' ') : 'sem ação'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-2">
                          {(() => {
                            switch (h.acao) {
                              case 'concluir_usuario':
                                return `${h.anterior?.usuario_nome || 'Usuário desconhecido'} concluiu a tarefa e designou para ${h.novo?.usuario_nome || 'Usuário desconhecido'}`
                              case 'concluir_setor':
                                return `${h.anterior?.usuario_nome || 'Usuário desconhecido'} concluiu a tarefa e designou para o setor ${h.novo?.setor_nome || h.novo?.setor_id || ''}`
                              case 'concluir_arquivar':
                                return `${h.anterior?.usuario_nome || 'Usuário desconhecido'} concluiu e arquivou a tarefa`
                              case 'designar':
                                return `${h.anterior?.usuario_nome || 'Usuário desconhecido'} designou a tarefa para ${h.novo?.usuario_nome || 'Usuário desconhecido'}`
                              case 'criar':
                                return `${h.novo?.usuario_nome || 'Usuário desconhecido'} criou a tarefa`
                              case 'iniciar':
                                return `${h.novo?.usuario_nome || 'Usuário desconhecido'} iniciou a tarefa`
                              case 'assumir_responsabilidade':
                                return `${h.novo?.usuario_nome || 'Usuário desconhecido'} se tornou responsável pela tarefa`
                              case 'adicionar_observacao':
                                return `${h.novo?.usuario_nome || 'Usuário desconhecido'} adicionou uma observação`
                              default:
                                return `${h.actor?.nome || 'Usuário'} ${h.actor?.sobrenome || ''} - ${h.acao}`
                            }
                          })()}
                        </p>
                        {h.observacoes && (
                          <div className="mt-2 p-3 rounded-md bg-card/50 border border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
                            <p className="text-sm">{h.observacoes}</p>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/50">
                          {h.avaliacao ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="text-sm font-bold">{h.avaliacao.nota ?? '—'}</span>
                              </div>
                              {h.avaliacao.by?.nome && (
                                <span className="text-xs text-muted-foreground">por {h.avaliacao.by.nome}</span>
                              )}
                              {h.avaliacao.obs && (
                                <span className="text-xs text-muted-foreground">• {h.avaliacao.obs}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Sem avaliação</div>
                          )}
                          {(user && CAN_EVALUATE_ROLES.has(Number((user as any).cargoId))) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => { 
                                setRatingTarget(h); 
                                setRatingNota(h.avaliacao?.nota != null ? String(h.avaliacao.nota) : ''); 
                                setRatingObs(h.avaliacao?.obs || ''); 
                                setRatingError(null); 
                                setRateOpen(true) 
                              }}
                              className="h-7 text-xs"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Avaliar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de avaliação */}
        <Dialog open={rateOpen} onOpenChange={(v) => { if (!ratingSaving) setRateOpen(v) }}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Avaliar alteração</DialogTitle>
              <DialogDescription>Registre uma nota de 0 a 10 para esta alteração.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label htmlFor="nota">Nota (0 a 10)</Label>
                <Input id="nota" type="number" min={0} max={10} step={1} value={ratingNota} onChange={(e) => setRatingNota(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="obs">Observação (opcional)</Label>
                <Textarea id="obs" value={ratingObs} onChange={(e) => setRatingObs(e.target.value)} maxLength={300} />
              </div>
              {ratingError ? <div className="text-sm text-destructive">{ratingError}</div> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={ratingSaving} onClick={() => setRateOpen(false)}>Cancelar</Button>
              <Button className="button-primary" disabled={ratingSaving} onClick={async () => {
                if (!ratingTarget) return
                const n = Number(ratingNota)
                if (!Number.isFinite(n) || n < 0 || n > 10) { setRatingError('Informe uma nota entre 0 e 10.'); return }
                try {
                  setRatingSaving(true)
                  await rateTaskHistory(Number(ratingTarget.id), n, ratingObs?.trim() || undefined)
                  try { toastSuccess('Avaliação registrada') } catch {}
                  // refresh history
                  setHistoryLoading(true)
                  const data = await getTaskHistory(Number(id))
                  setHistory(data)
                  setRateOpen(false)
                } catch (e: any) {
                  setRatingError(e?.message || 'Erro ao registrar avaliação')
                } finally {
                  setRatingSaving(false)
                  setHistoryLoading(false)
                }
              }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
