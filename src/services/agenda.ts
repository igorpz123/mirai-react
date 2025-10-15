const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface AgendaEvent {
  id: number;
  tarefa_id: number;
  start_date: string;
  end_date: string;
  title: string;
  description?: string;
  color?: string | null;
  tipo_tarefa_id?: number; // finalidade_id da tarefa, quando vinculado
}

export async function getEventsByResponsavel(responsavelId: number, range?: { from?: string; to?: string }): Promise<{ events: AgendaEvent[] }> {
  const token = localStorage.getItem('token')
  const qs = new URLSearchParams()
  if (range?.from) qs.set('from', range.from)
  if (range?.to) qs.set('to', range.to)
  const url = `${API_URL}/tarefas/agenda/responsavel/${responsavelId}${qs.toString() ? `?${qs.toString()}` : ''}`
  const res = await fetch(url, {
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

  const data = await res.json()
  // Defensive mapping to ensure keys match AgendaEvent interface
  const events = (data?.events || []).map((e: any) => ({
    id: e.id,
    tarefa_id: e.tarefa_id,
    start_date: e.start_date || e.start,
    end_date: e.end_date || e.end,
    title: e.title,
    description: e.description,
    color: e.color || null,
    tipo_tarefa_id: e.tipo_tarefa_id ?? e.finalidade_id,
  })) as AgendaEvent[]
  return { events }
}

export async function updateAgendaEvent(id: number, payload: { start?: string; end?: string; title?: string; description?: string | null }): Promise<{ message: string }> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/tarefas/agenda/evento/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erro ao atualizar evento')
  }
  return res.json()
}

export interface CreateAgendaEventPayload {
  title: string;
  description?: string;
  color?: string | null; // rgb or hex string
  start: string; // 'YYYY-MM-DD HH:mm:ss' or ISO with date/time
  end?: string | null;
  tarefa_id?: number | null;
  usuario_id: number;
}

export async function createAgendaEvent(payload: CreateAgendaEventPayload): Promise<{ message: string; event: AgendaEvent }>{
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/tarefas/agenda/evento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || 'Erro ao criar evento')
  }
  const e = data.event
  const event: AgendaEvent = {
    id: e.id,
    tarefa_id: e.tarefa_id ?? null,
    start_date: e.start_date || e.start,
    end_date: e.end_date || e.end,
    title: e.title,
    description: e.description,
    color: e.color,
    tipo_tarefa_id: e.tipo_tarefa_id ?? e.finalidade_id,
  }
  return { message: data.message || 'Evento criado', event }
}
