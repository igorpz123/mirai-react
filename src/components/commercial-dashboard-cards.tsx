import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import type { ReactElement } from "react"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type ComercialDashboardCardsProps = {
    stats?: any | null
    loading?: boolean
}

export function ComercialDashboardCards({ stats = null, loading = false, }: ComercialDashboardCardsProps): ReactElement {
    const getCount = (k: string) => stats?.totalByStatus?.[k] ?? 0
    const getTrend = (k: string) => stats?.trendByStatus?.[k]?.percent ?? 0

    const trendPendentes = getTrend('pendente')
    const trendAndamento = getTrend('andamento')
    const trendAnalise = getTrend('analise')

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Propostas Pendentes</CardDescription>
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
                        {trendPendentes > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : trendPendentes < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Propostas aguardando retorno</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Propostas em Andamento</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : getCount('andamento')}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {getTrend('andamento') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(getTrend('andamento'))}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {trendAndamento > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : trendAndamento < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Propostas em negociação</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Propostas em Análise</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : getCount('analise')}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {getTrend('analise') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(getTrend('analise'))}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {trendAnalise > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : trendAnalise < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Propostas sob análise do cliente</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Comissão</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : getCount('analise')}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {getTrend('analise') >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(getTrend('analise'))}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {trendAnalise > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : trendAnalise < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Comissão do mês corrente</div>
                </CardFooter>
            </Card>
        </div>
    )
}
