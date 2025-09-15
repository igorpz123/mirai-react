import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
// ...existing code...
import { useUnit } from '@/contexts/UnitContext'
import { useUsers } from '@/contexts/UsersContext'
import { Link } from 'react-router-dom'

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
          setUsers((all || []).filter((u: any) => Number(u.cargo_id) === 4))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <Link key={u.id} to={`/technical/agenda/${u.id}`} className="block p-4 border rounded hover:shadow">
                <div className="font-semibold">{u.nome}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
