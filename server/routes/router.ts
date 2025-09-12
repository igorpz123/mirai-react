// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'
import authRoutes from './auth'
import empresaRoutes from './empresas'

const router = Router()

// Rotas com prefixos
router.use('/auth', authRoutes)
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)
router.use('/empresas', empresaRoutes)

export default router