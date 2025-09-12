import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTaskById } from '@/services/tasks'
import { Button } from '@/components/ui/button'

export default function TechnicalTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

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
    </div>
  )
}
