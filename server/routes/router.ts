// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'
import authRoutes from './auth'

const router = Router()

// Rotas com prefixos
router.use('/auth', authRoutes)
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)

export default router