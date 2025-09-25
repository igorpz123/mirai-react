import { useMemo } from 'react'
import type { ReactElement } from 'react'
import useCountUp from '@/hooks/use-countup'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Proposal {
  id?: number | string
  status?: string | null
}

interface Props {
  proposals?: Proposal[]
  counts?: { pending: number; analysis: number; inProgress: number }
}

export default function ProposalStatusPie({ proposals = [], counts }: Props): ReactElement {
  const resolved = useMemo(() => {
    if (counts) return counts

    const lower = (s?: string | null) => (s ?? '').toString().toLowerCase()
    let pending = 0
    let analysis = 0
    let inProgress = 0

    for (const p of proposals) {
      const st = lower(p.status)
      // Ignore approved proposals so they don't get counted as "Em análise"
      if (st.includes('aprov') || st.includes('rejeit')) {
        continue
      }
      if (st.includes('pend')) pending += 1
      else if (st.includes('analise') || st.includes('analis')) analysis += 1
      else if (st.includes('progre') || st.includes('progress') || st.includes('andam')) inProgress += 1
      else {
        // fallback: treat unknown as analysis so it surfaces in the chart
        analysis += 1
      }
    }

    return { pending, analysis, inProgress }
  }, [proposals, counts])

  const total = resolved.pending + resolved.analysis + resolved.inProgress

  const animatedTotal = useCountUp(total || 0, 900)

  // Match badge colors:
  // - Pendentes: uses --primary (button-primary)
  // - Em análise: purple-600 (#7c3aed) to match cards
  // - Em andamento: Tailwind blue-600 (#2563eb)
  const data = [
    { name: 'Pendentes', value: resolved.pending, color: 'var(--primary)' },
    { name: 'Em análise', value: resolved.analysis, color: '#7c3aed' },
    { name: 'Em andamento', value: resolved.inProgress, color: '#2563eb' },
  ].filter(d => d.value > 0)

  const COLORS = data.map(d => d.color)

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Status das propostas</h3>
          <p className="text-xs text-muted-foreground">Visão rápida por status</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      <div className="mt-3 h-48 relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={80}
                paddingAngle={4}
                startAngle={90}
                endAngle={-270}
                animationDuration={800}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                itemStyle={{ color: '#0f172a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Nenhuma proposta encontrada</div>
        )}
        {/* centered overlay inside the donut */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-semibold">{animatedTotal}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { key: 'pending', label: 'Pendentes', value: resolved.pending, color: 'var(--primary)' },
          { key: 'analysis', label: 'Em análise', value: resolved.analysis, color: '#7c3aed' },
          { key: 'inProgress', label: 'Em andamento', value: resolved.inProgress, color: '#2563eb' },
        ].map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: row.color }} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{row.label}</span>
              <span className="text-xs text-muted-foreground">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
