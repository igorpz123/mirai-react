import { Router } from 'express'
import { getUnidades } from '../controllers/UnidadeController'

const router = Router()

router.get('/', getUnidades)

export default router
