export interface NotaByUser {
  historico_id: number
  tarefa_id: number
  nota: number | null
  data: string | null
  obs?: string | null
  by: null | { id: number; nome?: string; sobrenome?: string; foto?: string }
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function getNotasByUser(userId: number, opts?: { inicio?: string; fim?: string }): Promise<{ notas: NotaByUser[]; count: number; average: number | null }> {
  const token = localStorage.getItem('token')
  const params = new URLSearchParams()
  if (opts?.inicio) params.set('inicio', opts.inicio)
  if (opts?.fim) params.set('fim', opts.fim)
  const qs = params.toString()
  const res = await fetch(`${API_URL}/usuarios/${userId}/notas${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  })
  if (!res.ok) {
    let msg = 'Erro ao buscar notas do usuário'
    try { const j = await res.json(); msg = j?.message || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export async function getNotasResumoByUser(userId: number, opts?: { inicio?: string; fim?: string }): Promise<{ count: number; average: number | null }> {
  const token = localStorage.getItem('token')
  const params = new URLSearchParams()
  if (opts?.inicio) params.set('inicio', opts.inicio)
  if (opts?.fim) params.set('fim', opts.fim)
  const qs = params.toString()
  const res = await fetch(`${API_URL}/usuarios/${userId}/notas/resumo${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  })
  if (!res.ok) {
    let msg = 'Erro ao buscar resumo de notas do usuário'
    try { const j = await res.json(); msg = j?.message || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}
