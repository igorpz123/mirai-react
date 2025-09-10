// src/routes/usuarios.ts
import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  getUserByUnidade,
  getUserBySetor,
  getUserByUnidadeSetor,
  getUserByCargo,
  getUsersByDepartmentAndUnit
} from '../controllers/UserController'

const router: Router = Router()

// Listar todos os usuários
router.get('/', getAllUsers)

// Buscar usuário por ID
router.get('/:id', getUserById)

// Buscar usuários pela unidade
router.get('/unidade/:unidade_id', getUserByUnidade) 

// Buscar usuários pelo setor
router.get('/setor/:setor_id', getUserBySetor)

// Buscar usuários pela unidade e setor
router.get('/unidade/:unidade_id/setor/:setor_id', getUsersByDepartmentAndUnit)

router.get('/usuarios/by-department-unit', getUsersByDepartmentAndUnit);

// Buscar usuários pelo cargo
router.get('/cargo/:cargo_id', getUserByCargo)

export default router
