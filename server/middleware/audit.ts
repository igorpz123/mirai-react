import { Request, Response, NextFunction } from 'express';
import { auditService, AuditAction, EntityType } from '../services/auditService';

// =============================================
// Middleware de Auditoria Automática
// =============================================

/**
 * Middleware que registra automaticamente ações em rotas protegidas
 * Usa o método HTTP para inferir o tipo de ação
 */
export const auditMiddleware = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;

    // Skip se não houver usuário autenticado
    if (!userId) {
      return next();
    }

    // Mapear método HTTP para ação de auditoria
    const actionMap: Record<string, AuditAction> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
      GET: 'READ',
    };

    const action = actionMap[req.method] || 'READ';

    // Capturar resposta original
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let logged = false;

    // Interceptar res.json
    res.json = function (body: any) {
      if (!logged) {
        logged = true;
        logAction(req, res, action, entityType, body);
      }
      return originalJson(body);
    };

    // Interceptar res.send
    res.send = function (body: any) {
      if (!logged) {
        logged = true;
        logAction(req, res, action, entityType, body);
      }
      return originalSend(body);
    };

    next();
  };
};

/**
 * Função auxiliar para registrar ação
 */
async function logAction(
  req: Request,
  res: Response,
  action: AuditAction,
  entityType: EntityType,
  responseBody: any
) {
  const userId = (req as any).userId;
  const statusCode = res.statusCode;
  
  // Determinar status da ação
  const status = statusCode >= 200 && statusCode < 300 ? 'success' : 
                 statusCode >= 400 ? 'failure' : 'error';

  // Extrair ID da entidade da URL ou corpo da resposta
  const entityId = extractEntityId(req, responseBody);

  // Criar descrição legível
  const description = createDescription(action, entityType, req, responseBody);

  // Registrar no log
  await auditService.logFromRequest(req, action, entityType, description, {
    entityId,
    status,
    metadata: {
      statusCode,
      params: req.params,
      query: req.query,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    },
  });
}

/**
 * Extrai ID da entidade da requisição
 */
function extractEntityId(req: Request, responseBody: any): number | undefined {
  // Tentar extrair do parâmetro da URL
  if (req.params.id) {
    const id = parseInt(req.params.id);
    if (!isNaN(id)) return id;
  }

  // Tentar extrair de outros parâmetros comuns
  const idParams = ['tarefaId', 'propostaId', 'empresaId', 'usuarioId', 'unidadeId'];
  for (const param of idParams) {
    if (req.params[param]) {
      const id = parseInt(req.params[param]);
      if (!isNaN(id)) return id;
    }
  }

  // Tentar extrair do corpo da resposta (para CREATE)
  if (responseBody && typeof responseBody === 'object') {
    if (responseBody.id) return responseBody.id;
    if (responseBody.data?.id) return responseBody.data.id;
    if (responseBody.insertId) return responseBody.insertId;
  }

  return undefined;
}

/**
 * Cria descrição legível da ação
 */
function createDescription(
  action: AuditAction,
  entityType: EntityType,
  req: Request,
  responseBody: any
): string {
  // Descrições serão geradas dinamicamente pelo auditService com base no userId
  const userName = 'Usuário';

  const entityNames: Record<EntityType, string> = {
    task: 'tarefa',
    proposal: 'proposta',
    company: 'empresa',
    unit: 'unidade',
    user: 'usuário',
    permission: 'permissão',
    notification: 'notificação',
    document: 'documento',
    changelog: 'changelog',
    setor: 'setor',
    cargo: 'cargo',
    tipo_tarefa: 'tipo de tarefa',
    commercial_item: 'item comercial',
    agenda: 'agenda',
    auth: 'autenticação',
    system: 'sistema',
  };

  const entityName = entityNames[entityType] || entityType;
  const entityId = extractEntityId(req, responseBody);

  const actionDescriptions: Record<AuditAction, string> = {
    CREATE: `${userName} criou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    UPDATE: `${userName} atualizou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    DELETE: `${userName} deletou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    READ: `${userName} visualizou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    LOGIN: `${userName} fez login no sistema`,
    LOGOUT: `${userName} fez logout do sistema`,
    EXPORT: `${userName} exportou dados de ${entityName}`,
    IMPORT: `${userName} importou dados para ${entityName}`,
    APPROVE: `${userName} aprovou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    REJECT: `${userName} rejeitou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    ASSIGN: `${userName} atribuiu ${entityName}${entityId ? ` #${entityId}` : ''}`,
    UNASSIGN: `${userName} removeu atribuição de ${entityName}${entityId ? ` #${entityId}` : ''}`,
    ARCHIVE: `${userName} arquivou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    RESTORE: `${userName} restaurou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    UPLOAD: `${userName} fez upload em ${entityName}${entityId ? ` #${entityId}` : ''}`,
    DOWNLOAD: `${userName} fez download de ${entityName}${entityId ? ` #${entityId}` : ''}`,
    SHARE: `${userName} compartilhou ${entityName}${entityId ? ` #${entityId}` : ''}`,
    PERMISSION_CHANGE: `${userName} alterou permissões de ${entityName}${entityId ? ` #${entityId}` : ''}`,
  };

  return actionDescriptions[action] || `${userName} executou ${action} em ${entityName}`;
}

// =============================================
// Middleware para ações específicas
// =============================================

/**
 * Middleware para registrar login
 */
export const auditLogin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  
  if (userId) {
    await auditService.logFromRequest(req, 'LOGIN', 'auth', 'Login realizado no sistema', {
      metadata: {
        loginMethod: req.body.email ? 'email' : 'token',
      },
    });
  }

  next();
};

/**
 * Middleware para registrar logout
 */
export const auditLogout = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  
  if (userId) {
    await auditService.logFromRequest(req, 'LOGOUT', 'auth', 'Logout realizado do sistema');
  }

  next();
};

/**
 * Middleware para registrar mudanças de permissão
 */
export const auditPermissionChange = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  const cargoId = req.params.cargoId;

  if (userId && cargoId) {
    // Capturar resposta para ver se foi sucesso
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode === 200) {
        auditService.logFromRequest(req, 'PERMISSION_CHANGE', 'permission', 
          `Permissões do cargo #${cargoId} foram alteradas`,
          {
            entityId: parseInt(cargoId),
            metadata: {
              permissions: req.body.permissions,
            },
          }
        );
      }
      return originalJson(body);
    };
  }

  next();
};

/**
 * Middleware para registrar exports
 */
export const auditExport = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;

    if (userId) {
      await auditService.logFromRequest(req, 'EXPORT', entityType, 
        `Dados de ${entityType} foram exportados`,
        {
          metadata: {
            filters: req.query,
          },
        }
      );
    }

    next();
  };
};

/**
 * Middleware para registrar uploads
 */
export const auditUpload = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;

    if (userId && req.file) {
      await auditService.logFromRequest(req, 'UPLOAD', entityType, 
        `Upload de arquivo realizado em ${entityType}`,
        {
          entityId: extractEntityId(req, null),
          metadata: {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          },
        }
      );
    }

    next();
  };
};
