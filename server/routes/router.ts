// src/routes/router.ts
import { Router } from 'express'
import usuarioRoutes from './usuarios'
import tarefaRoutes from './tarefas'
import authRoutes from './auth'
import empresaRoutes from './empresas'
import setorRoutes from './setores'
import tipoTarefaRoutes from './tipo_tarefa'
import propostaRoutes from './propostas'
import unidadeRoutes from './unidades'
import cargoRoutes from './cargos'
import notificacaoRoutes from './notificacoes'
import comercialItemsRoutes from './comercial_items'
import livroRegistrosRoutes from './livro_registros'
import changelogRoutes from './changelog'
import relatoriosRoutes from './relatorios'
import aiRoutes from './ai'
import permissoesRoutes from './permissoes'

const router = Router()

// Rotas com prefixos
router.use('/auth', authRoutes)
router.use('/usuarios', usuarioRoutes)
router.use('/tarefas', tarefaRoutes)
router.use('/empresas', empresaRoutes)
router.use('/setores', setorRoutes)
router.use('/tipo_tarefa', tipoTarefaRoutes)
router.use('/propostas', propostaRoutes)
router.use('/unidades', unidadeRoutes)
router.use('/cargos', cargoRoutes)
router.use('/notificacoes', notificacaoRoutes)
router.use('/comercial', comercialItemsRoutes)
router.use('/livro_registros', livroRegistrosRoutes)
router.use('/changelog', changelogRoutes)
router.use('/relatorios', relatoriosRoutes)
router.use('/ai', aiRoutes)
router.use('/permissoes', permissoesRoutes)

export default router