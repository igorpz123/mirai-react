import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
// ...existing code...
import { useUnit } from '@/contexts/UnitContext'
import { getVisibleAgendaUsers, type AgendaUser } from '@/services/agendaUsers'
import { TechUserCard } from '@/components/technical-user-card'
import { Button } from '@/components/ui/button'
import { exportMultipleUsersAgendaToPdf } from '@/services/export'

export default function TechnicalAgenda() {
  // no need for the current user here
  const [users, setUsers] = useState<AgendaUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { unitId, isLoading: unitLoading } = useUnit()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [fromDate, setFromDate] = useState<string | undefined>(undefined)
  const [toDate, setToDate] = useState<string | undefined>(undefined)
  const [exporting, setExporting] = useState(false)

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
        // Busca usuários visíveis da agenda via API
        const list = await getVisibleAgendaUsers(Number(unitId)).catch(() => {
          console.warn('Tabela agenda_usuarios_visiveis não existe. Execute a migration SQL.')
          return []
        })
        if (!mounted) return
        setUsers(list)
      } catch (err) {
        if (!mounted) return
        console.error('Erro ao buscar usuários da agenda:', err)
        setError('Erro ao carregar agenda. A tabela pode não existir ainda.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    if (!unitLoading) fetch()
    return () => { mounted = false }
  }, [unitId, unitLoading])

  const selectedList = useMemo(() => users.filter(u => selectedIds.has(Number(u.id))).map(u => ({ id: Number(u.id), nome: u.nome })), [users, selectedIds])
  const toggleSelect = (id: number) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSelected = selectedIds.size > 0

  return (
    <div className="w-full">
      <SiteHeader title="Agenda" />
      <div className="p-4">
        {/* Export toolbar */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate || ''} onChange={e => setFromDate(e.target.value || undefined)} className="border-input rounded-md px-2 py-1 text-sm" aria-label="De" />
            <input type="date" value={toDate || ''} onChange={e => setToDate(e.target.value || undefined)} className="border-input rounded-md px-2 py-1 text-sm" aria-label="Até" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!allSelected || exporting} onClick={async () => {
              try {
                if (!allSelected) return
                setExporting(true)
                const blob = await exportMultipleUsersAgendaToPdf(selectedList, { from: fromDate, to: toDate })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                const title = `agenda-multi-${fromDate || 'all'}-${toDate || 'all'}`
                a.href = url
                a.download = `${title}.pdf`
                a.click()
                URL.revokeObjectURL(url)
              } catch (e) {
                console.error('Erro ao exportar PDF múltiplo', e)
                alert('Falha ao exportar PDF')
              } finally {
                setExporting(false)
              }
            }}>
              {exporting ? 'Exportando...' : `Exportar ${selectedIds.size || ''}`}
            </Button>
          </div>
        </div>
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
              <div key={u.id} className="relative">
                <div className="absolute top-2 right-2 z-10 bg-background/70 backdrop-blur rounded-md px-2 py-1 text-xs shadow">
                  <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(Number(u.id))}
                      onChange={() => toggleSelect(Number(u.id))}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    
                  </label>
                </div>
                <TechUserCard user={u} to={`/technical/agenda/${u.id}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
