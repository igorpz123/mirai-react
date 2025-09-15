import { Router } from 'express'
import { getTipoTarefa } from '../controllers/TipoTarefaController'

const router = Router()

router.get('/', getTipoTarefa)

export default router
