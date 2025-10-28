import { Response } from 'express'
import { AuthRequest } from '../middleware/permissions'
import * as permissionService from '../services/permissionService'

// ==========================================
// GET /api/permissoes/me
// Retorna as permissões do usuário logado
// ==========================================

export const getMyPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Usuário não autenticado' })
      return
    }

    const permissions = await permissionService.getUserPermissions(req.userId)
    res.json(permissions)
  } catch (error) {
    console.error('[PermissionController] Erro ao buscar permissões:', error)
    res.status(500).json({ error: 'Erro ao buscar permissões' })
  }
}

// ==========================================
// GET /api/permissoes
// Lista todas as permissões disponíveis (ADMIN)
// ==========================================

export const getAllPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const permissions = await permissionService.getAllPermissions()
    res.json(permissions)
  } catch (error) {
    console.error('[PermissionController] Erro ao listar permissões:', error)
    res.status(500).json({ error: 'Erro ao listar permissões' })
  }
}

// ==========================================
// GET /api/permissoes/cargo/:cargoId
// Retorna as permissões de um cargo específico (ADMIN)
// ==========================================

export const getCargoPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cargoId = parseInt(req.params.cargoId)
    
    if (isNaN(cargoId)) {
      res.status(400).json({ error: 'ID de cargo inválido' })
      return
    }

    const permissions = await permissionService.getCargoPermissions(cargoId)
    res.json({ cargoId, permissions })
  } catch (error) {
    console.error('[PermissionController] Erro ao buscar permissões do cargo:', error)
    res.status(500).json({ error: 'Erro ao buscar permissões do cargo' })
  }
}

// ==========================================
// PUT /api/permissoes/cargo/:cargoId
// Atualiza as permissões de um cargo (ADMIN)
// Body: { permissions: ['admin', 'comercial'] }
// ==========================================

export const updateCargoPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cargoId = parseInt(req.params.cargoId)
    const { permissions } = req.body

    if (isNaN(cargoId)) {
      res.status(400).json({ error: 'ID de cargo inválido' })
      return
    }

    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: 'Campo "permissions" deve ser um array' })
      return
    }

    // Validar se todas as permissões existem
    const allPermissions = await permissionService.getAllPermissions()
    const validPermissionNames = allPermissions.map(p => p.nome)
    
    const invalidPermissions = permissions.filter(p => !validPermissionNames.includes(p))
    if (invalidPermissions.length > 0) {
      res.status(400).json({ 
        error: 'Permissões inválidas',
        invalidPermissions 
      })
      return
    }

    await permissionService.updateCargoPermissions(cargoId, permissions)
    
    res.json({ 
      success: true,
      message: 'Permissões do cargo atualizadas com sucesso',
      cargoId,
      permissions 
    })
  } catch (error) {
    console.error('[PermissionController] Erro ao atualizar permissões do cargo:', error)
    res.status(500).json({ error: 'Erro ao atualizar permissões do cargo' })
  }
}

// ==========================================
// POST /api/permissoes/cargo/:cargoId/add
// Adiciona uma permissão a um cargo (ADMIN)
// Body: { permission: 'comercial' }
// ==========================================

export const addPermissionToCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cargoId = parseInt(req.params.cargoId)
    const { permission } = req.body

    if (isNaN(cargoId)) {
      res.status(400).json({ error: 'ID de cargo inválido' })
      return
    }

    if (!permission || typeof permission !== 'string') {
      res.status(400).json({ error: 'Campo "permission" é obrigatório' })
      return
    }

    await permissionService.addPermissionToCargo(cargoId, permission)
    
    res.json({ 
      success: true,
      message: `Permissão '${permission}' adicionada ao cargo`,
      cargoId,
      permission 
    })
  } catch (error) {
    console.error('[PermissionController] Erro ao adicionar permissão:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao adicionar permissão' })
  }
}

// ==========================================
// DELETE /api/permissoes/cargo/:cargoId/:permission
// Remove uma permissão de um cargo (ADMIN)
// ==========================================

export const removePermissionFromCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cargoId = parseInt(req.params.cargoId)
    const { permission } = req.params

    if (isNaN(cargoId)) {
      res.status(400).json({ error: 'ID de cargo inválido' })
      return
    }

    if (!permission) {
      res.status(400).json({ error: 'Nome da permissão é obrigatório' })
      return
    }

    await permissionService.removePermissionFromCargo(cargoId, permission)
    
    res.json({ 
      success: true,
      message: `Permissão '${permission}' removida do cargo`,
      cargoId,
      permission 
    })
  } catch (error) {
    console.error('[PermissionController] Erro ao remover permissão:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao remover permissão' })
  }
}

// ==========================================
// GET /api/permissoes/cargos
// Lista todos os cargos com suas permissões (ADMIN)
// ==========================================

export const getAllCargosWithPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cargos = await permissionService.getAllCargosWithPermissions()
    res.json(cargos)
  } catch (error) {
    console.error('[PermissionController] Erro ao listar cargos com permissões:', error)
    res.status(500).json({ error: 'Erro ao listar cargos com permissões' })
  }
}

// ==========================================
// POST /api/permissoes/check
// Verifica se usuário tem uma ou mais permissões
// Body: { permissions: ['admin'] } ou { permission: 'admin' }
// ==========================================

export const checkUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Usuário não autenticado' })
      return
    }

    const { permission, permissions } = req.body

    if (permission) {
      // Verifica uma permissão específica
      const hasAccess = await permissionService.hasPermission(req.userId, permission)
      res.json({ 
        hasPermission: hasAccess,
        permission
      })
    } else if (Array.isArray(permissions)) {
      // Verifica múltiplas permissões
      const results: { [key: string]: boolean } = {}
      
      for (const perm of permissions) {
        results[perm] = await permissionService.hasPermission(req.userId, perm)
      }
      
      res.json({ 
        permissions: results,
        hasAny: Object.values(results).some(v => v),
        hasAll: Object.values(results).every(v => v)
      })
    } else {
      res.status(400).json({ error: 'Informe "permission" ou "permissions"' })
    }
  } catch (error) {
    console.error('[PermissionController] Erro ao verificar permissões:', error)
    res.status(500).json({ error: 'Erro ao verificar permissões' })
  }
}

// ==========================================
// DELETE /api/permissoes/cache
// Limpa o cache de permissões (ADMIN)
// ==========================================

export const clearCache = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body

    if (userId) {
      permissionService.clearPermissionsCache(parseInt(userId))
      res.json({ 
        success: true,
        message: `Cache do usuário ${userId} limpo com sucesso` 
      })
    } else {
      permissionService.clearPermissionsCache()
      res.json({ 
        success: true,
        message: 'Cache de permissões limpo com sucesso' 
      })
    }
  } catch (error) {
    console.error('[PermissionController] Erro ao limpar cache:', error)
    res.status(500).json({ error: 'Erro ao limpar cache' })
  }
}

// ==========================================
// EXPORT
// ==========================================

export default {
  getMyPermissions,
  getAllPermissions,
  getCargoPermissions,
  updateCargoPermissions,
  addPermissionToCargo,
  removePermissionFromCargo,
  getAllCargosWithPermissions,
  checkUserPermissions,
  clearCache
}
