const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface AgendaEvent {
  id: number;
  tarefa_id: number;
  start_date: string;
  end_date: string;
  title: string;
  description?: string;
}

export async function getEventsByResponsavel(responsavelId: number): Promise<{ events: AgendaEvent[] }>{
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/tarefas/agenda/responsavel/${responsavelId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erro ao buscar eventos da agenda')
  }

  return res.json()
}
