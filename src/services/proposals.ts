import api from './api'

export type Proposal = {
  id: number
  cliente: string
  valor: number
  status: 'pendente' | 'progress' | 'andamento' | 'analise' | 'análise' | 'rejeitada' | 'aprovada' | string
  comissao?: number
  criadoEm?: string
  dataAlteracao?: string
  unidade_id?: number
  titulo?: string
  responsavel?: string
  indicacao?: string
  empresa?: {
    nome?: string
    razaoSocial?: string
    cnpj?: string
    cidade?: string
    contabilidade?: string
    telefone?: string
    email?: string
  }
}

export async function getProposalsByUser(userId: number | null) {
  // If backend endpoint exists, this will call it; otherwise return a safe mock shape
  if (!userId) return { proposals: [] }
  try {
    const res = await api.get(`/propostas?userId=${userId}`)
    return res.data
  } catch (err) {
    // fallback: return empty list to avoid crashing UI
    return { proposals: [] }
  }
}

export async function getProposalStatsByUser(userId: number | null) {
  if (!userId) return null
  try {
    const res = await api.get(`/propostas/stats?userId=${userId}`)
    return res.data
  } catch (err) {
    return null
  }
}

export async function getProposalsByUnit(unidadeId: number | null) {
  if (!unidadeId) return { proposals: [] }
  try {
    const res = await api.get(`/propostas/unidade/${unidadeId}`)
    return res.data
  } catch (err) {
    return { proposals: [] }
  }
}
