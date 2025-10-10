import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { ComercialDashboardCards } from '@/components/commercial-dashboard-cards'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { useAuth } from '@/hooks/use-auth'
import { getProposalsByUser, getProposalStatsByUser, getProposalsByUnit, type Proposal } from '@/services/proposals'
import { useUnit } from '@/contexts/UnitContext'
import { QuickIdSearch } from '@/components/quick-id-search'
import ProposalStatusPie from '@/components/proposal-status-pie'
import useCountUp from '@/hooks/use-countup'

export default function ComercialDashboard(): ReactElement {
  const { user } = useAuth()
  const { unitId } = useUnit()
  const userId = user?.id ?? null

  const [proposals, setProposals] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const refreshDebounceRef = useState<{ t?: number | null }>({ t: null })[0]

  async function fetchAll() {
    if (!userId && !unitId) return
    setLoading(true)
    try {
      // Fetch both sources in parallel when available and merge uniquely by id.
      const [byUnitRes, byUserRes] = await Promise.all([
        unitId ? getProposalsByUnit(unitId) : Promise.resolve({ proposals: [] as Proposal[] }),
        userId ? getProposalsByUser(userId) : Promise.resolve({ proposals: [] as Proposal[] }),
      ])

      const unitList = (byUnitRes?.proposals ?? []) as Proposal[]
      const userList = (byUserRes?.proposals ?? []) as Proposal[]

      // Merge unique by id, prioritizing user list data over unit when duplicates
      const map = new Map<number, Proposal>()
      for (const p of unitList) map.set(Number(p.id), p)
      for (const p of userList) map.set(Number(p.id), { ...map.get(Number(p.id)), ...p })
      // Stable sort: newest first by created date or id desc fallback
      const merged = Array.from(map.values()).sort((a, b) => {
        const ad = a.criadoEm ? new Date(a.criadoEm).getTime() : 0
        const bd = b.criadoEm ? new Date(b.criadoEm).getTime() : 0
        if (bd !== ad) return bd - ad
        return Number(b.id) - Number(a.id)
      })

      // Keep only proposals where current user is responsável or indicação
      const userVisible = merged.filter((p) => {
        const respId = Number((p as any).responsavel_id ?? (p as any).responsavelId ?? 0)
        const indicId = Number((p as any).indicacao_id ?? (p as any).indicacaoId ?? 0)
        return respId === Number(userId) || indicId === Number(userId)
      })
      setProposals(userVisible)

      // Stats from backend: keep current behavior (prefer unit when selected)
      const s = unitId
        ? await getProposalStatsByUser(null, unitId)
        : await getProposalStatsByUser(userId)
      // Patch approved count, approved total and commission using merged proposals to avoid undercount when mixing sources
      const now = new Date()
      const curMonth = now.getMonth()
      const curYear = now.getFullYear()
      const inCurrentMonth = (iso?: string | null) => {
        if (!iso) return false
        const d = new Date(iso)
        return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear
      }
      const isApproved = (p: Proposal) => ((p.status ?? '').toString().toLowerCase()).includes('aprov')
      // Use dataAlteracao (approval date) when available for monthly windows; fallback to criadoEm only if missing
  const approvedList = userVisible.filter(p => isApproved(p) && (inCurrentMonth((p as any).dataAlteracao) || (!((p as any).dataAlteracao) && inCurrentMonth(p.criadoEm))))
      const approvedCount = approvedList.length
      const approvedValueSum = approvedList.reduce((acc, p) => acc + Number((p.valor_total ?? p.valor) || 0), 0)
      // Commission: only meaningful in context of a user (responsável/indicação). Apply 5% + 2% rules like backend.
      const commissionSum = (userId ? approvedList.reduce((acc, p) => {
        const base = Number((p.valor_total ?? p.valor) || 0)
        const isResp = Number((p as any).responsavel_id ?? 0) === Number(userId)
        const isIndic = Number((p as any).indicacao_id ?? 0) === Number(userId)
        const rate = (isResp ? 0.05 : 0) + (isIndic ? 0.02 : 0)
        return acc + base * rate
      }, 0) : 0)

      const patchedStats = {
        ...(s ?? {}),
        approved: { ...(s?.approved ?? {}), current: approvedCount },
        approvedValue: { ...(s?.approvedValue ?? {}), current: approvedValueSum },
        commission: { ...(s?.commission ?? {}), current: commissionSum },
      }
      setStats(patchedStats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!userId && !unitId) return; fetchAll(); }, [userId, unitId])

  // Debounced refetch when proposals change locally (e.g., status update in table)
  useEffect(() => {
    if (!userId && !unitId) return
    if (refreshDebounceRef.t) window.clearTimeout(refreshDebounceRef.t as number)
    refreshDebounceRef.t = window.setTimeout(() => {
      fetchAll()
      refreshDebounceRef.t = null
    }, 700)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick])

  return (
    <div className="container-main">
      <SiteHeader title='Dashboard | Comercial' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex items-center justify-between">
              <h2 className="text-lg text-foreground font-semibold">Faça o gerenciamento de suas propostas</h2>
              <QuickIdSearch kind="proposal" placeholder="Nº da proposta" />
            </div>
            {/* Unique key to avoid sharing internal state with Admin dashboard */}
            <ComercialDashboardCards key={`user-commercial-cards-${userId ?? 'no-user'}-${unitId ?? 'no-unit'}`} stats={stats} loading={loading} />
            <div className="px-4 lg:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <ProposalStatusPie proposals={proposals} />
                </div>
                <div>
                  <div className="gap-6">
                    {/* summary stat cards */}
                    {(() => {
                      const lower = (s?: string | null) => (s ?? '').toString().toLowerCase()
                      let pending = 0
                      let analysis = 0
                      let inProgress = 0
                      for (const p of proposals) {
                        const st = lower(p.status)
                        // Ignore approved so it doesn't inflate "Em análise"
                        if (st.includes('aprov') || st.includes('rejeit')) continue
                        if (st.includes('pend')) pending += 1
                        else if (st.includes('analis') || st.includes('analise')) analysis += 1
                        else if (st.includes('progre') || st.includes('progress') || st.includes('andam')) inProgress += 1
                        else analysis += 1
                      }
                      const total = pending + analysis + inProgress || 1
                      const rows = [
                        { key: 'pending', label: 'Pendentes', value: pending, color: 'var(--primary)', tail: 'var(--primary)' },
                        { key: 'analysis', label: 'Em análise', value: analysis, color: '#7c3aed', tail: '#7c3aed' },
                        { key: 'inProgress', label: 'Em andamento', value: inProgress, color: '#2563eb', tail: '#2563eb' },
                      ]

                      return rows.map((r) => {
                        const animated = useCountUp(r.value, 900)
                        return (
                          <div key={r.key} className="bg-card rounded-lg p-4 shadow-sm animate-fade-in-up mt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{r.label}</div>
                                <div className="text-xs text-muted-foreground">{r.value} no total</div>
                              </div>
                                  <div className="text-2xl font-semibold">{animated}</div>
                            </div>
                                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700`}
                                    style={{ width: `${Math.round((r.value / total) * 100)}%`, backgroundColor: r.tail }}
                                  />
                                </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <CommercialProposalsTable
              proposals={proposals}
              onProposalsPatched={(patches) => {
                // Apply patches locally to update chart/cards instantly
                setProposals(prev => prev.map(p => {
                  const patch = patches.find(pt => String(pt.id) === String(p.id))
                  return patch ? { ...p, ...patch.changes } : p
                }))
                setRefreshTick(x => x + 1)
              }}
              onProposalDeleted={(id) => {
                setProposals(prev => prev.filter(p => String(p.id) !== String(id)))
                setRefreshTick(x => x + 1)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
