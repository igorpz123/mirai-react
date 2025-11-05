// src/services/search.ts
import api from './api'

export interface SearchResult {
  id: number | string
  type: 'task' | 'proposal' | 'company' | 'user'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  relevance: number
  url: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  categories: {
    tasks: number
    proposals: number
    companies: number
    users: number
  }
}

/**
 * Busca global em tarefas, propostas, empresas e usuários
 */
export async function searchGlobal(
  query: string,
  options?: {
    limit?: number
    offset?: number
    types?: Array<'task' | 'proposal' | 'company' | 'user'>
    unitId?: number
  }
): Promise<SearchResponse> {
  const params = new URLSearchParams()
  params.append('q', query)
  
  if (options?.limit) params.append('limit', options.limit.toString())
  if (options?.offset) params.append('offset', options.offset.toString())
  if (options?.types) params.append('types', options.types.join(','))
  if (options?.unitId) params.append('unitId', options.unitId.toString())

  const response = await api.get<SearchResponse>(`/search/global?${params.toString()}`)
  return response.data
}

/**
 * Obtém itens recentes do usuário
 */
export async function getRecentItems(): Promise<SearchResult[]> {
  const response = await api.get<{ recent: SearchResult[] }>('/search/recent')
  return response.data.recent
}

// Gerenciamento de histórico de buscas (localStorage)
const SEARCH_HISTORY_KEY = 'mirai_search_history'
const MAX_HISTORY_ITEMS = 10

export function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export function addToSearchHistory(query: string): void {
  if (!query.trim()) return
  
  try {
    const history = getSearchHistory()
    
    // Remove duplicatas e adiciona no início
    const filtered = history.filter(q => q.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Erro ao salvar histórico de busca:', error)
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch (error) {
    console.error('Erro ao limpar histórico de busca:', error)
  }
}
