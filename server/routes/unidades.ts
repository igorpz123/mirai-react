import { Router } from 'express'
import { getUnidades, getUnidadeById, createUnidade, updateUnidade, deleteUnidade } from '../controllers/UnidadeController'

const router = Router()

router.get('/', getUnidades)
router.get('/:id', getUnidadeById)
router.post('/', createUnidade)
router.put('/:id', updateUnidade)
router.delete('/:id', deleteUnidade)

export default router
