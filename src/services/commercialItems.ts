import api from './api'

export interface CommercialItem {
  id?: number | string
  nome: string
  tipo: string
  valor_unitario?: number | null
  raw: any
}

export interface CommercialItemsResponse {
  items: CommercialItem[]
  tipo: string
}

export async function fetchCommercialItems(tipo: string, q?: string): Promise<CommercialItemsResponse> {
  const params = q ? { q } : undefined
  const res = await api.get<CommercialItemsResponse>(`/comercial/items/${encodeURIComponent(tipo)}`, { params })
  return res.data
}

export interface ProgramPriceRule {
  preco_linear: number | 0 | 1
  min_quantidade: number
  max_quantidade: number
  preco_unitario: number
  preco_adicional: number
}

export async function fetchProgramPriceRules(programaId: number | string): Promise<ProgramPriceRule[]> {
  const id = encodeURIComponent(String(programaId))
  const res = await api.get<ProgramPriceRule[]>(`/comercial/programas/${id}/regras`)
  return res.data
}

export type ProductPriceRule = ProgramPriceRule

export async function fetchProductPriceRules(produtoId: number | string): Promise<ProductPriceRule[]> {
  const id = encodeURIComponent(String(produtoId))
  const res = await api.get<ProductPriceRule[]>(`/comercial/produtos/${id}/regras`)
  return res.data
}
