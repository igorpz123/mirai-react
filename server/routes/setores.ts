import { Router } from 'express'
import { getSetores, getSetorById, createSetor, updateSetor, deleteSetor } from '../controllers/SetorController'

const router = Router()

router.get('/', getSetores)
router.get('/:id', getSetorById)
router.post('/', createSetor)
router.put('/:id', updateSetor)
router.delete('/:id', deleteSetor)

export default router
