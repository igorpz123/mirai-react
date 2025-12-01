import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { Request } from 'express';

// =============================================
// Tipos e Interfaces
// =============================================

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'READ'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'SHARE'
  | 'PERMISSION_CHANGE';

export type EntityType = 
  | 'task'
  | 'proposal'
  | 'company'
  | 'unit'
  | 'user'
  | 'permission'
  | 'notification'
  | 'document'
  | 'changelog'
  | 'setor'
  | 'cargo'
  | 'tipo_tarefa'
  | 'commercial_item'
  | 'agenda'
  | 'auth'
  | 'system';

export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLogEntry {
  userId: number;
  userName: string;
  userEmail: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: number | null;
  description: string;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
  status?: AuditStatus;
  errorMessage?: string | null;
}

export interface AuditLogRecord extends AuditLogEntry {
  id: number;
  created_at: string;
}

export interface AuditLogFilters {
  userId?: number;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: number;
  status?: AuditStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByUser: Array<{ user_name: string; total: number }>;
  logsByDate: Array<{ date: string; total: number }>;
  successRate: number;
}

// =============================================
// Serviço de Auditoria
// =============================================

class AuditService {
  /**
   * Registra uma ação no log de auditoria
   */
  async log(entry: AuditLogEntry): Promise<number> {
    try {
      const [result] = await pool.execute(
        `INSERT INTO audit_logs (
          user_id, user_name, user_email, action, entity_type, entity_id,
          description, changes, metadata, ip_address, user_agent,
          request_method, request_path, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.userId,
          entry.userName,
          entry.userEmail,
          entry.action,
          entry.entityType,
          entry.entityId || null,
          entry.description,
          entry.changes ? JSON.stringify(entry.changes) : null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.requestMethod || null,
          entry.requestPath || null,
          entry.status || 'success',
          entry.errorMessage || null,
        ]
      );

      return (result as any).insertId;
    } catch (error) {
      console.error('[AuditService] Erro ao registrar log:', error);
      // Não queremos que falha no log de auditoria quebre a aplicação
      return 0;
    }
  }

  /**
   * Registra ação a partir de uma requisição Express
   */
  async logFromRequest(
    req: Request,
    action: AuditAction,
    entityType: EntityType,
    description: string,
    options?: {
      entityId?: number;
      changes?: Record<string, any>;
      metadata?: Record<string, any>;
      status?: AuditStatus;
      errorMessage?: string;
    }
  ): Promise<number> {
    const user = (req as any).user;
    const userId = (req as any).userId;
    
    // Se não tem nem user nem userId, não pode logar
    if (!user && !userId) {
      console.warn('[AuditService] Tentativa de log sem usuário autenticado');
      return 0;
    }

    // Se tem user completo, usa direto
    if (user) {
      return this.log({
        userId: user.id,
        userName: `${user.nome} ${user.sobrenome}`,
        userEmail: user.email,
        action,
        entityType,
        entityId: options?.entityId,
        description,
        changes: options?.changes,
        metadata: options?.metadata,
        ipAddress: this.getIpAddress(req),
        userAgent: req.get('user-agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        status: options?.status || 'success',
        errorMessage: options?.errorMessage,
      });
    }

    // Se só tem userId, busca dados do usuário do banco
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, nome, sobrenome, email FROM usuarios WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) {
        console.warn(`[AuditService] Usuário #${userId} não encontrado`);
        return 0;
      }

      const userData = rows[0];
      return this.log({
        userId: userData.id,
        userName: `${userData.nome} ${userData.sobrenome}`,
        userEmail: userData.email,
        action,
        entityType,
        entityId: options?.entityId,
        description,
        changes: options?.changes,
        metadata: options?.metadata,
        ipAddress: this.getIpAddress(req),
        userAgent: req.get('user-agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        status: options?.status || 'success',
        errorMessage: options?.errorMessage,
      });
    } catch (error) {
      console.error('[AuditService] Erro ao buscar dados do usuário:', error);
      return 0;
    }
  }

  /**
   * Busca logs com filtros
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<{
    logs: AuditLogRecord[];
    total: number;
  }> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.userId) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }

    if (filters.entityType) {
      conditions.push('entity_type = ?');
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      conditions.push('entity_id = ?');
      params.push(filters.entityId);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push('created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('created_at <= ?');
      params.push(filters.endDate);
    }

    if (filters.search) {
      conditions.push('(description LIKE ? OR user_name LIKE ? OR user_email LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.join(' AND ');

    // Contar total
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Buscar logs com paginação
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, user_id, user_name, user_email, action, entity_type, entity_id,
        description, changes, metadata, ip_address, user_agent,
        request_method, request_path, status, error_message, created_at
      FROM audit_logs 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const logs = rows.map(row => ({
      ...row,
      changes: row.changes ? JSON.parse(row.changes) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    })) as AuditLogRecord[];

    return { logs, total };
  }

  /**
   * Busca um log específico por ID
   */
  async getLogById(id: number): Promise<AuditLogRecord | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, user_id, user_name, user_email, action, entity_type, entity_id,
        description, changes, metadata, ip_address, user_agent,
        request_method, request_path, status, error_message, created_at
      FROM audit_logs 
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      changes: row.changes ? JSON.parse(row.changes) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    } as AuditLogRecord;
  }

  /**
   * Busca estatísticas de auditoria
   */
  async getStats(filters?: { startDate?: string; endDate?: string }): Promise<AuditLogStats> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters?.startDate) {
      conditions.push('created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push('created_at <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.join(' AND ');

    // Total de logs
    const [totalResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      params
    );

    // Logs por ação
    const [actionResult] = await pool.execute<RowDataPacket[]>(
      `SELECT action, COUNT(*) as count FROM audit_logs WHERE ${whereClause} GROUP BY action`,
      params
    );
    const logsByAction = Object.fromEntries(
      actionResult.map(row => [row.action, row.count])
    );

    // Logs por entidade
    const [entityResult] = await pool.execute<RowDataPacket[]>(
      `SELECT entity_type, COUNT(*) as count FROM audit_logs WHERE ${whereClause} GROUP BY entity_type`,
      params
    );
    const logsByEntity = Object.fromEntries(
      entityResult.map(row => [row.entity_type, row.count])
    );

    // Logs por usuário (top 10)
    const [userResult] = await pool.execute<RowDataPacket[]>(
      `SELECT user_name, COUNT(*) as total 
       FROM audit_logs 
       WHERE ${whereClause}
       GROUP BY user_name 
       ORDER BY total DESC 
       LIMIT 10`,
      params
    );

    // Logs por data (últimos 30 dias)
    const [dateResult] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as total 
       FROM audit_logs 
       WHERE ${whereClause}
       GROUP BY DATE(created_at) 
       ORDER BY date DESC 
       LIMIT 30`,
      params
    );

    // Taxa de sucesso
    const [successResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count
       FROM audit_logs 
       WHERE ${whereClause}`,
      params
    );
    const successRate = successResult[0].total > 0
      ? (successResult[0].success_count / successResult[0].total) * 100
      : 100;

    return {
      totalLogs: totalResult[0].total,
      logsByAction,
      logsByEntity,
      logsByUser: userResult as Array<{ user_name: string; total: number }>,
      logsByDate: dateResult as Array<{ date: string; total: number }>,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Busca histórico de mudanças de uma entidade específica
   */
  async getEntityHistory(entityType: EntityType, entityId: number): Promise<AuditLogRecord[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        id, user_id, user_name, user_email, action, entity_type, entity_id,
        description, changes, metadata, ip_address, user_agent,
        request_method, request_path, status, error_message, created_at
      FROM audit_logs 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC`,
      [entityType, entityId]
    );

    return rows.map(row => ({
      ...row,
      changes: row.changes ? JSON.parse(row.changes) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    })) as AuditLogRecord[];
  }

  /**
   * Exporta logs para CSV
   */
  async exportToCSV(filters: AuditLogFilters = {}): Promise<string> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 });

    const headers = [
      'ID', 'Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 
      'ID Entidade', 'Descrição', 'Status', 'IP', 'Método', 'Path'
    ];

    const rows = logs.map(log => [
      log.id,
      log.created_at,
      log.userName,
      log.userEmail,
      log.action,
      log.entityType,
      log.entityId || '',
      `"${log.description.replace(/"/g, '""')}"`, // Escape aspas
      log.status,
      log.ipAddress || '',
      log.requestMethod || '',
      log.requestPath || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Cria helper para rastrear mudanças em updates
   */
  detectChanges(before: Record<string, any>, after: Record<string, any>): Record<string, any> | null {
    const changes: Record<string, any> = {};
    let hasChanges = false;

    for (const key in after) {
      if (before[key] !== after[key]) {
        changes[key] = {
          before: before[key],
          after: after[key],
        };
        hasChanges = true;
      }
    }

    return hasChanges ? changes : null;
  }

  /**
   * Extrai IP da requisição (suporta proxies)
   */
  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  async archiveOldLogs(daysToKeep: number = 730): Promise<number> {
    const [result] = await pool.execute(
      `DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );
    return (result as any).affectedRows;
  }
}

// =============================================
// Singleton Export
// =============================================

export const auditService = new AuditService();
