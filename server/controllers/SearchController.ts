// server/controllers/SearchController.ts
import { Response } from 'express'
import { AuthRequest } from '../middleware/permissions'
import * as searchService from '../services/searchService'

/**
 * GET /api/search/global
 * Busca global em múltiplas entidades
 */
export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const query = (req.query.q as string) || ''
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    const unitId = req.query.unitId ? parseInt(req.query.unitId as string) : undefined
    const typesParam = req.query.types as string
    
    const types = typesParam 
      ? typesParam.split(',').filter(t => ['task', 'proposal', 'company', 'user'].includes(t)) as any[]
      : undefined

    if (!query || query.trim().length < 2) {
      return res.json({
        results: [],
        total: 0,
        query: query.trim(),
        categories: { tasks: 0, proposals: 0, companies: 0, users: 0 }
      })
    }

    const results = await searchService.globalSearch(query, req.userId, {
      limit,
      offset,
      types,
      unitId
    })

    res.json(results)
  } catch (error) {
    console.error('[SearchController] Erro na busca global:', error)
    res.status(500).json({ 
      error: 'Erro ao realizar busca',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}

/**
 * GET /api/search/recent
 * Retorna itens recentes do usuário (para sugestões)
 */
export const getRecentItems = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    // TODO: Implementar cache de itens recentes por usuário
    // Por enquanto, retorna vazio
    res.json({ recent: [] })
  } catch (error) {
    console.error('[SearchController] Erro ao buscar itens recentes:', error)
    res.status(500).json({ error: 'Erro ao buscar itens recentes' })
  }
}
