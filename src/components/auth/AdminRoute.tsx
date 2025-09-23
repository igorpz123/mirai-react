import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

function isAdminCargo(cargoId?: number | null): boolean {
  return cargoId === 1 || cargoId === 2 || cargoId === 3
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdminCargo(user.cargoId)) return <Navigate to="/" replace />
  return <>{children}</>
}

export function AdminOrSelfRoute({ children }: { children: React.ReactNode }) {
  const { id } = useParams()
  const uid = id ? Number(id) : NaN
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isAdminCargo(user.cargoId)) return <>{children}</>
  // allow self to access their own details page
  if (!Number.isNaN(uid) && user.id === uid) return <>{children}</>
  return <Navigate to="/" replace />
}

export default AdminRoute
