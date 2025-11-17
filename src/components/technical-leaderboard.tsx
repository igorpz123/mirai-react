import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { IconTrophy, IconMedal, IconAward } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useTasksLeaderboard } from '@/hooks/use-tasks-leaderboard'
import { useUnit } from '@/contexts/UnitContext'
import type { TimePeriod } from '@/services/tasks'

// Período de tempo disponível
interface TechnicalLeaderboardProps {
    /** Número máximo de usuários a exibir (padrão: 10) */
    maxUsers?: number
    /** Se deve mostrar apenas o top 3 em destaque */
    highlightTop3?: boolean
}

export function TechnicalLeaderboard({
    maxUsers = 10,
    highlightTop3 = true,
}: TechnicalLeaderboardProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days')
    const { unitId } = useUnit()

    // Usar o hook para buscar os dados filtrados pela unidade atual
    const { data, loading, error } = useTasksLeaderboard({
        period: selectedPeriod,
        unidade_id: unitId || undefined,
        autoFetch: true,
    })

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value as TimePeriod)
    }

    const getRankIcon = (position: number) => {
        if (position === 1) return <IconTrophy className="w-5 h-5 text-yellow-500" />
        if (position === 2) return <IconMedal className="w-5 h-5 text-gray-400" />
        if (position === 3) return <IconAward className="w-5 h-5 text-amber-600" />
        return null
    }

    const getRankBadgeVariant = (position: number) => {
        if (position === 1) return 'default'
        if (position === 2) return 'secondary'
        if (position === 3) return 'outline'
        return 'outline'
    }

    const getInitials = (name: string): string => {
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    // Limitar dados ao máximo especificado
    const displayData = data.slice(0, maxUsers)

    return (
        <Card className='max-h-[24rem] overflow-x-auto' data-tour="dashboard-ranking">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Ranking de Produtividade</CardTitle>
                        <CardDescription>Usuários que mais concluíram tarefas</CardDescription>
                    </div>
                    <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Última semana</SelectItem>
                            <SelectItem value="15days">Últimos 15 dias</SelectItem>
                            <SelectItem value="30days">Último mês</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Carregando ranking...</div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-destructive">{error}</div>
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">
                            Nenhum dado disponível para o período selecionado
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayData.map((entry, index) => {
                            const position = index + 1
                            const isTop3 = position <= 3 && highlightTop3

                            return (
                                <div
                                    key={entry.userId}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                        isTop3
                                            ? 'bg-muted/50 border-primary/20'
                                            : 'hover:bg-muted/30'
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={entry.userPhoto || undefined} alt={entry.userName} />
                                            <AvatarFallback>{getInitials(entry.userName)}</AvatarFallback>
                                        </Avatar>
                                        {/* Badge de posição para Top 3 */}
                                        {isTop3 && (
                                            <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                                {getRankIcon(position)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Informações do usuário */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{entry.userName}</p>
                                            {isTop3 && (
                                                <Badge variant={getRankBadgeVariant(position)} className="text-xs">
                                                    Top {position}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground truncate">
                                            {entry.cargo || 'Sem cargo'}
                                        </div>
                                    </div>

                                    {/* Quantidade de tarefas */}
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-primary">
                                                {entry.completedTasks}
                                            </div>
                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                tarefas
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default TechnicalLeaderboard
