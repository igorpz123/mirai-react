import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useState } from 'react'

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUnit } from '@/contexts/UnitContext'
import { getTaskStatsByUnit } from '@/services/tasks'

export function TechnicalDashboardCards() {
  const { unitId } = useUnit()
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      if (!unitId) return
      setLoading(true)
      setError(null)
      try {
        const res = await getTaskStatsByUnit(unitId)
        if (!mounted) return
        setStats(res)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar estatísticas'
        setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchStats()
    return () => { mounted = false }
  }, [unitId])

  const getCount = (status: string) => stats?.totalByStatus?.[status] ?? 0
  const getTrend = (status: string) => stats?.trendByStatus?.[status]?.percent ?? 0

  const trendProgress = getTrend('progress')
  const trendPendente = getTrend('pendente')
  const trendConcluida = getTrend('concluída')
  const overduePercent = stats?.overdue?.percent ?? 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Tarefas em Andamento */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tarefas em Andamento</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? '...' : getCount('progress')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getTrend('progress') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {Math.abs(getTrend('progress'))}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendProgress > 0 ? (
              <>Aumentando <IconTrendingUp className="size-4" /></>
            ) : trendProgress < 0 ? (
              <>Diminuindo <IconTrendingDown className="size-4" /></>
            ) : (
              <>Estável</>
            )}
          </div>
          <div className="text-muted-foreground">
            Estatísticas das últimas 4 semanas
          </div>
        </CardFooter>
      </Card>
      {/* Tarefas Pendentes */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tarefas Pendentes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? '...' : getCount('pendente')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getTrend('pendente') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {Math.abs(getTrend('pendente'))}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendPendente > 0 ? (
              <>Aumentando <IconTrendingUp className="size-4" /></>
            ) : trendPendente < 0 ? (
              <>Diminuindo <IconTrendingDown className="size-4" /></>
            ) : (
              <>Estável</>
            )}
          </div>
          <div className="text-muted-foreground">
            Monitoramento de pendências
          </div>
        </CardFooter>
      </Card>
      {/* Tarefas Atrasadas */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tarefas Atrasadas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? '...' : stats?.overdue?.current ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats?.overdue?.percent >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {Math.abs(stats?.overdue?.percent ?? 0)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {overduePercent > 0 ? (
              <>Aumentando <IconTrendingUp className="size-4" /></>
            ) : overduePercent < 0 ? (
              <>Diminuindo <IconTrendingDown className="size-4" /></>
            ) : (
              <>Estável</>
            )}
          </div>
          <div className="text-muted-foreground">Tarefas com prazo vencido</div>
        </CardFooter>
      </Card>
      {/* Tarefas Concluídas */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tarefas Concluídas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? '...' : getCount('concluída')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getTrend('concluída') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {Math.abs(getTrend('concluída'))}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendConcluida > 0 ? (
              <>Aumentando <IconTrendingUp className="size-4" /></>
            ) : trendConcluida < 0 ? (
              <>Diminuindo <IconTrendingDown className="size-4" /></>
            ) : (
              <>Estável</>
            )}
          </div>
          <div className="text-muted-foreground">Taxa de conclusão</div>
        </CardFooter>
      </Card>
    </div>
  )
}
