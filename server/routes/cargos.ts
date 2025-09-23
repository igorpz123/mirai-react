import { Router } from 'express'
import { getCargos } from '../controllers/CargoController'

const router = Router()

router.get('/', getCargos)

export default router
