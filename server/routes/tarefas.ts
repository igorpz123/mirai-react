// src/routes/tarefas.ts
import { Router } from 'express'
import {
  getAllTasks,
  getTaskById,
  getTaskByUser,
  getTasksByEmpresa,
  getTaskByResponsavel,
  getTaskByUnidade,
  getTaskByUnidadeSetor,
  getTaskStatsByUnidade,
  getCompletedTasksByDayByUnidade,
  getTaskStatsByUsuario,
  getCompletedTasksByDayByUsuario,
  getArquivosByTarefa,
  getTaskHistory,
  newTask,
  updateTaskResponsible
} from '../controllers/TaskController'
import { getEventsByResponsavel } from '../controllers/AgendaController'

const router: Router = Router()

// Listar todas as tarefas
router.get('/', getAllTasks)

// Coletar tarefa por ID
router.get('/:tarefa_id', getTaskById)

// Alias path to match frontend route if requested
// ex: /technical/tarefa/:tarefa_id -> simply delegate to getTaskById
router.get('/technical/tarefa/:tarefa_id', getTaskById)

// Coletar tarefas por usuário
router.get('/usuario/:usuario_id', getTaskByUser)

// Coletar tarefas por empresa
router.get('/empresa/:empresa_id', getTasksByEmpresa)

// Coletar tarefas pelo responsável da empresa
router.get('/responsavel/:responsavel_id', getTaskByResponsavel)

// Coletar eventos da agenda por responsável
router.get('/agenda/responsavel/:responsavel_id', getEventsByResponsavel)

// Coletar tarefas por unidade
router.get('/unidade/:unidade_id', getTaskByUnidade)

// Estatísticas por unidade (contagens e tendências)
router.get('/unidade/:unidade_id/stats', getTaskStatsByUnidade)

// Tarefas concluídas por dia (por unidade)
router.get('/unidade/:unidade_id/completadas-dia', getCompletedTasksByDayByUnidade)
// Estatísticas por usuário (contagens e tendências)
router.get('/usuario/:usuario_id/stats', getTaskStatsByUsuario)

// Tarefas concluídas por dia (por usuário)
router.get('/usuario/:usuario_id/completadas-dia', getCompletedTasksByDayByUsuario)

// Coletar tarefas por unidade e setor
router.get('/unidade/:unidade_id/setor/:setor_id', getTaskByUnidadeSetor)

// Coletar arquivos de uma tarefa
router.get('/arquivos/:tarefa_id', getArquivosByTarefa)

// Coletar histórico de uma tarefa
router.get('/historico/:tarefa_id', getTaskHistory)

// Criar nova tarefa
router.post('/', newTask)

// Atualizar responsável pela tarefa
router.patch('/:tarefa_id/responsavel', updateTaskResponsible)

export default router