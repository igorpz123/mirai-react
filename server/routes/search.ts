// server/routes/search.ts
import { Router } from 'express'
import * as SearchController from '../controllers/SearchController'
import { extractUserId } from '../middleware/permissions'

const router = Router()

// Todas as rotas de busca requerem autenticação
router.use(extractUserId)

// GET /api/search/global?q=termo&limit=20&offset=0&types=task,company
router.get('/global', SearchController.globalSearch)

// GET /api/search/recent - itens recentes do usuário
router.get('/recent', SearchController.getRecentItems)

export default router
