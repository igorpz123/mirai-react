import { Router } from 'express'
import { listLivroRegistros, getLivroRegistroById, createLivroRegistro, updateLivroRegistro, deleteLivroRegistro } from '../controllers/LivroRegistrosController'

const router = Router()

// Endpoints CRUD
router.get('/', listLivroRegistros)
router.get('/:id', getLivroRegistroById)
router.post('/', createLivroRegistro)
router.put('/:id', updateLivroRegistro)
router.delete('/:id', deleteLivroRegistro)

export default router
