import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
// ...existing code...
import { useUnit } from '@/contexts/UnitContext'
import { useUsers } from '@/contexts/UsersContext'
import { isTecnicoUser } from '@/lib/roles'
import { getAllUsers } from '@/services/users'
import { TechUserCard } from '@/components/technical-user-card'

export default function TechnicalAgenda() {
  // no need for the current user here
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { unitId, isLoading: unitLoading } = useUnit()
  const usersCtx = useUsers()

  useEffect(() => {
    let mounted = true
    async function fetch() {
      setLoading(true)
      setError(null)
      try {
        if (!unitId) {
          setUsers([])
          return
        }
        try {
          await usersCtx.ensureUsersForUnit(Number(unitId))
          const { users: all } = usersCtx.getFilteredUsersForTask({ unidadeId: Number(unitId) })
          if (!mounted) return
          let list = (all || []).filter(isTecnicoUser)
          if (list.length === 0) {
            try {
              const global = await getAllUsers().catch(() => ({ users: [] }))
              const uid = Number(unitId)
              if (!Number.isNaN(uid) && uid > 0) {
                list = (global.users || []).filter(u => {
                  if (!isTecnicoUser(u)) return false
                  const csv = (u as any).unidades
                  if (typeof csv === 'string' && csv.trim()) {
                    const ids = csv.split(',').map(p => Number(p.trim())).filter(n => !isNaN(n))
                    return ids.includes(uid)
                  }
                  return false
                })
              }
            } catch { /* ignore fallback errors */ }
          }
          setUsers(list)
        } catch (e) {
          if (!mounted) return
          setUsers([])
        }
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    if (!unitLoading) fetch()
    return () => { mounted = false }
  }, [unitId, unitLoading])

  return (
    <div className="w-full">
      <SiteHeader title="Agenda" />
      <div className="p-4">
        {unitLoading ? (
          <div>Carregando unidade selecionada...</div>
        ) : loading ? (
          <div>Carregando usuários...</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : users.length === 0 ? (
          <div>Nenhum técnico encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {users.map(u => (
              <TechUserCard key={u.id} user={u} to={`/technical/agenda/${u.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
