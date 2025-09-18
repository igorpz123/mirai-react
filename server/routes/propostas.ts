import { Router } from 'express'
import { getProposalsByUnidade, getProposalsByUser, getProposalStats, deleteProposal, getProposalById, getCursosByProposal, getQuimicosByProposal, getProdutosByProposal, getCoursesCatalog, getChemicalsCatalog, getProductsCatalog, getProductPriceRule, addCourseToProposal, addChemicalToProposal, addProductToProposal, updateProposalStatus, getProposalHistory, createProposal, getProgramsCatalog, getProgramPriceRule, getProgramasByProposal, addProgramToProposal, deleteCourseFromProposal, deleteChemicalFromProposal, deleteProductFromProposal, deleteProgramFromProposal, addProposalObservation } from '../controllers/ProposalController'

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
// programas prevencao
router.get('/catalog/programas', getProgramsCatalog)
router.get('/catalog/programas/:programaId/preco', getProgramPriceRule)
// Insert item endpoints
router.post('/', createProposal)
router.post('/:id/cursos', addCourseToProposal)
router.post('/:id/quimicos', addChemicalToProposal)
router.post('/:id/produtos', addProductToProposal)
router.post('/:id/programas', addProgramToProposal)
// Delete individual items
router.delete('/:id/cursos/:itemId', deleteCourseFromProposal)
router.delete('/:id/quimicos/:itemId', deleteChemicalFromProposal)
router.delete('/:id/produtos/:itemId', deleteProductFromProposal)
router.delete('/:id/programas/:itemId', deleteProgramFromProposal)
// Update proposal status
router.patch('/:id/status', updateProposalStatus)
// Add observation to proposal history
router.post('/:id/observacoes', addProposalObservation)
// Proposal history
router.get('/:id/historico', getProposalHistory)
router.delete('/:id', deleteProposal)
router.get('/:id/cursos', getCursosByProposal)
router.get('/:id/quimicos', getQuimicosByProposal)
router.get('/:id/produtos', getProdutosByProposal)
router.get('/:id/programas', getProgramasByProposal)
router.get('/:id', getProposalById)

export default router
