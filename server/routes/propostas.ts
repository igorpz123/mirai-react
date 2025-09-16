import { Router } from 'express'
import { getProposalsByUnidade, getProposalsByUser } from '../controllers/ProposalController'

const router = Router()

// Compat: existing frontend calls /propostas?userId=
router.get('/', getProposalsByUser)

// New: proposals by unidade id
router.get('/unidade/:unidade_id', getProposalsByUnidade)

export default router
