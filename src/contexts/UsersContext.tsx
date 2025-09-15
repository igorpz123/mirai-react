import React from 'react'
import type { User } from '@/services/users'
import { getUsersByUnitId, getAllUsers } from '@/services/users'
import { useUnit } from './UnitContext'

type CacheEntry = {
  users: User[] | null
  loading: boolean
  error?: string | null
}

type UsersContextValue = {
  getFilteredUsersForTask: (opts: { setorId?: number | null; setorName?: string | null; unidadeId?: number | null }) => { users: User[] | null; loading: boolean; error?: string | null }
  ensureUsersForUnit: (unitId?: number | null) => Promise<void>
  // raw cache accessor (mostly for debug)
  cache: Record<string, CacheEntry>
}

const UsersContext = React.createContext<UsersContextValue | null>(null)

function keyForUnit(unitId?: number | null) {
  return unitId ? `unit:${unitId}` : `all`
}

export const UsersProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { unitId } = useUnit()
  const [cache, setCache] = React.useState<Record<string, CacheEntry>>({})

  const ensureUsersForUnit = React.useCallback(async (uId?: number | null) => {
    const key = keyForUnit(uId ?? unitId ?? null)
    // if already loading or present, no-op
    const existing = cache[key]
    if (existing && (existing.loading || existing.users)) return

    setCache(prev => ({ ...prev, [key]: { users: null, loading: true } }))
    try {
      let res
      if (uId && Number(uId) > 0) {
        res = await getUsersByUnitId(Number(uId))
      } else if (unitId && Number(unitId) > 0) {
        res = await getUsersByUnitId(Number(unitId))
      } else {
        res = await getAllUsers()
      }
      setCache(prev => ({ ...prev, [key]: { users: res.users || [], loading: false, error: null } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCache(prev => ({ ...prev, [key]: { users: [], loading: false, error: msg } }))
    }
  }, [cache, unitId])

  // auto ensure for current unit on mount / unit change
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!mounted) return
      try {
        await ensureUsersForUnit(unitId ?? null)
      } catch (e) {
        // swallow
      }
    })()
    return () => { mounted = false }
  }, [ensureUsersForUnit, unitId])

  const getFilteredUsersForTask = React.useCallback(({ setorId, setorName, unidadeId }: { setorId?: number | null; setorName?: string | null; unidadeId?: number | null }) => {
    const preferredUnit = unidadeId ?? unitId ?? null
    const key = keyForUnit(preferredUnit)
    const entry = cache[key]
    const users = entry && entry.users ? entry.users : null
    const loading = entry ? entry.loading : false
    const error = entry ? entry.error : null

    if (!users) return { users: null, loading, error }

    let list = users
    // filter by setorId when available
    if (typeof setorId !== 'undefined' && setorId !== null && setorId > 0) {
      list = list.filter(u => {
        // server may include setor ids in different fields
        const candidates = [ (u as any).setorId, (u as any).setor_id, (u as any).setores_ids, (u as any).setor_ids ]
        return candidates.some((c: any) => Number(c) === Number(setorId))
      })
    } else if (setorName) {
      const s = String(setorName).toLowerCase()
      list = list.filter(u => {
        const candidates = [(u as any).setor_nomes, (u as any).setorNomes, (u as any).setores, (u as any).setor, (u as any).setor_nome]
        return candidates.some((c: any) => typeof c === 'string' && c.toLowerCase().includes(s))
      })
    }

    return { users: list, loading, error }
  }, [cache, unitId])

  const value: UsersContextValue = React.useMemo(() => ({ getFilteredUsersForTask, ensureUsersForUnit, cache }), [getFilteredUsersForTask, ensureUsersForUnit, cache])

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const ctx = React.useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}

export default UsersContext
