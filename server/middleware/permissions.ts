import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/auth'
import * as permissionService from '../services/permissionService'

// ==========================================
// INTERFACES
// ==========================================

export interface AuthRequest extends Request {
  userId?: number
  userPermissions?: string[]
}

interface JWTPayload {
  id: number
  email: string
  [key: string]: any
}

// ==========================================
// MIDDLEWARE: Extrair userId do token JWT
// ==========================================

export const extractUserId = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' })
      return
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload
    
    req.userId = decoded.id
    next()
  } catch (error) {
    console.error('[PermissionMiddleware] Erro ao verificar token:', error)
    res.status(401).json({ error: 'Token inválido' })
  }
}

// ==========================================
// MIDDLEWARE: Carregar permissões do usuário
// ==========================================

export const loadUserPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Usuário não autenticado' })
      return
    }

    const userPerms = await permissionService.getUserPermissions(req.userId)
    req.userPermissions = userPerms.permissions
    next()
  } catch (error) {
    console.error('[PermissionMiddleware] Erro ao carregar permissões:', error)
    res.status(500).json({ error: 'Erro ao carregar permissões' })
  }
}

// ==========================================
// MIDDLEWARE: Verificar permissão específica
// ==========================================

/**
 * Middleware para verificar se usuário tem uma permissão específica
 * @param permissionName Nome da permissão requerida
 */
export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const hasAccess = await permissionService.hasPermission(req.userId, permissionName)
      
      if (!hasAccess) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem a permissão '${permissionName}' necessária para acessar este recurso`
        })
        return
      }

      next()
    } catch (error) {
      console.error('[PermissionMiddleware] Erro ao verificar permissão:', error)
      res.status(500).json({ error: 'Erro ao verificar permissão' })
    }
  }
}

// ==========================================
// MIDDLEWARE: Verificar qualquer permissão da lista
// ==========================================

/**
 * Middleware para verificar se usuário tem PELO MENOS UMA das permissões
 * @param permissionNames Array de permissões (OR)
 */
export const requireAnyPermission = (permissionNames: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const hasAccess = await permissionService.hasAnyPermission(req.userId, permissionNames)
      
      if (!hasAccess) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você precisa de uma das seguintes permissões: ${permissionNames.join(', ')}`
        })
        return
      }

      next()
    } catch (error) {
      console.error('[PermissionMiddleware] Erro ao verificar permissões:', error)
      res.status(500).json({ error: 'Erro ao verificar permissões' })
    }
  }
}

// ==========================================
// MIDDLEWARE: Verificar todas as permissões
// ==========================================

/**
 * Middleware para verificar se usuário tem TODAS as permissões
 * @param permissionNames Array de permissões (AND)
 */
export const requireAllPermissions = (permissionNames: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const hasAccess = await permissionService.hasAllPermissions(req.userId, permissionNames)
      
      if (!hasAccess) {
        res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você precisa de todas as seguintes permissões: ${permissionNames.join(', ')}`
        })
        return
      }

      next()
    } catch (error) {
      console.error('[PermissionMiddleware] Erro ao verificar permissões:', error)
      res.status(500).json({ error: 'Erro ao verificar permissões' })
    }
  }
}

// ==========================================
// MIDDLEWARES ESPECÍFICOS (ALIASES)
// ==========================================

/**
 * Middleware para verificar se é admin
 */
export const requireAdmin = requirePermission('admin')

/**
 * Middleware para verificar acesso comercial (admin OU comercial)
 */
export const requireComercial = requireAnyPermission(['admin', 'comercial'])

/**
 * Middleware para verificar acesso técnico (admin OU tecnico)
 */
export const requireTecnico = requireAnyPermission(['admin', 'tecnico'])

// ==========================================
// HELPER: Verificar permissão dentro de controller
// ==========================================

/**
 * Helper para verificar permissão dentro de um controller
 * @param req Request com userId
 * @param permissionName Nome da permissão
 * @returns true se tem permissão, false caso contrário
 */
export async function checkPermission(req: AuthRequest, permissionName: string): Promise<boolean> {
  if (!req.userId) return false
  return permissionService.hasPermission(req.userId, permissionName)
}

/**
 * Helper para verificar se é admin dentro de um controller
 */
export async function checkIsAdmin(req: AuthRequest): Promise<boolean> {
  if (!req.userId) return false
  return permissionService.isAdmin(req.userId)
}

// ==========================================
// EXPORT
// ==========================================

export default {
  extractUserId,
  loadUserPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  requireComercial,
  requireTecnico,
  checkPermission,
  checkIsAdmin
}
