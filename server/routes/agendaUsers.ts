import { Router } from 'express'
import AgendaUsersController from '../controllers/AgendaUsersController'
import { requireAdmin } from '../middleware/permissions'

const router = Router()

// ==========================================
// ROTAS PÚBLICAS (para usuários logados)
// ==========================================

/**
 * GET /api/agenda-users/:unidadeId?
 * Busca usuários visíveis na agenda para uma unidade
 */
router.get('/:unidadeId?', AgendaUsersController.getVisibleUsers)

// ==========================================
// ROTAS ADMINISTRATIVAS
// ==========================================

/**
 * GET /api/agenda-users/config/all
 * Lista todas as configurações (admin only)
 */
router.get('/config/all', requireAdmin, AgendaUsersController.getAllConfigs)

/**
 * GET /api/agenda-users/stats
 * Estatísticas das configurações (admin only)
 */
router.get('/stats', requireAdmin, AgendaUsersController.getStats)

/**
 * POST /api/agenda-users
 * Adiciona usuário à agenda (admin only)
 */
router.post('/', requireAdmin, AgendaUsersController.addUser)

/**
 * POST /api/agenda-users/bulk
 * Atualização em lote (admin only)
 */
router.post('/bulk', requireAdmin, AgendaUsersController.bulkUpdate)

/**
 * PUT /api/agenda-users/:usuarioId/order
 * Atualiza ordem de um usuário (admin only)
 */
router.put('/:usuarioId/order', requireAdmin, AgendaUsersController.updateOrder)

/**
 * PUT /api/agenda-users/:usuarioId/activate
 * Ativa um usuário (admin only)
 */
router.put('/:usuarioId/activate', requireAdmin, AgendaUsersController.activateUser)

/**
 * DELETE /api/agenda-users/:usuarioId
 * Remove usuário da agenda (admin only)
 */
router.delete('/:usuarioId', requireAdmin, AgendaUsersController.removeUser)

/**
 * DELETE /api/agenda-users/config/:configId
 * Deleta configuração permanentemente (admin only)
 */
router.delete('/config/:configId', requireAdmin, AgendaUsersController.deleteConfig)

export default router
