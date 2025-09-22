import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskById, getTaskHistory, addTaskObservation, listTaskFiles, uploadTaskFile, deleteTaskFile, type Arquivo } from '@/services/tasks'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import TaskStatusBadge from '@/components/task-status-badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'

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

  // render fields based on controller's row shape
  return (
    <div className="p-4">
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
                  try { inputEl.value = '' } catch {}
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
                  <a href={f.caminho} className="text-primary hover:underline truncate max-w-[70%]" target="_blank" rel="noreferrer">{f.nome_arquivo}</a>
                  <div className="flex items-center gap-2">
                    <a href={f.caminho} target="_blank" rel="noreferrer" className="inline-block">
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Nenhum histórico disponível.</div>
        )}
      </div>
    </div>
  )
}
