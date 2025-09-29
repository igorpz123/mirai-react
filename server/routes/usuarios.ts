// src/routes/usuarios.ts
import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  getUserByUnidade,
  getUserBySetor,
  getUserByUnidadeSetor,
  getUserByCargo,
  getUsersByDepartmentAndUnit,
  inactivateUser,
  updateUser,
  addUserSetores,
  addUserUnidades
} from '../controllers/UserController'
import { createUser } from '../controllers/UserController'
import { uploadUserPhoto } from '../controllers/UserController'
import { uploadUser } from '../middleware/upload'
import { removeUserSetor, removeUserUnidade } from '../controllers/UserController'

const router: Router = Router()

// Listar todos os usuários
router.get('/', getAllUsers)

// Criar novo usuário
router.post('/', createUser)

// Buscar usuários pela unidade
router.get('/unidade/:unidade_id', getUserByUnidade)

// Buscar usuários pelo setor
router.get('/setor/:setor_id', getUserBySetor)

// Buscar usuários pela unidade e setor
router.get('/unidade/:unidade_id/setor/:setor_id', getUsersByDepartmentAndUnit)

// Alternativa via query
router.get('/usuarios/by-department-unit', getUsersByDepartmentAndUnit)

// Buscar usuários pelo cargo
router.get('/cargo/:cargo_id', getUserByCargo)

// Inativar usuário (deve vir antes de ":id")
router.patch('/:id/inactivate', inactivateUser)

// Atualizar dados do usuário
router.put('/:id', updateUser)

// Upload de foto do usuário
router.post('/:id/photo', uploadUser.single('file'), uploadUserPhoto)

// Adicionar setores ao usuário
router.post('/:id/setores', addUserSetores)

// Adicionar unidades ao usuário
router.post('/:id/unidades', addUserUnidades)

// Remover setor e unidade
router.delete('/:id/setores/:setorId', removeUserSetor)
router.delete('/:id/unidades/:unidadeId', removeUserUnidade)

// Buscar usuário por ID (genérica por último)
router.get('/:id', getUserById)

export default router
