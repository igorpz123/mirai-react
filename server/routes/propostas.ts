import { Router } from 'express'
import { getProposalsByUnidade, getProposalsByUser, getProposalStats } from '../controllers/ProposalController'

const router = Router()

// Compat: existing frontend calls /propostas?userId=
router.get('/', getProposalsByUser)

// New: proposals by unidade id
router.get('/unidade/:unidade_id', getProposalsByUnidade)

// New: stats for commercial dashboard (counts + MoM trend)
router.get('/stats', getProposalStats)

export default router
