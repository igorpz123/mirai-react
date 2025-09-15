import { Router } from 'express'
import { getSetores } from '../controllers/SetorController'

const router = Router()

router.get('/', getSetores)

export default router
