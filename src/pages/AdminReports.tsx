import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { SiteHeader } from '@/components/layout/site-header'
import { getApprovedProposals, getNotasRanking, exportApprovedProposalsToPdf, exportNotasRankingToPdf, exportApprovedProposalsToExcel, formatPaymentMethod } from '@/services/reports'
import type { ApprovedProposalReportItem, NotasRankingItem } from '@/services/reports'
import { getAllUsers, type User as SysUser } from '@/services/users'

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
    const [userId, setUserId] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<string>('')

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
                getApprovedProposals({ inicio, fim, userId: userId || undefined, paymentMethod: paymentMethod || undefined }),
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
    }

    function onExportExcel() {
        if (tab !== 'propostas' || propostas.length === 0) return
        const blob = exportApprovedProposalsToExcel(propostas, { title: 'Relatório - Propostas Aprovadas', periodo: periodoLabel })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'relatorio-propostas-aprovadas.xls'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <AdminRoute>
            <div className='container-main'>
                <SiteHeader title="Relatórios | Administração" />
                <div className="p-4">

                    <div className="flex items-end gap-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Início</label>
                            <input type="date" className="border rounded px-2 py-1" value={inicio} onChange={e => setInicio(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fim</label>
                            <input type="date" className="border rounded px-2 py-1" value={fim} onChange={e => setFim(e.target.value)} />
                        </div>
                        {tab === 'propostas' && (
                            <div>
                                <label className="block text-sm font-medium">Usuário (responsável)</label>
                                <select className="border rounded px-2 py-1 min-w-56 bg-background" value={userId} onChange={e => setUserId(e.target.value)}>
                                    <option value="">Todos</option>
                                    {users.map(u => (
                                        <option key={u.id} value={String(u.id)} className='bg-background'>
                                            {[u.nome, u.sobrenome].filter(Boolean).join(' ') || `#${u.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {tab === 'propostas' && (
                            <div>
                                <label className="block text-sm font-medium">Pagamento</label>
                                <select className="border rounded px-2 py-1 min-w-56 bg-background" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="boleto_financeiro">Financeiro</option>
                                    <option value="pix_mp">Mercado Pago (PIX)</option>
                                    <option value="boleto_mp">Mercado Pago (Boleto)</option>
                                </select>
                            </div>
                        )}
                        <Button onClick={loadData} disabled={loading}>Aplicar</Button>
                        <div className="flex-1" />
                        {tab === 'propostas' && (
                            <>
                            <Button variant="outline" onClick={onExportExcel} disabled={loading || propostas.length === 0}>Exportar Excel</Button>
                            </>
                        )}
                        <Button variant="outline" onClick={onExportPDF} disabled={loading}>Exportar PDF</Button>
                    </div>

                    <div className="mb-3">
                        <div className="inline-flex rounded border overflow-hidden">
                            <button className={`px-3 py-2 text-sm ${tab === 'propostas' ? 'bg-primary text-white' : ''}`} onClick={() => setTab('propostas')}>Propostas aprovadas</button>
                            <button className={`px-3 py-2 text-sm ${tab === 'notas' ? 'bg-primary text-white' : ''}`} onClick={() => setTab('notas')}>Ranking de notas</button>
                        </div>
                    </div>

                    {tab === 'propostas' ? (
                        <div className="overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="p-2">Proposta</th>
                                        <th className="p-2">Título</th>
                                        <th className="p-2">Responsável</th>
                                        <th className="p-2">Pagamento</th>
                                        <th className="p-2">Valor Total</th>
                                        <th className="p-2">Comissão Ven. (5%/7%)</th>
                                        <th className="p-2">Indicação</th>
                                        <th className="p-2">Comissão Ind. (2%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {propostas.map((p) => (
                                        <tr key={p.id} className="border-t">
                                            <td className="p-2">{p.id}</td>
                                            <td className="p-2">{p.titulo || '-'}</td>
                                            <td className="p-2">{p.responsavel_nome || '-'}</td>
                                            <td className="p-2">{formatPaymentMethod(p.payment_method)}</td>
                                            <td className="p-2">{fmtBRL(p.valor_total)}</td>
                                            <td className="p-2">{fmtBRL(p.comissao_vendedor)}</td>
                                            <td className="p-2">{p.indicacao_nome || '-'}</td>
                                            <td className="p-2">{fmtBRL(p.comissao_indicacao)}</td>
                                        </tr>
                                    ))}
                                    {propostas.length === 0 && (
                                        <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Nenhum registro no período</td></tr>
                                    )}
                                </tbody>
                                {propostas.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t bg-muted/30">
                                            <td className="p-2 text-right font-medium" colSpan={4}>Totais</td>
                                            <td className="p-2 font-medium">{fmtBRL(totals.sumValor)}</td>
                                            <td className="p-2 font-medium">{fmtBRL(totals.sumComVend)}</td>
                                            <td className="p-2"></td>
                                            <td className="p-2 font-medium">{fmtBRL(totals.sumComInd)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left">
                                        <th className="p-2">Posição</th>
                                        <th className="p-2">Usuário</th>
                                        <th className="p-2">Qtd de Avaliações</th>
                                        <th className="p-2">Média</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((r) => (
                                        <tr key={r.usuario_id} className="border-t">
                                            <td className="p-2">{r.posicao}</td>
                                            <td className="p-2">{r.nome}</td>
                                            <td className="p-2">{r.quantidade}</td>
                                            <td className="p-2">{r.media != null ? r.media.toFixed(2) : '-'}</td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum registro no período</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}
