import { Router } from 'express'
import AgendaUsersController from '../controllers/AgendaUsersController'
import { requireAdmin, extractUserId } from '../middleware/permissions'

const router = Router()

// ==========================================
// ROTAS ADMINISTRATIVAS
// ⚠️ IMPORTANTE: Estas rotas devem vir ANTES das rotas com parâmetros dinâmicos
// ==========================================

/**
 * GET /api/agenda-users/config/all
 * Lista todas as configurações (admin only)
 */
router.get('/config/all', extractUserId, requireAdmin, AgendaUsersController.getAllConfigs)

/**
 * GET /api/agenda-users/stats
 * Estatísticas das configurações (admin only)
 */
router.get('/stats', extractUserId, requireAdmin, AgendaUsersController.getStats)

// ==========================================
// ROTAS PÚBLICAS (para usuários logados)
// ⚠️ IMPORTANTE: Rota com parâmetro opcional deve vir DEPOIS das rotas específicas
// ==========================================

/**
 * GET /api/agenda-users/:unidadeId?
 * Busca usuários visíveis na agenda para uma unidade
 */
router.get('/:unidadeId?', AgendaUsersController.getVisibleUsers)

/**
 * POST /api/agenda-users
 * Adiciona usuário à agenda (admin only)
 */
router.post('/', extractUserId, requireAdmin, AgendaUsersController.addUser)

/**
 * POST /api/agenda-users/bulk
 * Atualização em lote (admin only)
 */
router.post('/bulk', extractUserId, requireAdmin, AgendaUsersController.bulkUpdate)

/**
 * PUT /api/agenda-users/:usuarioId/order
 * Atualiza ordem de um usuário (admin only)
 */
router.put('/:usuarioId/order', extractUserId, requireAdmin, AgendaUsersController.updateOrder)

/**
 * PUT /api/agenda-users/:usuarioId/activate
 * Ativa um usuário (admin only)
 */
router.put('/:usuarioId/activate', extractUserId, requireAdmin, AgendaUsersController.activateUser)

/**
 * DELETE /api/agenda-users/:usuarioId
 * Remove usuário da agenda (admin only)
 */
router.delete('/:usuarioId', extractUserId, requireAdmin, AgendaUsersController.removeUser)

/**
 * DELETE /api/agenda-users/config/:configId
 * Deleta configuração permanentemente (admin only)
 */
router.delete('/config/:configId', extractUserId, requireAdmin, AgendaUsersController.deleteConfig)

export default router
