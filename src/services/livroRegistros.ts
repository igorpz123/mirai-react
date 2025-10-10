const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface LivroRegistro {
  id: number
  numero?: string | null
  data_aquisicao?: string | null
  participante: string
  empresa_id: number
  empresa_nome?: string | null
  curso_id: number
  curso_nome?: string | null
  instrutor?: string | null
  carga_horaria: number
  data_conclusao: string
  modalidade: string
  sesmo: boolean
  notaFiscal: boolean
  pratica: boolean
  observacoes?: string | null
  criado_em?: string | null
  atualizado_em?: string | null
}

export interface LivroRegistrosResponse { registros: LivroRegistro[]; total: number }

function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  }
}

export async function listLivroRegistros(params?: Partial<{ empresa_id: number; curso_id: number; participante: string; modalidade: string; sesmo: number; pratica: number; notaFiscal: number; data_conclusao_inicio: string; data_conclusao_fim: string; limit: number; offset: number; sort: string; order: string }>): Promise<LivroRegistrosResponse> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)])) : ''
  const res = await fetch(`${API_URL}/livro_registros${qs}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Erro ao listar registros')
  return res.json()
}

export async function createLivroRegistro(payload: Omit<LivroRegistro, 'id' | 'empresa_nome' | 'curso_nome' | 'criado_em' | 'atualizado_em'>): Promise<LivroRegistro> {
  const res = await fetch(`${API_URL}/livro_registros`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Erro ao criar registro')
  return res.json()
}

export async function updateLivroRegistro(id: number, payload: Partial<Omit<LivroRegistro, 'id'>>): Promise<LivroRegistro> {
  const res = await fetch(`${API_URL}/livro_registros/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Erro ao atualizar registro')
  return res.json()
}

export async function deleteLivroRegistro(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/livro_registros/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Erro ao deletar registro')
}
