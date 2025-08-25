// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'

const router = Router()

// Rotas com prefixos
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)

export default router