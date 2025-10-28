import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'

// ==========================================
// COMPONENTE: PermissionRoute
// Rota genérica que requer uma ou mais permissões
// ==========================================

interface PermissionRouteProps {
  children: React.ReactNode
  permission?: string // Permissão única requerida
  permissions?: string[] // Múltiplas permissões (OR)
  requireAll?: boolean // Se true, requer TODAS as permissões (AND)
  fallbackPath?: string // Caminho para redirecionar se não autorizado
}

export function PermissionRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  fallbackPath = '/'
}: PermissionRouteProps) {
  const { user } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  let hasAccess = false

  if (permission) {
    // Verifica permissão única
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    // Verifica múltiplas permissões
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    // Nenhuma permissão especificada, nega acesso
    hasAccess = false
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

// ==========================================
// COMPONENTE: ComercialRoute
// Requer acesso comercial (admin OU comercial)
// ==========================================

export function ComercialRoute({ children }: { children: React.ReactNode }) {
  return (
    <PermissionRoute permissions={['admin', 'comercial']}>
      {children}
    </PermissionRoute>
  )
}

// ==========================================
// COMPONENTE: TecnicoRoute
// Requer acesso técnico (admin OU tecnico)
// ==========================================

export function TecnicoRoute({ children }: { children: React.ReactNode }) {
  return (
    <PermissionRoute permissions={['admin', 'tecnico']}>
      {children}
    </PermissionRoute>
  )
}

// ==========================================
// COMPONENTE: PermissionGuard
// Componente para ocultar/mostrar conteúdo baseado em permissões
// (não redireciona, apenas mostra/oculta)
// ==========================================

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode // Conteúdo alternativo se não tiver permissão
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// ==========================================
// EXPORT
// ==========================================

export default PermissionRoute
