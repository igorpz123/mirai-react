import api from './api'

export type Proposal = {
  id: number
  cliente: string
  valor?: number
  valor_total?: number
  status: 'pendente' | 'progress' | 'andamento' | 'analise' | 'análise' | 'rejeitada' | 'aprovada' | string
  comissao?: number
  criadoEm?: string
  dataAlteracao?: string
  unidade_id?: number
  titulo?: string
  responsavel?: string
  responsavel_id?: number
  indicacao_id?: number
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

export type ProposalCurso = {
  id: number
  proposta_id: number
  curso_id: number
  quantidade?: number
  valor_unitario?: number
  valor_total?: number
  curso_nome?: string
  curso_descricao?: string
}

export type ProposalQuimico = {
  id: number
  proposta_id: number
  quimico_id?: number
  descricao?: string
  quantidade?: number
  valor_unitario?: number
  valor_total?: number
}

export type ProposalProduto = {
  id: number
  proposta_id: number
  produto_id: number
  quantidade?: number
  valor_unitario?: number
  valor_total?: number
  produto_nome?: string
}

// Catalog types
export type Curso = {
  id: number
  nome: string
  descricao?: string
  valor?: number
  preco?: number
  valor_unitario?: number
  preco_unitario?: number
}
export type Quimico = {
  id: number
  grupo?: string
  pontos?: number
  descricao?: string
  // Optional price fields (backend may provide any of these)
  valor?: number
  preco?: number
  valor_unitario?: number
  preco_unitario?: number
}
export type Produto = { id: number; nome: string }
export type RegraPrecoProduto = {
  preco_linear?: number
  min_quantidade: number
  max_quantidade: number
  preco_unitario: number
  preco_adicional?: number
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

export async function getProposalStatsByUser(userId: number | null, unidadeId?: number | null) {
  if (!userId && !unidadeId) return null
  try {
    const params: string[] = []
    if (userId) params.push(`userId=${userId}`)
    if (unidadeId) params.push(`unidadeId=${unidadeId}`)
    const qs = params.length ? `?${params.join('&')}` : ''
    const res = await api.get(`/propostas/stats${qs}`)
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

export async function recalculateProposalTotal(id: number) {
  const res = await api.post(`/propostas/${id}/recalculate-total`)
  return res.data as { id: number; valor_total: number }
}

export async function deleteProposal(id: number) {
  const res = await api.delete(`/propostas/${id}`)
  return res.data as { id: number; deleted: boolean }
}

export async function getProposalById(id: number) {
  const res = await api.get(`/propostas/${id}`)
  return res.data as Proposal
}

export async function getCursosByProposal(id: number) {
  const res = await api.get(`/propostas/${id}/cursos`)
  return res.data as ProposalCurso[]
}

export async function getQuimicosByProposal(id: number) {
  const res = await api.get(`/propostas/${id}/quimicos`)
  return res.data as ProposalQuimico[]
}

export async function getProdutosByProposal(id: number) {
  const res = await api.get(`/propostas/${id}/produtos`)
  return res.data as ProposalProduto[]
}

// Catalog services
export async function getCoursesCatalog() {
  const res = await api.get('/propostas/catalog/cursos')
  return res.data as Curso[]
}
export async function getChemicalsCatalog() {
  const res = await api.get('/propostas/catalog/quimicos')
  return res.data as Quimico[]
}
export async function getProductsCatalog() {
  const res = await api.get('/propostas/catalog/produtos')
  return res.data as Produto[]
}
export async function getProductPrice(produtoId: number, quantidade: number) {
  const res = await api.get(`/propostas/catalog/produtos/${produtoId}/preco`, { params: { quantidade } })
  return res.data as RegraPrecoProduto
}

// Insert item services
export type AddCoursePayload = { curso_id: number; quantidade: number; valor_unitario: number; desconto: number }
export async function addCourseToProposal(propostaId: number, payload: AddCoursePayload) {
  const res = await api.post(`/propostas/${propostaId}/cursos`, payload)
  return res.data as { item: ProposalCurso | null }
}
export type AddChemicalPayload = { grupo: string; pontos: number; valor_unitario: number; desconto: number }
export async function addChemicalToProposal(propostaId: number, payload: AddChemicalPayload) {
  const res = await api.post(`/propostas/${propostaId}/quimicos`, payload)
  return res.data as { item: ProposalQuimico | null }
}
export type AddProductPayload = { produto_id: number; quantidade: number; desconto: number }
export async function addProductToProposal(propostaId: number, payload: AddProductPayload) {
  const res = await api.post(`/propostas/${propostaId}/produtos`, payload)
  return res.data as { item: ProposalProduto | null }
}
