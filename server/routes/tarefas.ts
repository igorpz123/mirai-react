// src/routes/tarefas.ts
import { Router } from 'express'
import { uploadTarefa } from '../middleware/upload'
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
  getRecentTasksByUsuario,
  getArquivosByTarefa,
  getTaskHistory,
  rateTaskHistory,
  newTask,
  updateTaskResponsible,
  updateTask,
  addTaskObservation,
  uploadArquivoTarefa,
  deleteArquivoTarefa
} from '../controllers/TaskController'
import { getEventsByResponsavel, updateAgendaEvent } from '../controllers/AgendaController'

const router: Router = Router()

// Listar todas as tarefas
router.get('/', getAllTasks)

// Alias path to match frontend route if requested
// ex: /technical/tarefa/:tarefa_id -> simply delegate to getTaskById
router.get('/technical/tarefa/:tarefa_id', getTaskById)

// Coletar tarefa por ID
router.get('/:tarefa_id', getTaskById)

// Coletar tarefas por usuário
router.get('/usuario/:usuario_id', getTaskByUser)

// Coletar tarefas por empresa
router.get('/empresa/:empresa_id', getTasksByEmpresa)

// Coletar tarefas pelo responsável da empresa
router.get('/responsavel/:responsavel_id', getTaskByResponsavel)

// Coletar eventos da agenda por responsável
router.get('/agenda/responsavel/:responsavel_id', getEventsByResponsavel)
// Atualizar horário/data de um evento da agenda
router.put('/agenda/evento/:id', updateAgendaEvent)

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

// Tarefas recentemente alteradas pelo usuário (actor no histórico)
router.get('/usuario/:usuario_id/recentes', getRecentTasksByUsuario)

// Coletar tarefas por unidade e setor
router.get('/unidade/:unidade_id/setor/:setor_id', getTaskByUnidadeSetor)

// Coletar arquivos de uma tarefa
router.get('/arquivos/:tarefa_id', getArquivosByTarefa)
// Upload de arquivo para tarefa
router.post('/:tarefa_id/arquivos', uploadTarefa.single('file'), uploadArquivoTarefa)
// Remover arquivo de tarefa
router.delete('/:tarefa_id/arquivos/:arquivo_id', deleteArquivoTarefa)

// Coletar histórico de uma tarefa
router.get('/historico/:tarefa_id', getTaskHistory)

// Adicionar observação ao histórico da tarefa
router.post('/:tarefa_id/observacoes', addTaskObservation)

// Avaliar uma entrada de histórico (admin only)
router.post('/historico/:historico_id/avaliar', rateTaskHistory)

// Criar nova tarefa
router.post('/', newTask)

// Atualizar responsável pela tarefa
router.patch('/:tarefa_id/responsavel', updateTaskResponsible)

// Atualizar campos da tarefa (status, setor, responsavel, etc.)
router.put('/:tarefa_id', updateTask)

export default router