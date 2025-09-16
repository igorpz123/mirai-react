import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { ComercialDashboardCards } from '@/components/commercial-dashboard-cards'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { useAuth } from '@/hooks/use-auth'
import { getProposalsByUser, getProposalStatsByUser, getProposalsByUnit } from '@/services/proposals'
import { useUnit } from '@/contexts/UnitContext'

export default function ComercialDashboard(): ReactElement {
  const { user } = useAuth()
  const { unitId } = useUnit()
  const userId = user?.id ?? null

  const [proposals, setProposals] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      let list: any[] = []
      if (unitId) {
        const byUnit = await getProposalsByUnit(unitId)
        list = byUnit?.proposals ?? []
      }
      if (!list.length && userId) {
        const byUser = await getProposalsByUser(userId)
        list = byUser?.proposals ?? []
      }
      setProposals(list)
      const s = await getProposalStatsByUser(userId)
      setStats(s)
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
            <CommercialProposalsTable proposals={proposals} onRefresh={fetchAll} />
          </div>
        </div>
      </div>
    </div>
  )
}
