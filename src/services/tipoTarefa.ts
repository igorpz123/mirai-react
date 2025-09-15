const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface TipoTarefa {
  id: number
  tipo: string
  setor_responsavel_id?: number | null
}

export interface TipoTarefaResponse {
  tipos: TipoTarefa[]
  total: number
}

export async function getTipoTarefa(setorId?: number): Promise<TipoTarefaResponse> {
  const token = localStorage.getItem('token')
  const url = setorId ? `${API_URL}/tipo_tarefa?setor_id=${setorId}` : `${API_URL}/tipo_tarefa`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erro ao buscar tipos de tarefa')
  }

  return res.json()
}

export default { getTipoTarefa }
