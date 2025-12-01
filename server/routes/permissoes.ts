import { Router } from 'express'
import * as PermissionController from '../controllers/PermissionController'
import { extractUserId, requireAdmin } from '../middleware/permissions'
import { auditPermissionChange } from '../middleware/audit'

const router = Router()

// ==========================================
// ROTAS PÚBLICAS (AUTENTICADAS)
// ==========================================

// GET /api/permissoes/me - Minhas permissões
router.get('/me', extractUserId, PermissionController.getMyPermissions)

// POST /api/permissoes/check - Verificar se tenho permissão
router.post('/check', extractUserId, PermissionController.checkUserPermissions)

// ==========================================
// ROTAS ADMINISTRATIVAS (SOMENTE ADMIN)
// ==========================================

// GET /api/permissoes - Listar todas as permissões disponíveis
router.get('/', extractUserId, requireAdmin, PermissionController.getAllPermissions)

// GET /api/permissoes/cargos - Listar todos os cargos com permissões
router.get('/cargos', extractUserId, requireAdmin, PermissionController.getAllCargosWithPermissions)

// GET /api/permissoes/cargo/:cargoId - Permissões de um cargo específico
router.get('/cargo/:cargoId', extractUserId, requireAdmin, PermissionController.getCargoPermissions)

// PUT /api/permissoes/cargo/:cargoId - Atualizar permissões de um cargo
router.put('/cargo/:cargoId', extractUserId, requireAdmin, auditPermissionChange, PermissionController.updateCargoPermissions)

// POST /api/permissoes/cargo/:cargoId/add - Adicionar permissão a um cargo
router.post('/cargo/:cargoId/add', extractUserId, requireAdmin, auditPermissionChange, PermissionController.addPermissionToCargo)

// DELETE /api/permissoes/cargo/:cargoId/:permission - Remover permissão de um cargo
router.delete('/cargo/:cargoId/:permission', extractUserId, requireAdmin, auditPermissionChange, PermissionController.removePermissionFromCargo)

// DELETE /api/permissoes/cache - Limpar cache de permissões
router.delete('/cache', extractUserId, requireAdmin, PermissionController.clearCache)

export default router
