import { useAuth } from './use-auth'

// ==========================================
// HOOK: usePermissions
// ==========================================

export function usePermissions() {
  const { user } = useAuth()
  const permissions = user?.permissions || []

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permissionName: string): boolean => {
    return permissions.includes(permissionName)
  }

  /**
   * Verifica se o usuário tem QUALQUER UMA das permissões listadas (OR)
   */
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(perm => permissions.includes(perm))
  }

  /**
   * Verifica se o usuário tem TODAS as permissões listadas (AND)
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(perm => permissions.includes(perm))
  }

  /**
   * Verifica se o usuário é admin
   */
  const isAdmin = hasPermission('admin')

  /**
   * Verifica se o usuário tem acesso comercial
   */
  const hasComercialAccess = hasAnyPermission(['admin', 'comercial'])

  /**
   * Verifica se o usuário tem acesso técnico
   */
  const hasTecnicoAccess = hasAnyPermission(['admin', 'tecnico'])

  /**
   * Retorna todas as permissões do usuário
   */
  const getAllPermissions = (): string[] => {
    return permissions
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    hasComercialAccess,
    hasTecnicoAccess,
    getAllPermissions,
  }
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default usePermissions
