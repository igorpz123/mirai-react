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
import useCountUp from "@/hooks/use-countup"

type ComercialDashboardCardsProps = {
    stats?: any | null
    loading?: boolean
}

export function ComercialDashboardCards({ stats = null, loading = false, }: ComercialDashboardCardsProps): ReactElement {
    const created = stats?.created ?? { current: 0, percent: 0 }
    const approved = stats?.approved ?? { current: 0, percent: 0 }
    const approvedValue = stats?.approvedValue ?? { current: 0, percent: 0 }
    const commission = stats?.commission ?? { current: 0, percent: 0 }
    const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

    // Animate numbers from 0 when the page loads (or when values change)
    const animDuration = 2000
    const animatedCreated = useCountUp(loading ? 0 : Number(created.current || 0), animDuration)
    const animatedApproved = useCountUp(loading ? 0 : Number(approved.current || 0), animDuration)
    const animatedApprovedValue = useCountUp(loading ? 0 : Number(approvedValue.current || 0), animDuration)
    const animatedCommission = useCountUp(loading ? 0 : Number(commission.current || 0), animDuration)

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Propostas Criadas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : animatedCreated}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {(created.percent ?? 0) >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(created.percent ?? 0)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {(created.percent ?? 0) > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : (created.percent ?? 0) < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Criadas no mês atual</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Propostas Aprovadas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : animatedApproved}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {(approved.percent ?? 0) >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(approved.percent ?? 0)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {(approved.percent ?? 0) > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : (approved.percent ?? 0) < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Aprovadas no mês atual</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Valor Total Aprovado</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : fmtBRL(animatedApprovedValue)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {(approvedValue.percent ?? 0) >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(approvedValue.percent ?? 0)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {(approvedValue.percent ?? 0) > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : (approvedValue.percent ?? 0) < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Valor total aprovado neste mês</div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Comissão</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {loading ? '...' : fmtBRL(animatedCommission)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            {(commission.percent ?? 0) >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                            {Math.abs(commission.percent ?? 0)}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {(commission.percent ?? 0) > 0 ? (<>Aumentando <IconTrendingUp className="size-4" /></>) : (commission.percent ?? 0) < 0 ? (<>Diminuindo <IconTrendingDown className="size-4" /></>) : (<>Estável</>)}
                    </div>
                    <div className="text-muted-foreground">Comissão do mês corrente</div>
                </CardFooter>
            </Card>
        </div>
    )
}
