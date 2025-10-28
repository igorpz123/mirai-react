import pool from '../config/db'
import { RowDataPacket } from 'mysql2'

// ==========================================
// INTERFACES
// ==========================================

export interface Permission {
  id: number
  nome: string
  descricao: string | null
  created_at: string
  updated_at: string
}

export interface UserPermissions {
  userId: number
  cargoId: number
  permissions: string[] // Array de nomes de permissões: ['admin', 'comercial', 'tecnico']
}

export interface CargoPermission {
  cargoId: number
  cargoNome: string
  permissions: string[]
}

// ==========================================
// CACHE DE PERMISSÕES
// ==========================================
// Cache em memória para evitar consultas repetidas ao banco
// TTL: 5 minutos

interface CacheEntry {
  data: UserPermissions
  timestamp: number
}

const permissionsCache = new Map<number, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

function getCachedPermissions(userId: number): UserPermissions | null {
  const cached = permissionsCache.get(userId)
  if (!cached) return null

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL
  if (isExpired) {
    permissionsCache.delete(userId)
    return null
  }

  return cached.data
}

function setCachedPermissions(userId: number, permissions: UserPermissions): void {
  permissionsCache.set(userId, {
    data: permissions,
    timestamp: Date.now()
  })
}

export function clearPermissionsCache(userId?: number): void {
  if (userId) {
    permissionsCache.delete(userId)
  } else {
    permissionsCache.clear()
  }
}

// ==========================================
// FUNÇÕES PRINCIPAIS
// ==========================================

/**
 * Busca todas as permissões de um usuário
 */
export async function getUserPermissions(userId: number): Promise<UserPermissions> {
  // Verificar cache primeiro
  const cached = getCachedPermissions(userId)
  if (cached) {
    return cached
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT
        u.id AS userId,
        u.cargo_id AS cargoId,
        p.nome AS permissao
      FROM usuarios u
      INNER JOIN cargo_permissoes cp ON u.cargo_id = cp.cargo_id
      INNER JOIN permissoes p ON cp.permissao_id = p.id
      WHERE u.id = ?`,
      [userId]
    )

    if (rows.length === 0) {
      // Usuário sem permissões
      const result: UserPermissions = {
        userId,
        cargoId: 0,
        permissions: []
      }
      setCachedPermissions(userId, result)
      return result
    }

    const result: UserPermissions = {
      userId,
      cargoId: rows[0].cargoId,
      permissions: rows.map(row => row.permissao)
    }

    // Armazenar no cache
    setCachedPermissions(userId, result)

    return result
  } catch (error) {
    console.error('[PermissionService] Erro ao buscar permissões do usuário:', error)
    throw new Error('Erro ao buscar permissões')
  }
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function hasPermission(userId: number, permissionName: string): Promise<boolean> {
  try {
    const userPerms = await getUserPermissions(userId)
    return userPerms.permissions.includes(permissionName)
  } catch (error) {
    console.error('[PermissionService] Erro ao verificar permissão:', error)
    return false
  }
}

/**
 * Verifica se um usuário tem QUALQUER UMA das permissões listadas
 */
export async function hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
  try {
    const userPerms = await getUserPermissions(userId)
    return permissionNames.some(perm => userPerms.permissions.includes(perm))
  } catch (error) {
    console.error('[PermissionService] Erro ao verificar permissões:', error)
    return false
  }
}

/**
 * Verifica se um usuário tem TODAS as permissões listadas
 */
export async function hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
  try {
    const userPerms = await getUserPermissions(userId)
    return permissionNames.every(perm => userPerms.permissions.includes(perm))
  } catch (error) {
    console.error('[PermissionService] Erro ao verificar permissões:', error)
    return false
  }
}

/**
 * Verifica se usuário é admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  return hasPermission(userId, 'admin')
}

/**
 * Verifica se usuário tem acesso comercial
 */
export async function hasComercialAccess(userId: number): Promise<boolean> {
  return hasAnyPermission(userId, ['admin', 'comercial'])
}

/**
 * Verifica se usuário tem acesso técnico
 */
export async function hasTecnicoAccess(userId: number): Promise<boolean> {
  return hasAnyPermission(userId, ['admin', 'tecnico'])
}

// ==========================================
// FUNÇÕES DE GERENCIAMENTO (ADMIN)
// ==========================================

/**
 * Lista todas as permissões disponíveis
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM permissoes ORDER BY nome'
    )
    return rows as Permission[]
  } catch (error) {
    console.error('[PermissionService] Erro ao listar permissões:', error)
    throw new Error('Erro ao listar permissões')
  }
}

/**
 * Busca permissões de um cargo específico
 */
export async function getCargoPermissions(cargoId: number): Promise<string[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.nome
      FROM cargo_permissoes cp
      INNER JOIN permissoes p ON cp.permissao_id = p.id
      WHERE cp.cargo_id = ?
      ORDER BY p.nome`,
      [cargoId]
    )
    return rows.map(row => row.nome)
  } catch (error) {
    console.error('[PermissionService] Erro ao buscar permissões do cargo:', error)
    throw new Error('Erro ao buscar permissões do cargo')
  }
}

/**
 * Atualiza as permissões de um cargo
 * @param cargoId ID do cargo
 * @param permissionNames Array com nomes das permissões
 */
export async function updateCargoPermissions(
  cargoId: number,
  permissionNames: string[]
): Promise<void> {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()

    // Remover todas as permissões atuais do cargo
    await connection.query('DELETE FROM cargo_permissoes WHERE cargo_id = ?', [cargoId])

    // Adicionar novas permissões
    if (permissionNames.length > 0) {
      const placeholders = permissionNames.map(() => '?').join(',')
      const [permissions] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM permissoes WHERE nome IN (${placeholders})`,
        permissionNames
      )

      const values = permissions.map(p => [cargoId, p.id])
      if (values.length > 0) {
        await connection.query(
          'INSERT INTO cargo_permissoes (cargo_id, permissao_id) VALUES ?',
          [values]
        )
      }
    }

    await connection.commit()

    // Limpar cache de todos os usuários deste cargo
    // (não temos uma forma eficiente de saber quais usuários, então limpamos tudo)
    clearPermissionsCache()

    console.log(`[PermissionService] Permissões do cargo ${cargoId} atualizadas:`, permissionNames)
  } catch (error) {
    await connection.rollback()
    console.error('[PermissionService] Erro ao atualizar permissões do cargo:', error)
    throw new Error('Erro ao atualizar permissões do cargo')
  } finally {
    connection.release()
  }
}

/**
 * Adiciona uma permissão a um cargo
 */
export async function addPermissionToCargo(cargoId: number, permissionName: string): Promise<void> {
  try {
    const [permission] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM permissoes WHERE nome = ?',
      [permissionName]
    )

    if (permission.length === 0) {
      throw new Error(`Permissão '${permissionName}' não encontrada`)
    }

    await pool.query(
      'INSERT IGNORE INTO cargo_permissoes (cargo_id, permissao_id) VALUES (?, ?)',
      [cargoId, permission[0].id]
    )

    clearPermissionsCache()
    console.log(`[PermissionService] Permissão '${permissionName}' adicionada ao cargo ${cargoId}`)
  } catch (error) {
    console.error('[PermissionService] Erro ao adicionar permissão:', error)
    throw error
  }
}

/**
 * Remove uma permissão de um cargo
 */
export async function removePermissionFromCargo(cargoId: number, permissionName: string): Promise<void> {
  try {
    const [permission] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM permissoes WHERE nome = ?',
      [permissionName]
    )

    if (permission.length === 0) {
      throw new Error(`Permissão '${permissionName}' não encontrada`)
    }

    await pool.query(
      'DELETE FROM cargo_permissoes WHERE cargo_id = ? AND permissao_id = ?',
      [cargoId, permission[0].id]
    )

    clearPermissionsCache()
    console.log(`[PermissionService] Permissão '${permissionName}' removida do cargo ${cargoId}`)
  } catch (error) {
    console.error('[PermissionService] Erro ao remover permissão:', error)
    throw error
  }
}

/**
 * Lista todos os cargos com suas permissões
 */
export async function getAllCargosWithPermissions(): Promise<CargoPermission[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        c.id AS cargoId,
        c.nome AS cargoNome,
        GROUP_CONCAT(p.nome ORDER BY p.nome SEPARATOR ',') AS permissions
      FROM cargos c
      LEFT JOIN cargo_permissoes cp ON c.id = cp.cargo_id
      LEFT JOIN permissoes p ON cp.permissao_id = p.id
      GROUP BY c.id, c.nome
      ORDER BY c.id`
    )

    return rows.map(row => ({
      cargoId: row.cargoId,
      cargoNome: row.cargoNome,
      permissions: row.permissions ? row.permissions.split(',') : []
    }))
  } catch (error) {
    console.error('[PermissionService] Erro ao listar cargos com permissões:', error)
    throw new Error('Erro ao listar cargos com permissões')
  }
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  hasComercialAccess,
  hasTecnicoAccess,
  getAllPermissions,
  getCargoPermissions,
  updateCargoPermissions,
  addPermissionToCargo,
  removePermissionFromCargo,
  getAllCargosWithPermissions,
  clearPermissionsCache
}
