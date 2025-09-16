// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'
import authRoutes from './auth'
import empresaRoutes from './empresas'
import setorRoutes from './setores'
import tipoTarefaRoutes from './tipo_tarefa'
import propostaRoutes from './propostas'

const router = Router()

// Rotas com prefixos
router.use('/auth', authRoutes)
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)
router.use('/empresas', empresaRoutes)
router.use('/setores', setorRoutes)
router.use('/tipo_tarefa', tipoTarefaRoutes)
router.use('/propostas', propostaRoutes)

export default router