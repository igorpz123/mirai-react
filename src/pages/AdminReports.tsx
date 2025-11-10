import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { SiteHeader } from '@/components/layout/site-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getApprovedProposals, getNotasRanking, exportApprovedProposalsToPdf, exportNotasRankingToPdf, exportApprovedProposalsToExcel, formatPaymentMethod } from '@/services/reports'
import type { ApprovedProposalReportItem, NotasRankingItem } from '@/services/reports'
import { getAllUsers, type User as SysUser } from '@/services/users'
import { FileText, TrendingUp, Download, FileSpreadsheet, Calendar, User, CreditCard, DollarSign, Award } from 'lucide-react'
import { IconLoader2 } from '@tabler/icons-react'

function formatDateInput(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export default function AdminReportsPage() {
    useAuth() // ensure authenticated context; AdminRoute also guards
    const [inicio, setInicio] = useState<string>(() => {
        const d = new Date(); d.setDate(1); return formatDateInput(d)
    })
    const [fim, setFim] = useState<string>(() => formatDateInput(new Date()))
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<'propostas' | 'notas'>('propostas')
    const [propostas, setPropostas] = useState<ApprovedProposalReportItem[]>([])
    const [ranking, setRanking] = useState<NotasRankingItem[]>([])
    const [users, setUsers] = useState<SysUser[]>([])
    const [userId, setUserId] = useState<string>('all')
    const [paymentMethod, setPaymentMethod] = useState<string>('all')
    const [exporting, setExporting] = useState(false)

    const periodoLabel = useMemo(() => {
        if (!inicio && !fim) return ''
        if (inicio && fim) return `Período: ${inicio} a ${fim}`
        if (inicio) return `A partir de ${inicio}`
        if (fim) return `Até ${fim}`
        return ''
    }, [inicio, fim])

    const totals = useMemo(() => {
        const sumValor = propostas.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
        const sumComVend = propostas.reduce((acc, p) => acc + (Number(p.comissao_vendedor) || 0), 0)
        const sumComInd = propostas.reduce((acc, p) => acc + (Number(p.comissao_indicacao) || 0), 0)
        return { sumValor, sumComVend, sumComInd }
    }, [propostas])

    async function loadData() {
        setLoading(true)
        try {
            const [p, r] = await Promise.all([
                getApprovedProposals({ 
                    inicio, 
                    fim, 
                    userId: userId !== 'all' ? userId : undefined, 
                    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined 
                }),
                getNotasRanking({ inicio, fim }),
            ])
            setPropostas(p.proposals)
            setRanking(r.ranking)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() /* on mount */ }, [])
    useEffect(() => {
        // carregar lista de usuários para filtro
        (async () => {
            try {
                const res = await getAllUsers()
                // manter apenas campos essenciais
                setUsers((res.users || []).map(u => ({ ...u })))
            } catch { /* ignore */ }
        })()
    }, [])

    const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

    async function onExportPDF() {
        setExporting(true)
        try {
            if (tab === 'propostas') {
                const blob = await exportApprovedProposalsToPdf(propostas, { title: 'Relatório - Propostas Aprovadas', periodo: periodoLabel })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'relatorio-propostas-aprovadas.pdf'
                a.click()
                URL.revokeObjectURL(url)
            } else {
                const blob = await exportNotasRankingToPdf(ranking, { title: 'Relatório - Ranking de Notas', periodo: periodoLabel })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'relatorio-ranking-notas.pdf'
                a.click()
                URL.revokeObjectURL(url)
            }
        } finally {
            setExporting(false)
        }
    }

    function onExportExcel() {
        if (tab !== 'propostas' || propostas.length === 0) return
        setExporting(true)
        try {
            const blob = exportApprovedProposalsToExcel(propostas, { title: 'Relatório - Propostas Aprovadas', periodo: periodoLabel })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'relatorio-propostas-aprovadas.xls'
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setExporting(false)
        }
    }

    return (
        <AdminRoute>
            <div className='container-main'>
                <SiteHeader title="Relatórios | Administração" />
                
                <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
                    
                    {/* Tabs de Seleção */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex rounded-lg border bg-muted p-1">
                            <button 
                                onClick={() => setTab('propostas')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all gap-2 inline-flex items-center ${
                                    tab === 'propostas' 
                                        ? 'bg-background text-foreground shadow-sm' 
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FileText className="h-4 w-4" />
                                Propostas Aprovadas
                            </button>
                            <button 
                                onClick={() => setTab('notas')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all gap-2 inline-flex items-center ${
                                    tab === 'notas' 
                                        ? 'bg-background text-foreground shadow-sm' 
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <TrendingUp className="h-4 w-4" />
                                Ranking de Notas
                            </button>
                        </div>
                        
                        {/* Export Buttons */}
                        <div className="flex gap-2">
                            {tab === 'propostas' && propostas.length > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={onExportExcel} 
                                    disabled={exporting}
                                    className="gap-2"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel
                                </Button>
                            )}
                            {(tab === 'propostas' ? propostas.length > 0 : ranking.length > 0) && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={onExportPDF} 
                                    disabled={exporting}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    PDF
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {/* Filtros Card */}
                    <Card className="border-2 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Filtros</CardTitle>
                            </div>
                            <CardDescription>
                                Selecione o período e os filtros desejados para gerar os relatórios
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Data Início
                                    </label>
                                    <Input 
                                        type="date" 
                                        value={inicio} 
                                        onChange={e => setInicio(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Data Fim
                                    </label>
                                    <Input 
                                        type="date" 
                                        value={fim} 
                                        onChange={e => setFim(e.target.value)}
                                    />
                                </div>
                                {tab === 'propostas' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                Responsável
                                            </label>
                                            <Select value={userId} onValueChange={setUserId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Todos os usuários" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos os usuários</SelectItem>
                                                    {users.map(u => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {[u.nome, u.sobrenome].filter(Boolean).join(' ') || `#${u.id}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                Forma de Pagamento
                                            </label>
                                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Todas as formas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas as formas</SelectItem>
                                                    <SelectItem value="boleto_financeiro">Financeiro</SelectItem>
                                                    <SelectItem value="pix_mp">Mercado Pago (PIX)</SelectItem>
                                                    <SelectItem value="boleto_mp">Mercado Pago (Boleto)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    {periodoLabel && (
                                        <Badge variant="outline" className="gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {periodoLabel}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={loadData} disabled={loading} className="button-primary gap-2">
                                        {loading ? (
                                            <>
                                                <IconLoader2 className="h-4 w-4 animate-spin" />
                                                Carregando...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-4 w-4" />
                                                Gerar Relatório
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Relatórios Content */}
                    {tab === 'propostas' ? (
                        <div className="space-y-4">
                            {/* Stats Cards */}
                            {propostas.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Valor Total
                                            </CardDescription>
                                            <CardTitle className="text-2xl">{fmtBRL(totals.sumValor)}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Comissão Vendedor
                                            </CardDescription>
                                            <CardTitle className="text-2xl">{fmtBRL(totals.sumComVend)}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Comissão Indicação
                                            </CardDescription>
                                            <CardTitle className="text-2xl">{fmtBRL(totals.sumComInd)}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                </div>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Propostas Aprovadas
                                    </CardTitle>
                                    <CardDescription>
                                        {propostas.length} {propostas.length === 1 ? 'proposta encontrada' : 'propostas encontradas'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr className="text-left">
                                                        <th className="p-3 font-semibold">ID</th>
                                                        <th className="p-3 font-semibold">Título</th>
                                                        <th className="p-3 font-semibold">Responsável</th>
                                                        <th className="p-3 font-semibold">Pagamento</th>
                                                        <th className="p-3 font-semibold text-right">Valor Total</th>
                                                        <th className="p-3 font-semibold text-right">Com. Vendedor</th>
                                                        <th className="p-3 font-semibold">Indicação</th>
                                                        <th className="p-3 font-semibold text-right">Com. Indicação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {propostas.map((p) => (
                                                        <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                                                            <td className="p-3">
                                                                <Badge variant="outline">#{p.id}</Badge>
                                                            </td>
                                                            <td className="p-3 font-medium">{p.titulo || '-'}</td>
                                                            <td className="p-3">{p.responsavel_nome || '-'}</td>
                                                            <td className="p-3">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {formatPaymentMethod(p.payment_method)}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-right font-medium">{fmtBRL(p.valor_total)}</td>
                                                            <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">
                                                                {fmtBRL(p.comissao_vendedor)}
                                                            </td>
                                                            <td className="p-3">{p.indicacao_nome || '-'}</td>
                                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                                                                {fmtBRL(p.comissao_indicacao)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {propostas.length === 0 && (
                                                        <tr>
                                                            <td colSpan={8} className="p-8 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                    <FileText className="h-8 w-8" />
                                                                    <p>Nenhuma proposta encontrada no período selecionado</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                {propostas.length > 0 && (
                                                    <tfoot className="bg-muted/50 border-t-2">
                                                        <tr className="font-semibold">
                                                            <td className="p-3" colSpan={4}>Totais</td>
                                                            <td className="p-3 text-right">{fmtBRL(totals.sumValor)}</td>
                                                            <td className="p-3 text-right text-green-600 dark:text-green-400">
                                                                {fmtBRL(totals.sumComVend)}
                                                            </td>
                                                            <td className="p-3"></td>
                                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400">
                                                                {fmtBRL(totals.sumComInd)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Ranking de Notas
                                </CardTitle>
                                <CardDescription>
                                    Avaliação de desempenho dos usuários no período selecionado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr className="text-left">
                                                        <th className="p-3 font-semibold w-20">Posição</th>
                                                        <th className="p-3 font-semibold">Usuário</th>
                                                        <th className="p-3 font-semibold text-center">Avaliações</th>
                                                        <th className="p-3 font-semibold text-right">Média</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ranking.map((r, idx) => (
                                                        <tr key={r.usuario_id} className="border-t hover:bg-muted/30 transition-colors">
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    {idx === 0 && <span className="text-2xl">🥇</span>}
                                                                    {idx === 1 && <span className="text-2xl">🥈</span>}
                                                                    {idx === 2 && <span className="text-2xl">🥉</span>}
                                                                    <Badge variant={idx < 3 ? 'default' : 'outline'}>
                                                                        {r.posicao}º
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 font-medium">{r.nome}</td>
                                                            <td className="p-3 text-center">
                                                                <Badge variant="secondary">{r.quantidade}</Badge>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className={`font-semibold ${
                                                                    (r.media ?? 0) >= 4.5 ? 'text-green-600 dark:text-green-400' :
                                                                    (r.media ?? 0) >= 3.5 ? 'text-blue-600 dark:text-blue-400' :
                                                                    (r.media ?? 0) >= 2.5 ? 'text-yellow-600 dark:text-yellow-400' :
                                                                    'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                    {r.media != null ? r.media.toFixed(2) : '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {ranking.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="p-8 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                    <TrendingUp className="h-8 w-8" />
                                                                    <p>Nenhuma avaliação encontrada no período selecionado</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}
