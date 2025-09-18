import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { ComercialDashboardCards } from '@/components/commercial-dashboard-cards'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { useAuth } from '@/hooks/use-auth'
import { getProposalsByUser, getProposalStatsByUser, getProposalsByUnit, type Proposal } from '@/services/proposals'
import { useUnit } from '@/contexts/UnitContext'

export default function ComercialDashboard(): ReactElement {
  const { user } = useAuth()
  const { unitId } = useUnit()
  const userId = user?.id ?? null

  const [proposals, setProposals] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

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

      setProposals(merged)

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
      const approvedList = merged.filter(p => isApproved(p) && (inCurrentMonth((p as any).dataAlteracao) || (!((p as any).dataAlteracao) && inCurrentMonth(p.criadoEm))))
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

  return (
    <div className="w-full">
      <SiteHeader title='Comercial - Dashboard' />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ComercialDashboardCards stats={stats} loading={loading} />
            <div className="px-4 lg:px-6">
              {/* Reuse existing chart component later; placeholder for now */}
              <div className="aspect-video w-full rounded-lg border border-dashed" />
            </div>
            <CommercialProposalsTable proposals={proposals} />
          </div>
        </div>
      </div>
    </div>
  )
}
