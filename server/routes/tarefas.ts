// src/routes/tarefas.ts
import { Router } from 'express'
import {
  getAllTasks,
  getTaskById,
  getTaskByUser,
  getTaskByResponsavel,
  getTaskByUnidade,
  getTaskByUnidadeSetor,
  getTaskStatsByUnidade,
  getArquivosByTarefa,
  getTaskHistory,
  newTask,
  updateTaskResponsible
} from '../controllers/TaskController'

const router: Router = Router()

// Listar todas as tarefas
router.get('/', getAllTasks)

// Coletar tarefa por ID
router.get('/:tarefa_id', getTaskById)

// Coletar tarefas por usuário
router.get('/usuario/:usuario_id', getTaskByUser)

// Coletar tarefas pelo responsável da empresa
router.get('/responsavel/:responsavel_id', getTaskByResponsavel)

// Coletar tarefas por unidade
router.get('/unidade/:unidade_id', getTaskByUnidade)

// Estatísticas por unidade (contagens e tendências)
router.get('/unidade/:unidade_id/stats', getTaskStatsByUnidade)

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