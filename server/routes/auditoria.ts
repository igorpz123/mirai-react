import { Router } from 'express';
import { extractUserId, requireAdmin } from '../middleware/permissions';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditStats,
  getEntityHistory,
  exportAuditLogs,
  getUserAuditLogs,
  getAuditLogsByAction,
  archiveOldAuditLogs,
  getRecentActivity,
} from '../controllers/AuditController';
import { auditExport } from '../middleware/audit';

const router = Router();

// Todas as rotas requerem autenticação e permissão de admin
router.use(extractUserId);
router.use(requireAdmin);

// =============================================
// Rotas de Consulta
// =============================================

// Listar logs com filtros e paginação
router.get('/', getAuditLogs);

// Estatísticas de auditoria
router.get('/stats', getAuditStats);

// Atividades recentes (para dashboard)
router.get('/recent', getRecentActivity);

// Buscar log específico por ID
router.get('/:id', getAuditLogById);

// Histórico de uma entidade específica
router.get('/history/:entityType/:entityId', getEntityHistory);

// Logs de um usuário específico
router.get('/user/:userId', getUserAuditLogs);

// Logs por tipo de ação
router.get('/action/:action', getAuditLogsByAction);

// =============================================
// Rotas de Ação
// =============================================

// Exportar logs para CSV
router.get('/export/csv', auditExport('system'), exportAuditLogs);

// Arquivar logs antigos (manutenção)
router.post('/archive', archiveOldAuditLogs);

export default router;
