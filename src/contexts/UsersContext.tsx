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
  const inFlightRef = React.useRef<Record<string, { promise: Promise<void>; started: number }>>({})
  const TTL_MS = 60_000
  const cacheRef = React.useRef(cache)
  React.useEffect(() => { cacheRef.current = cache }, [cache])

  const ensureUsersForUnit = React.useCallback(async (uId?: number | null) => {
    const preferred = uId ?? unitId ?? null
    const key = keyForUnit(preferred)

    const existing = cacheRef.current[key]
    // Evita refetch dentro do TTL se já temos dados
    if (existing && existing.users && !existing.loading) {
      const inflight = inFlightRef.current[key]
      if (!inflight) return
    }
    // Se já há request em andamento reutiliza
    if (inFlightRef.current[key]) return inFlightRef.current[key].promise

    let shouldFetch = false
    setCache(prev => {
      const ex = prev[key]
      if (ex && (ex.loading || ex.users)) {
        return prev
      }
      shouldFetch = true
      return { ...prev, [key]: { users: null, loading: true } }
    })
  if (!shouldFetch) return

    const p = (async () => {
      try {
        let res
        if (preferred && Number(preferred) > 0) {
          res = await getUsersByUnitId(Number(preferred))
        } else {
          res = await getAllUsers()
        }
        setCache(prev => ({ ...prev, [key]: { users: res.users || [], loading: false, error: null } }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setCache(prev => ({ ...prev, [key]: { users: [], loading: false, error: msg } }))
      } finally {
        setTimeout(() => {
          const inflight = inFlightRef.current[key]
          if (inflight && Date.now() - inflight.started >= TTL_MS) {
            delete inFlightRef.current[key]
          }
        }, TTL_MS + 50)
      }
    })()
    inFlightRef.current[key] = { promise: p, started: Date.now() }
    return p
  }, [unitId])

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

  // Helper function to check if user matches setorId - extracted and optimized
  const userMatchesSetor = React.useCallback((user: User, setorId: number): boolean => {
    const anyField = user as any
    const candidates = [
      anyField.setorId, 
      anyField.setor_id, 
      anyField.setor_ids, 
      anyField.setores_ids, 
      anyField.setores
    ]

    // check primitive numeric fields first
    for (const c of candidates) {
      if (c == null) continue
      if (typeof c === 'number' && c === setorId) return true
      if (typeof c === 'string') {
        // maybe a single numeric string
        const num = Number(c)
        if (!isNaN(num) && num === setorId) return true
        // maybe CSV like '1,2,3'
        if (c.includes(',')) {
          const parts = c.split(',')
          for (const p of parts) {
            const pNum = Number(p.trim())
            if (!isNaN(pNum) && pNum === setorId) return true
          }
        }
      }
      // arrays
      if (Array.isArray(c)) {
        for (const el of c) {
          const elNum = Number(el)
          if (!isNaN(elNum) && elNum === setorId) return true
        }
      }
    }

    // as last resort, check campo 'setor' name equality to id as string
    const fallback = anyField.setor || anyField.setor_nome
    if (fallback && String(fallback) === String(setorId)) return true

    return false
  }, [])

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
      list = list.filter(u => userMatchesSetor(u, setorId))
    } else if (setorName) {
      const s = setorName.toLowerCase()
      list = list.filter(u => {
        const anyField = u as any
        const candidates = [anyField.setor_nomes, anyField.setorNomes, anyField.setores, anyField.setor, anyField.setor_nome]
        for (const c of candidates) {
          if (typeof c === 'string' && c.toLowerCase().includes(s)) return true
        }
        return false
      })
    }

    return { users: list, loading, error }
  }, [cache, unitId, userMatchesSetor])

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
