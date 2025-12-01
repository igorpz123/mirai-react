import { Request, Response } from 'express';
import { auditService, AuditLogFilters } from '../services/auditService';
import { handleControllerError } from '../utils/errorHandler';

// =============================================
// Controller de Auditoria
// =============================================

/**
 * Lista logs de auditoria com filtros e paginação
 * GET /api/auditoria
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const filters: AuditLogFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      action: req.query.action as any,
      entityType: req.query.entityType as any,
      entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
      status: req.query.status as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await auditService.getLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      totalPages: Math.ceil(result.total / (filters.limit || 50)),
    });
  } catch (error) {
    handleControllerError(error, res, 'getAuditLogs', 'Erro ao buscar logs de auditoria');
  }
};

/**
 * Busca log específico por ID
 * GET /api/auditoria/:id
 */
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const log = await auditService.getLogById(id);

    if (!log) {
      return res.status(404).json({ message: 'Log não encontrado' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    handleControllerError(error, res, 'getAuditLogById', 'Erro ao buscar log de auditoria');
  }
};

/**
 * Busca estatísticas de auditoria
 * GET /api/auditoria/stats
 */
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const stats = await auditService.getStats(filters);

    res.json({ success: true, data: stats });
  } catch (error) {
    handleControllerError(error, res, 'getAuditStats', 'Erro ao buscar estatísticas de auditoria');
  }
};

/**
 * Busca histórico de mudanças de uma entidade
 * GET /api/auditoria/history/:entityType/:entityId
 */
export const getEntityHistory = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const id = parseInt(entityId);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID da entidade inválido' });
    }

    const history = await auditService.getEntityHistory(entityType as any, id);

    res.json({ success: true, data: history });
  } catch (error) {
    handleControllerError(error, res, 'getEntityHistory', 'Erro ao buscar histórico da entidade');
  }
};

/**
 * Exporta logs para CSV
 * GET /api/auditoria/export
 */
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const filters: AuditLogFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      action: req.query.action as any,
      entityType: req.query.entityType as any,
      entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
      status: req.query.status as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    };

    const csv = await auditService.exportToCSV(filters);

    // Registrar ação de exportação
    const user = (req as any).user;
    await auditService.log({
      userId: user.id,
      userName: `${user.nome} ${user.sobrenome}`,
      userEmail: user.email,
      action: 'EXPORT',
      entityType: 'system',
      description: `${user.nome} ${user.sobrenome} exportou logs de auditoria`,
      metadata: { filters },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send('\uFEFF' + csv); // BOM para UTF-8
  } catch (error) {
    handleControllerError(error, res, 'exportAuditLogs', 'Erro ao exportar logs de auditoria');
  }
};

/**
 * Busca logs de um usuário específico
 * GET /api/auditoria/user/:userId
 */
export const getUserAuditLogs = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID do usuário inválido' });
    }

    const filters: AuditLogFilters = {
      userId,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await auditService.getLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    handleControllerError(error, res, 'getUserAuditLogs', 'Erro ao buscar logs do usuário');
  }
};

/**
 * Busca logs por tipo de ação
 * GET /api/auditoria/action/:action
 */
export const getAuditLogsByAction = async (req: Request, res: Response) => {
  try {
    const action = req.params.action;

    const filters: AuditLogFilters = {
      action: action as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await auditService.getLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    handleControllerError(error, res, 'getAuditLogsByAction', 'Erro ao buscar logs por ação');
  }
};

/**
 * Arquiva logs antigos (admin apenas)
 * POST /api/auditoria/archive
 */
export const archiveOldAuditLogs = async (req: Request, res: Response) => {
  try {
    const daysToKeep = req.body.daysToKeep || 730; // Padrão: 2 anos

    if (daysToKeep < 30) {
      return res.status(400).json({ 
        message: 'Período mínimo de retenção é 30 dias' 
      });
    }

    const archivedCount = await auditService.archiveOldLogs(daysToKeep);

    // Registrar ação
    const user = (req as any).user;
    await auditService.log({
      userId: user.id,
      userName: `${user.nome} ${user.sobrenome}`,
      userEmail: user.email,
      action: 'ARCHIVE',
      entityType: 'system',
      description: `${user.nome} ${user.sobrenome} arquivou ${archivedCount} logs antigos`,
      metadata: { daysToKeep, archivedCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
    });

    res.json({
      success: true,
      message: `${archivedCount} logs arquivados com sucesso`,
      archivedCount,
    });
  } catch (error) {
    handleControllerError(error, res, 'archiveOldAuditLogs', 'Erro ao arquivar logs antigos');
  }
};

/**
 * Busca logs de atividades recentes (dashboard)
 * GET /api/auditoria/recent
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const filters: AuditLogFilters = {
      limit,
      offset: 0,
    };

    const result = await auditService.getLogs(filters);

    res.json({
      success: true,
      data: result.logs,
    });
  } catch (error) {
    handleControllerError(error, res, 'getRecentActivity', 'Erro ao buscar atividades recentes');
  }
};
