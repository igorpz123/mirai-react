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

  // Helper para montar URL de arquivo SEM usar hook (evita alterar contagem de hooks entre renders)
  function buildFileUrl(path: string) {
    if (!path) return '#'
    if (/^https?:\/\//i.test(path)) return path
    const rawBase = (import.meta as any).env?.VITE_API_PUBLIC_BASE || (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
    const base = rawBase.startsWith('http') ? rawBase : 'http://localhost:5000/api'
    if (base.endsWith('/api') && path.startsWith('/api')) {
      return base.replace(/\/api$/, '') + path
    }
    return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
  }

  if (loading) return <div>Carregando...</div>
  if (error) return <div className="text-destructive">{error}</div>
  if (!task) return <div>Nenhuma tarefa encontrada.</div>

  // helpers

  const formatDateBR = (value?: string) => {
    if (!value) return '—'
    try {
      const d = new Date(value)
      if (isNaN(d.getTime())) return '—'
      return new Intl.DateTimeFormat('pt-BR').format(d)
    } catch {
      return '—'
    }
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
      <div className='px-6 mt-4'>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Tarefa #{task.tarefa_id || task.id}
            <TaskStatusBadge status={task.status} />
          </h1>
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
          >
            Voltar
          </Button>
        </div>

        {/* Ações de fluxo */}
        <div className="mb-8 space-y-4">
          {showStart && (
            <Button onClick={handleStart} disabled={actionLoading} className="button-primary">
              {actionLoading ? 'Processando...' : 'Iniciar Tarefa'}
            </Button>
          )}
          {!showStart && showTransferSection && (
            <div className="flex items-center gap-3">
              <Button variant="secondary" disabled={actionLoading} onClick={() => setTransfering(v => !v)}>
                {transfering ? 'Cancelar Transferência' : 'Transferir Tarefa'}
              </Button>
            </div>
          )}
          {transfering && showTransferSection && (
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="font-medium text-sm">Transferir Tarefa</h3>
              {transferError && <div className="text-sm text-destructive">{transferError}</div>}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Setor (opcional)</label>
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
                  <label className="text-xs font-medium">Usuário (opcional)</label>
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
              <div className="flex justify-end">
                <Button onClick={handleTransfer} disabled={actionLoading} className="button-primary">
                  {actionLoading ? 'Transferindo...' : 'Confirmar Transferência'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            <div><strong>Unidade:</strong> {task.unidade_nome || task.unidade}</div>
            <div><strong>Empresa:</strong> {task.empresa_nome || task.empresa}</div>
            <div><strong>Finalidade:</strong> {task.finalidade}</div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
            <div><strong>Prioridade:</strong> {task.prioridade}</div>
            <div><strong>Prazo:</strong> {formatDateBR(task.prazo)}</div>
            <div><strong>Setor Responsável:</strong> {task.setor_nome || task.setor}</div>
            <div><strong>Usuário Responsável:</strong> {task.responsavel_nome || task.responsavel}</div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
          {/* Campo para adicionar observação */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Adicionar observação</h2>
            <div className="space-y-2">
              <Textarea
                placeholder="Escreva uma observação sobre esta tarefa..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={saving || !note.trim()}
                  onClick={async () => {
                    if (!id || !user?.id || !note.trim()) return
                    try {
                      setSaving(true)
                      await addTaskObservation(Number(id), Number(user.id), note.trim())
                      setNote('')
                      // refresh history
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
                >
                  {saving ? 'Salvando...' : 'Salvar observação'}
                </Button>
              </div>
            </div>
          </div>

          {/* Arquivos */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Arquivos</h2>
            <div className="rounded-md border p-3 bg-card/50 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
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
                      // clear input safely without touching possibly nulled event
                      try { inputEl.value = '' } catch { }
                      setUploading(false)
                    }
                  }}
                />
              </div>
              {!files || files.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum arquivo enviado.</div>
              ) : (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2">
                      <a href={buildFileUrl(f.caminho)} className="text-primary hover:underline truncate max-w-[70%]" target="_blank" rel="noreferrer">{f.nome_arquivo}</a>
                      <div className="flex items-center gap-2">
                        <a href={buildFileUrl(f.caminho)} target="_blank" rel="noreferrer" className="inline-block">
                          <button className="px-2 py-1 border rounded text-sm">Abrir</button>
                        </a>
                        <button
                          className="px-2 py-1 border rounded text-sm text-red-600"
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
                        >Excluir</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Histórico</h2>
          {historyLoading ? (
            <div>Carregando histórico...</div>
          ) : history && history.length ? (
            <div className="space-y-4">
              {history.map((h, idx) => (
                <div key={h.id} className={`flex items-center gap-4 py-4 ${idx > 0 ? 'border-t border-muted/40' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className="size-12">
                      <Avatar className="size-12">
                        {h.actor?.foto ? (
                          <AvatarImage src={h.actor.foto} alt={`${h.actor.nome} ${h.actor.sobrenome || ''}`} />
                        ) : (
                          <AvatarFallback className="text-lg">{(h.actor?.nome || 'U').charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-muted-foreground">{new Date(h.data_alteracao).toLocaleString('pt-BR')}</p>
                      {/* small action icon for premium feel */}
                      <div className="ml-2 text-muted-foreground" title={h.acao}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-medium mt-1">
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
                    <p className="text-sm text-muted-foreground mt-1">{h.observacoes ? `Observações: ${h.observacoes}` : 'Sem Observações'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      {h.avaliacao ? (
                        <div className="text-xs text-muted-foreground">
                          Avaliação: <span className="font-medium">{h.avaliacao.nota ?? '—'}</span>
                          {h.avaliacao.by?.nome ? ` por ${h.avaliacao.by.nome}` : ''}
                          {h.avaliacao.obs ? ` — ${h.avaliacao.obs}` : ''}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Sem avaliação</div>
                      )}
                      {(user && CAN_EVALUATE_ROLES.has(Number((user as any).cargoId))) && (
                        <Button variant="outline" size="sm" onClick={() => { setRatingTarget(h); setRatingNota(h.avaliacao?.nota != null ? String(h.avaliacao.nota) : ''); setRatingObs(h.avaliacao?.obs || ''); setRatingError(null); setRateOpen(true) }}>Avaliar</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>Nenhum histórico disponível.</div>
          )}
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
