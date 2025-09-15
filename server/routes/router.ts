// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'
import authRoutes from './auth'
import empresaRoutes from './empresas'
// Make sure the file 'setores.ts' exists in the same directory.
import setorRoutes from './setores'
import tipoTarefaRoutes from './tipo_tarefa'

const router = Router()

// Rotas com prefixos
router.use('/auth', authRoutes)
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)
router.use('/empresas', empresaRoutes)
router.use('/setores', setorRoutes)
router.use('/tipo_tarefa', tipoTarefaRoutes)

export default router