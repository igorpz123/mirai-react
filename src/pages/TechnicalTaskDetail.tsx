import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTaskById, getTaskHistory } from '@/services/tasks'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function TechnicalTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [history, setHistory] = React.useState<any[] | null>(null)
  const [historyLoading, setHistoryLoading] = React.useState(false)

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

  if (loading) return <div>Carregando...</div>
  if (error) return <div className="text-destructive">{error}</div>
  if (!task) return <div>Nenhuma tarefa encontrada.</div>

  // render fields based on controller's row shape
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tarefa #{task.tarefa_id || task.id}</h1>
        <Link to="/">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      <div className="space-y-2">
        <div><strong>Finalidade:</strong> {task.finalidade}</div>
        <div><strong>Prioridade:</strong> {task.prioridade}</div>
        <div><strong>Status:</strong> {task.status}</div>
        <div><strong>Prazo:</strong> {task.prazo}</div>
        <div><strong>Empresa:</strong> {task.empresa_nome || task.empresa}</div>
        <div><strong>Unidade:</strong> {task.unidade_nome || task.unidade}</div>
        <div><strong>Setor:</strong> {task.setor_nome || task.setor}</div>
        <div><strong>Responsável:</strong> {task.responsavel_nome || task.responsavel}</div>
        {task.empresa_cnpj ? <div><strong>CNPJ:</strong> {task.empresa_cnpj}</div> : null}
        {task.empresa_cidade ? <div><strong>Cidade:</strong> {task.empresa_cidade}</div> : null}
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
