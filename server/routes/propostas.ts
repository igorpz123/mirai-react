import { Router } from 'express'
import { getProposalsByUnidade, getProposalsByUser, getProposalStats, deleteProposal, getProposalById, getCursosByProposal, getQuimicosByProposal, getProdutosByProposal, getCoursesCatalog, getChemicalsCatalog, getProductsCatalog, getProductPriceRule, addCourseToProposal, addChemicalToProposal, addProductToProposal } from '../controllers/ProposalController'

const router = Router()

// Compat: existing frontend calls /propostas?userId=
router.get('/', getProposalsByUser)

// New: proposals by unidade id
router.get('/unidade/:unidade_id', getProposalsByUnidade)

// New: stats for commercial dashboard (counts + MoM trend)
router.get('/stats', getProposalStats)

// Catalogs
router.get('/catalog/cursos', getCoursesCatalog)
router.get('/catalog/quimicos', getChemicalsCatalog)
router.get('/catalog/produtos', getProductsCatalog)
router.get('/catalog/produtos/:produtoId/preco', getProductPriceRule)
// Insert item endpoints
router.post('/:id/cursos', addCourseToProposal)
router.post('/:id/quimicos', addChemicalToProposal)
router.post('/:id/produtos', addProductToProposal)
router.delete('/:id', deleteProposal)
router.get('/:id/cursos', getCursosByProposal)
router.get('/:id/quimicos', getQuimicosByProposal)
router.get('/:id/produtos', getProdutosByProposal)
router.get('/:id', getProposalById)

export default router
