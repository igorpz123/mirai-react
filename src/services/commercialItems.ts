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
