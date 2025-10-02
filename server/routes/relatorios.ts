import { Router } from 'express'
import { getApprovedProposalsReport, getNotasRankingReport } from '../controllers/ReportsController'

const router = Router()

// Admin-only endpoints (controller enforces admin via JWT)
router.get('/propostas-aprovadas', getApprovedProposalsReport)
router.get('/ranking-notas', getNotasRankingReport)

export default router
