// server/routes/ai.ts
import { Router } from 'express'
import AIController from '../controllers/AIController'
import { aiRateLimiter } from '../middleware/rateLimiter'

const router = Router()

// Aplicar rate limiter em todas as rotas de IA
router.use(aiRateLimiter)

// Endpoints principais
router.post('/text', AIController.generateTextEndpoint)
router.post('/image', AIController.analyzeImageEndpoint)
router.post('/chat', AIController.chatEndpoint)

// Endpoints de monitoramento
router.get('/stats', AIController.getStatsEndpoint)
router.post('/cache/clear', AIController.clearCacheEndpoint)

export default router
