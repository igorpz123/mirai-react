import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProposalById, type Proposal, getCursosByProposal, getProdutosByProposal, getQuimicosByProposal, type ProposalCurso, type ProposalProduto, type ProposalQuimico, getCoursesCatalog, getProductsCatalog, addCourseToProposal, addChemicalToProposal, addProductToProposal, getProductPrice, type Curso, type Produto, getChemicalsCatalog, type Quimico, updateProposalStatus, PROPOSAL_STATUSES, type ProposalStatus, getProposalHistory, type ProposalHistoryEntry, getProgramsCatalog, type Programa, addProgramToProposal, getProgramasByProposal, type ProposalPrograma, getProgramPrice, deleteCourseFromProposal, deleteChemicalFromProposal, deleteProductFromProposal, deleteProgramFromProposal, addProposalObservation, listProposalFiles, uploadProposalFile, deleteProposalFile, type Arquivo as PropostaArquivo, exportProposalDocx } from '@/services/proposals'
import ProposalStatusBadge from '@/components/proposal-status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SiteHeader } from '@/components/layout/site-header'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastError, toastSuccess } from '@/lib/customToast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconTrash } from '@tabler/icons-react'
import { AuthContext } from '@/contexts/AuthContext'

export default function CommercialProposalDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = React.useContext(AuthContext)
    const [proposal, setProposal] = React.useState<Proposal | null>(null)
    const [loading, setLoading] = React.useState<boolean>(true)
    const [error, setError] = React.useState<string | null>(null)
    const [cursos, setCursos] = React.useState<ProposalCurso[] | null>(null)
    const [produtos, setProdutos] = React.useState<ProposalProduto[] | null>(null)
    const [quimicos, setQuimicos] = React.useState<ProposalQuimico[] | null>(null)
    const [loadingItens, setLoadingItens] = React.useState<boolean>(false)
    const [history, setHistory] = React.useState<ProposalHistoryEntry[] | null>(null)
    const [programas, setProgramas] = React.useState<ProposalPrograma[] | null>(null)
    const [arquivos, setArquivos] = React.useState<PropostaArquivo[] | null>(null)
    const [uploading, setUploading] = React.useState(false)
    // Catalogs
    const [courses, setCourses] = React.useState<Curso[]>([])
    const [products, setProducts] = React.useState<Produto[]>([])
    const [chemicals, setChemicals] = React.useState<Quimico[]>([])
    const [programs, setPrograms] = React.useState<Programa[]>([])
    const [note, setNote] = React.useState<string>('')
    const [savingNote, setSavingNote] = React.useState<boolean>(false)

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [confirmText, setConfirmText] = React.useState<string>('')
    const [confirming, setConfirming] = React.useState(false)
    const confirmActionRef = React.useRef<null | (() => Promise<void>)>(null)
    const openConfirm = (text: string, action: () => Promise<void>) => {
        setConfirmText(text)
        confirmActionRef.current = action
        setConfirmOpen(true)
    }
    React.useEffect(() => {
        let mounted = true
        Promise.all([
            getCoursesCatalog().catch(() => [] as Curso[]),
            getProductsCatalog().catch(() => [] as Produto[]),
            getChemicalsCatalog().catch(() => [] as Quimico[]),
            getProgramsCatalog().catch(() => [] as Programa[]),
        ]).then(([cs, ps, qs, prgs]) => { if (!mounted) return; setCourses(cs); setProducts(ps); setChemicals(qs); setPrograms(prgs) })
        return () => { mounted = false }
    }, [])

    // Sheets state
    const [openCourse, setOpenCourse] = React.useState(false)
    const [openChemical, setOpenChemical] = React.useState(false)
    const [openProduct, setOpenProduct] = React.useState(false)
    const [openProgram, setOpenProgram] = React.useState(false)
    // Form state
    const [formCourse, setFormCourse] = React.useState({ curso_id: 0, quantidade: 1, valor_unitario: 0, desconto: 0 })
    const [formChemical, setFormChemical] = React.useState({ selectedKey: '', quimico_id: 0, grupo: '', pontos: 0, valor_unitario: 0, desconto: 0 })
    const [formProduct, setFormProduct] = React.useState({ produto_id: 0, quantidade: 1, desconto: 0, precoPrev: 0 })
    const [formProgram, setFormProgram] = React.useState({ programa_id: 0, quantidade: 1, desconto: 0, acrescimo_mensal: 0, precoPrev: 0 })

    // Reset forms when opening sheets
    React.useEffect(() => {
        if (openCourse) setFormCourse({ curso_id: 0, quantidade: 1, valor_unitario: 0, desconto: 0 })
    }, [openCourse])
    React.useEffect(() => {
    if (openChemical) setFormChemical({ selectedKey: '', quimico_id: 0, grupo: '', pontos: 0, valor_unitario: 0, desconto: 0 })
    }, [openChemical])
    React.useEffect(() => {
        if (openProduct) setFormProduct({ produto_id: 0, quantidade: 1, desconto: 0, precoPrev: 0 })
    }, [openProduct])
    React.useEffect(() => {
    if (openProgram) setFormProgram({ programa_id: 0, quantidade: 1, desconto: 0, acrescimo_mensal: 0, precoPrev: 0 })
    }, [openProgram])

    React.useEffect(() => {
        if (!id) return
        let mounted = true
        setLoading(true)
        const pid = Number(id)
        getProposalById(pid)
            .then((data) => { if (mounted) setProposal(data) })
            .catch((err: any) => { console.error(err); if (mounted) setError(err?.message || 'Erro ao carregar proposta') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [id])

    // Load linked items
    React.useEffect(() => {
        if (!id) return
        let mounted = true
        const pid = Number(id)
        setLoadingItens(true)
        Promise.all([
            getCursosByProposal(pid).catch(() => [] as ProposalCurso[]),
            getQuimicosByProposal(pid).catch(() => [] as ProposalQuimico[]),
            getProdutosByProposal(pid).catch(() => [] as ProposalProduto[]),
            getProgramasByProposal(pid).catch(() => [] as ProposalPrograma[]),
            getProposalHistory(pid).catch(() => [] as ProposalHistoryEntry[]),
            listProposalFiles(pid).catch(() => [] as PropostaArquivo[]),
        ])
            .then(([c, q, p, prgs, h, arqs]) => {
                if (!mounted) return
                setCursos(c)
                setQuimicos(q)
                setProdutos(p)
                setProgramas(prgs)
                setHistory(h)
                setArquivos(arqs)
            })
            .finally(() => { if (mounted) setLoadingItens(false) })
        return () => { mounted = false }
    }, [id])

    const fmtBRL = (n?: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0))
    const fmtDate = (s?: string) => {
        if (!s) return '—'
        const d = new Date(s)
        return isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR').format(d)
    }

    // Totals by section
    const cursosTotals = React.useMemo(() => {
        const list = cursos ?? []
        const qtd = list.reduce((acc, item) => acc + Number(item.quantidade ?? 0), 0)
        const valor = list.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)
        return { qtd, valor }
    }, [cursos])

    const quimicosTotals = React.useMemo(() => {
        const list = quimicos ?? []
        const qtd = list.reduce((acc, item) => acc + Number((item as any).pontos ?? 0), 0)
        const valor = list.reduce((acc, item) => acc + Number((item as any).valor_total ?? 0), 0)
        return { qtd, valor }
    }, [quimicos])

    const produtosTotals = React.useMemo(() => {
        const list = produtos ?? []
        const qtd = list.reduce((acc, item) => acc + Number(item.quantidade ?? 0), 0)
        const valor = list.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)
        return { qtd, valor }
    }, [produtos])

    const programasTotals = React.useMemo(() => {
        const list = programas ?? []
        const qtd = list.reduce((acc, item) => acc + Number(item.quantidade ?? 0), 0)
        const valor = list.reduce((acc, item) => acc + Number(item.valor_total ?? 0), 0)
        return { qtd, valor }
    }, [programas])

    // Permissions: disable remove if approved or user not responsible/admin
    const isApproved = React.useMemo(() => (proposal?.status || '').toString().toLowerCase() === 'aprovada', [proposal?.status])
    const isAdmin = React.useMemo(() => [1, 2, 3].includes(Number(user?.cargoId)), [user?.cargoId])
    const isResponsible = React.useMemo(() => Number(user?.id) === Number(proposal?.responsavel_id), [user?.id, proposal?.responsavel_id])
    const canRemoveItems = !isApproved && (isAdmin || isResponsible)
    const canUpdateStatus = isAdmin || isResponsible

    if (loading) return <div className="p-4">Carregando...</div>
    if (error) return <div className="p-4 text-destructive">{error}</div>
    if (!proposal) return <div className="p-4">Proposta não encontrada.</div>

    return (
        <>
            <div className='w-full'>
                <SiteHeader title='Detalhes da Proposta' />
                <div className="p-4 space-y-6 mx-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold flex items-center gap-3">
                            Proposta #{proposal.id}
                            <ProposalStatusBadge status={proposal.status} />
                        </h1>
                                                <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={async () => {
                                                                try {
                                                                    if (!id) return
                                                                    const blob = await exportProposalDocx(Number(id))
                                                                    const url = window.URL.createObjectURL(blob)
                                                                    const a = document.createElement('a')
                                                                    a.href = url
                                                                    a.download = `Proposta-${id}.docx`
                                                                    document.body.appendChild(a)
                                                                    a.click()
                                                                    a.remove()
                                                                    window.URL.revokeObjectURL(url)
                                                                } catch (err: any) {
                                                                    toastError(err?.response?.data?.message || err?.message || 'Falha ao exportar DOCX')
                                                                }
                                                            }}
                                                        >Exportar Word</Button>
                            <Button onClick={() => setOpenCourse(true)} disabled={!canRemoveItems} title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível adicionar itens.' : 'Apenas o responsável ou um administrador pode adicionar itens.') : undefined}>+ Curso</Button>
                            <Button onClick={() => setOpenChemical(true)} disabled={!canRemoveItems} title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível adicionar itens.' : 'Apenas o responsável ou um administrador pode adicionar itens.') : undefined}>+ Químico</Button>
                            <Button onClick={() => setOpenProduct(true)} disabled={!canRemoveItems} title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível adicionar itens.' : 'Apenas o responsável ou um administrador pode adicionar itens.') : undefined}>+ Produto</Button>
                            <Button onClick={() => setOpenProgram(true)} disabled={!canRemoveItems} title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível adicionar itens.' : 'Apenas o responsável ou um administrador pode adicionar itens.') : undefined}>+ Programa</Button>
                        </div>
                    </div>

                    {/* Status updater */}
                    <div className="flex flex-col gap-2 rounded-md border p-3 bg-card/50">
                        <div className="text-sm font-medium">Status da proposta</div>
                        <div className="flex items-center gap-2">
                            <Select
                                disabled={!canUpdateStatus}
                                value={(proposal.status || '').toString().toLowerCase().replace('progress', 'andamento').replace('análise', 'analise')}
                                onValueChange={async (v) => {
                                    try {
                                        const key = v as ProposalStatus
                                        // confirmations
                                        if (key === 'aprovada' || key === 'rejeitada') {
                                            const ok = window.confirm(`Tem certeza que deseja marcar como ${PROPOSAL_STATUSES.find(s=>s.key===key)?.label}?`)
                                            if (!ok) return
                                        }
                                        const res = await updateProposalStatus(proposal.id, key)
                                        setProposal((prev) => prev ? { ...prev, status: res.status, dataAlteracao: res.dataAlteracao ?? prev.dataAlteracao } : prev)
                                        // refresh history
                                        try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch {}
                                        toastSuccess('Status atualizado')
                                    } catch (e: any) {
                                        toastError(e?.response?.data?.message || 'Falha ao atualizar status')
                                    }
                                }}
                            >
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROPOSAL_STATUSES.map(s => (
                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <section className="space-y-2 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Título</div>
                                <div className="text-base">{proposal.titulo || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Cliente</div>
                                <div className="text-base">{proposal.cliente || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Responsável</div>
                                <div className="text-base">{proposal.responsavel || '—'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Indicação</div>
                                <div className="text-base">{proposal.indicacao || '—'}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Criada em</div>
                                <div className="text-base">{fmtDate(proposal.criadoEm)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Alterada em</div>
                                <div className="text-base">{fmtDate(proposal.dataAlteracao)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Valor total</div>
                                <div className="text-base">{fmtBRL(proposal.valor_total ?? proposal.valor)}</div>
                            </div>
                        </div>
                    </section>

                    {/* Observações sobre a proposta */}
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Observações</h2>
                        <div className="rounded-md border p-3 bg-card/50">
                            <Textarea
                                placeholder="Escreva uma observação sobre esta proposta..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={!canUpdateStatus || isApproved || savingNote}
                            />
                            <div className="flex justify-end mt-2">
                                <Button
                                    onClick={async () => {
                                        try {
                                            if (!id || !user?.id) return
                                            const content = (note || '').trim()
                                            if (!content) { toastError('Digite uma observação'); return }
                                            setSavingNote(true)
                                            await addProposalObservation(Number(id), Number(user.id), content)
                                            setNote('')
                                            try { const h = await getProposalHistory(Number(id)); setHistory(h) } catch {}
                                            toastSuccess('Observação adicionada')
                                        } catch (err: any) {
                                            toastError(err?.response?.data?.message || err?.message || 'Erro ao adicionar observação')
                                        } finally {
                                            setSavingNote(false)
                                        }
                                    }}
                                    disabled={!canUpdateStatus || isApproved || savingNote}
                                >{savingNote ? 'Salvando...' : 'Salvar observação'}</Button>
                            </div>
                        </div>
                    </section>

                    {/* Arquivos vinculados */}
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Arquivos</h2>
                        <div className="rounded-md border p-3 bg-card/50 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="file"
                                    id="file-proposta"
                                    disabled={!canRemoveItems || uploading}
                                    onChange={async (e) => {
                                        const inputEl = e.currentTarget
                                        const file = inputEl.files?.[0]
                                        if (!file || !id) return
                                        try {
                                            setUploading(true)
                                            await uploadProposalFile(Number(id), file)
                                            const list = await listProposalFiles(Number(id))
                                            setArquivos(list)
                                            toastSuccess('Arquivo enviado')
                                        } catch (err: any) {
                                            toastError(err?.response?.data?.message || err?.message || 'Erro ao enviar arquivo')
                                        } finally {
                                            try { inputEl.value = '' } catch {}
                                            setUploading(false)
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    disabled
                                    title="Selecione um arquivo para enviar"
                                >Enviar</Button>
                                {!canRemoveItems && (
                                    <div className="text-xs text-muted-foreground">{isApproved ? 'Proposta aprovada: uploads desabilitados.' : 'Apenas o responsável ou um administrador pode enviar/excluir arquivos.'}</div>
                                )}
                            </div>
                            <div>
                                {!arquivos || arquivos.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Nenhum arquivo enviado.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {arquivos.map((a) => (
                                            <li key={a.id} className="flex items-center justify-between gap-2">
                                                <a href={a.caminho} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[70%]">{a.nome_arquivo}</a>
                                                <div className="flex items-center gap-2">
                                                    <a href={a.caminho} target="_blank" rel="noreferrer">
                                                        <Button size="sm" variant="secondary">Abrir</Button>
                                                    </a>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        disabled={!canRemoveItems}
                                                        onClick={async () => {
                                                            if (!id) return
                                                            const ok = window.confirm('Excluir este arquivo?')
                                                            if (!ok) return
                                                            try {
                                                                await deleteProposalFile(Number(id), a.id)
                                                                setArquivos(prev => prev ? prev.filter(x => x.id !== a.id) : prev)
                                                                toastSuccess('Arquivo excluído')
                                                            } catch (err: any) {
                                                                toastError(err?.response?.data?.message || err?.message || 'Erro ao excluir arquivo')
                                                            }
                                                        }}
                                                    >Excluir</Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Produtos vinculados</h2>
                        {loadingItens ? (
                            <div className="text-sm text-muted-foreground">Carregando itens...</div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium">Programas de Prevenção</h3>
                                    {(!programas || programas.length === 0) ? (
                                        <div className="text-sm text-muted-foreground">Nenhum programa vinculado.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead className="text-right">Qtd</TableHead>
                                                    <TableHead className="text-right">Valor Unit. (mês)</TableHead>
                                                    <TableHead className="text-right">Valor Total (anual)</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {programas.map((p) => (
                                                    <TableRow key={`programa-${p.id}`}>
                                                        <TableCell>{p.programa_nome || p.programa_id}</TableCell>
                                                        <TableCell className="text-right">{Number(p.quantidade ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_total)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                className='button-remove'
                                                                size="sm"
                                                                disabled={!canRemoveItems}
                                                                title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                onClick={() => openConfirm(
                                                                    `Remover programa ${p.programa_nome || p.programa_id}?`,
                                                                    async () => {
                                                                        await deleteProgramFromProposal(proposal.id, p.id)
                                                                        setProgramas(prev => prev ? prev.filter(x => x.id !== p.id) : prev)
                                                                        setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(p.valor_total || 0) } : prev)
                                                                        try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch {}
                                                                        toastSuccess('Programa removido')
                                                                    }
                                                                )}
                                                            ><IconTrash /> Remover</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{programasTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(programasTotals.valor)}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium">Cursos</h3>
                                    {(!cursos || cursos.length === 0) ? (
                                        <div className="text-sm text-muted-foreground">Nenhum curso vinculado.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead className="text-right">Qtd</TableHead>
                                                    <TableHead className="text-right">Valor Unit.</TableHead>
                                                    <TableHead className="text-right">Valor Total</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cursos.map((c) => (
                                                    <TableRow key={`curso-${c.id}`}>
                                                        <TableCell>{c.curso_nome || c.curso_id}</TableCell>
                                                        <TableCell className="text-right">{Number(c.quantidade ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(c.valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(c.valor_total)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                className='button-remove'
                                                                size="sm"
                                                                disabled={!canRemoveItems}
                                                                title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                onClick={() => openConfirm(
                                                                    `Remover curso ${c.curso_nome || c.curso_id}?`,
                                                                    async () => {
                                                                        await deleteCourseFromProposal(proposal.id, c.id)
                                                                        setCursos(prev => prev ? prev.filter(x => x.id !== c.id) : prev)
                                                                        setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(c.valor_total || 0) } : prev)
                                                                        try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch {}
                                                                        toastSuccess('Curso removido')
                                                                    }
                                                                )}
                                                            ><IconTrash /> Remover</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{cursosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(cursosTotals.valor)}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-medium">Químicos</h3>
                                    {(!quimicos || quimicos.length === 0) ? (
                                        <div className="text-sm text-muted-foreground">Nenhum químico vinculado.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Grupo Químico</TableHead>
                                                    <TableHead className="text-right">Qtd</TableHead>
                                                    <TableHead className="text-right">Valor Unit.</TableHead>
                                                    <TableHead className="text-right">Valor Total</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {quimicos.map((q) => (
                                                    <TableRow key={`quimico-${q.id}`}>
                                                        <TableCell>{(q as any).grupo || '—'}</TableCell>
                                                        <TableCell className="text-right">{Number((q as any).pontos ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL((q as any).valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL((q as any).valor_total)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                className='button-remove'
                                                                size="sm"
                                                                disabled={!canRemoveItems}
                                                                title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                onClick={() => openConfirm(
                                                                    `Remover químico do grupo ${(q as any).grupo || ''}?`,
                                                                    async () => {
                                                                        await deleteChemicalFromProposal(proposal.id, q.id)
                                                                        setQuimicos(prev => prev ? prev.filter(x => x.id !== q.id) : prev)
                                                                        setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number((q as any).valor_total || 0) } : prev)
                                                                        try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch {}
                                                                        toastSuccess('Químico removido')
                                                                    }
                                                                )}
                                                            ><IconTrash />Remover</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{quimicosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(quimicosTotals.valor)}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-medium">Produtos</h3>
                                    {(!produtos || produtos.length === 0) ? (
                                        <div className="text-sm text-muted-foreground">Nenhum produto vinculado.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead className="text-right">Qtd</TableHead>
                                                    <TableHead className="text-right">Valor Unit.</TableHead>
                                                    <TableHead className="text-right">Valor Total</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {produtos.map((p) => (
                                                    <TableRow key={`produto-${p.id}`}>
                                                        <TableCell>{p.produto_nome || p.produto_id}</TableCell>
                                                        <TableCell className="text-right">{Number(p.quantidade ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_total)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={!canRemoveItems}
                                                                title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                onClick={() => openConfirm(
                                                                    `Remover produto ${p.produto_nome || p.produto_id}?`,
                                                                    async () => {
                                                                        await deleteProductFromProposal(proposal.id, p.id)
                                                                        setProdutos(prev => prev ? prev.filter(x => x.id !== p.id) : prev)
                                                                        setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(p.valor_total || 0) } : prev)
                                                                        try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch {}
                                                                        toastSuccess('Produto removido')
                                                                    }
                                                                )}
                                                            ><IconTrash /> Remover</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{produtosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(produtosTotals.valor)}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* History section */}
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Histórico</h2>
                        {!history || history.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Nenhuma alteração registrada.</div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((h, idx) => (
                                    <div key={`hist-${h.id}`} className={`flex items-center gap-4 py-4 ${idx > 0 ? 'border-t border-muted/40' : ''}`}>
                                        <div className="flex-shrink-0">
                                            <div className="size-12">
                                                <Avatar className="size-12">
                                                    {h.actor?.foto ? (
                                                        <AvatarImage src={h.actor.foto} alt={`${h.actor.nome} ${h.actor.sobrenome || ''}`} />
                                                    ) : (
                                                        <AvatarFallback className="text-lg">{(h.actor?.nome || 'U').charAt(0)}</AvatarFallback>
                                                    )}
                                                </Avatar>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <p className="text-xs text-muted-foreground">{h.data_alteracao ? new Date(h.data_alteracao).toLocaleString('pt-BR') : '—'}</p>
                                                <div className="ml-2 text-muted-foreground" title={h.acao}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium mt-1">
                                                {(() => {
                                                    switch (h.acao) {
                                                        case 'criar':
                                                            return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} criou a proposta`
                                                        case 'adicionar_item': {
                                                            const t = h.novo?.tipo
                                                            if (t === 'curso') {
                                                                return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou o curso ${h.novo?.curso_nome || h.novo?.curso_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Unit: ${fmtBRL(h.novo?.valor_unitario)}, Desc: ${fmtBRL(h.novo?.desconto)}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'quimico') {
                                                                return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou químico do grupo ${h.novo?.grupo || ''} (Pontos: ${h.novo?.pontos ?? 0}, Unit: ${fmtBRL(h.novo?.valor_unitario)}, Desc: ${fmtBRL(h.novo?.desconto)}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'produto') {
                                                                return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou o produto ${h.novo?.produto_nome || h.novo?.produto_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Unit: ${fmtBRL(h.novo?.valor_unitario)}, Desc: ${fmtBRL(h.novo?.desconto)}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'programa') {
                                                                return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou o programa ${h.novo?.programa_nome || h.novo?.programa_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Desc: ${fmtBRL(h.novo?.desconto)}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            }
                                                            return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou um item`
                                                        }
                                                        case 'aprovar':
                                                        case 'rejeitar':
                                                        case 'atualizar_status':
                                                            return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} atualizou o status de ${h.anterior?.status || '—'} para ${h.novo?.status || '—'}`
                                                        case 'adicionar_observacao':
                                                            return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} adicionou uma observação`
                                                        default:
                                                            return `${h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'} realizou ${h.acao?.replace('_',' ')}`
                                                    }
                                                })()}
                                            </p>
                                            {h.observacoes ? (
                                                <p className="text-sm text-muted-foreground mt-1">Observações: {h.observacoes}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
            {/* Sheet: Add Course */}
            <Sheet open={openCourse} onOpenChange={setOpenCourse}>
                <SheetContent className="sm:max-w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Adicionar Curso</SheetTitle>
                        <SheetDescription>Selecione um curso e preencha os valores.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3 px-2">
                        <div className='w-full'>
                            <div className="text-sm mb-1">Curso</div>
                            <Select
                                value={String(formCourse.curso_id || '')}
                                onValueChange={(v) => {
                                    const idSel = Number(v)
                                    const c = courses.find(cc => cc.id === idSel)
                                    const unit = (c?.valor_unitario ?? c?.preco_unitario ?? c?.valor ?? c?.preco) ?? 0
                                    setFormCourse((s) => ({ ...s, curso_id: idSel, valor_unitario: Number(unit) }))
                                }}
                            >
                                <SelectTrigger className='w-full'><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-sm mb-1">Quantidade</div>
                                <Input type="number" min={1} value={formCourse.quantidade} onChange={(e) => setFormCourse((s) => ({ ...s, quantidade: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <div className="text-sm mb-1">Valor Unitário</div>
                                <Input type="number" value={formCourse.valor_unitario} onChange={(e) => setFormCourse((s) => ({ ...s, valor_unitario: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Desconto (R$)</div>
                            <Input type="number" value={formCourse.desconto} onChange={(e) => setFormCourse((s) => ({ ...s, desconto: Number(e.target.value) }))} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total previsto: {fmtBRL(Math.max(0, Number(formCourse.quantidade || 0) * Number(formCourse.valor_unitario || 0) - Number(formCourse.desconto || 0)))}
                        </div>
                    </div>
                    <SheetFooter className="mt-4">
                        <Button
                            disabled={!canRemoveItems}
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    if (!formCourse.curso_id) { toastError('Selecione um curso'); return }
                                    if (!formCourse.quantidade || formCourse.quantidade <= 0) { toastError('Quantidade inválida'); return }
                                    if (!formCourse.valor_unitario || formCourse.valor_unitario <= 0) { toastError('Valor unitário inválido'); return }
                                    const payload = { ...formCourse }
                                    const res = await addCourseToProposal(Number(id), payload)
                                    if (res.item) {
                                        setCursos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toastSuccess('Curso adicionado')
                                        setOpenCourse(false)
                                    }
                                } catch {
                                    toastError('Falha ao adicionar curso')
                                }
                            }}
                        >Salvar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Sheet: Add Program */}
            <Sheet open={openProgram} onOpenChange={setOpenProgram}>
                <SheetContent className="sm:max-w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Adicionar Programa</SheetTitle>
                        <SheetDescription>Selecione um programa e informe a quantidade e desconto. O preço será calculado conforme a regra.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="text-sm mb-1">Programa</div>
                            <Select value={String(formProgram.programa_id || '')} onValueChange={(v) => setFormProgram((s) => ({ ...s, programa_id: Number(v) }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-sm mb-1">Quantidade</div>
                                <Input type="number" min={1} value={formProgram.quantidade} onChange={(e) => setFormProgram((s) => ({ ...s, quantidade: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <div className="text-sm mb-1">Desconto (R$)</div>
                                <Input type="number" min={0} value={formProgram.desconto} onChange={(e) => setFormProgram((s) => ({ ...s, desconto: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Acréscimo Mensal (R$)</div>
                            <Input type="number" min={0} value={formProgram.acrescimo_mensal}
                                onChange={(e) => setFormProgram((s) => ({ ...s, acrescimo_mensal: Number(e.target.value) }))} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total previsto (anual): {fmtBRL(formProgram.precoPrev)}
                        </div>
                        <div>
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        if (!formProgram.programa_id || !formProgram.quantidade) return
                                        const rule = await getProgramPrice(formProgram.programa_id, formProgram.quantidade)
                                        const unit = Number((rule as any).preco_unitario ?? 0)
                                        const minQ = Number((rule as any).min_quantidade ?? 0)
                                        const adicional = Number((rule as any).preco_adicional ?? 0)
                                        const isLinear = Boolean((rule as any).preco_linear ?? (rule as any).preco_adicional)
                                        let total: number
                                        if (!isLinear) {
                                            total = unit
                                        } else {
                                            const extra = Math.max(0, formProgram.quantidade - minQ) * adicional
                                            total = Math.max(0, unit + extra - (formProgram.desconto || 0))
                                        }
                                        // Add monthly increment before annualizing
                                        const acres = Math.max(0, Number(formProgram.acrescimo_mensal || 0))
                                        const mensal = Math.max(0, total + acres)
                                        // Preview shows annual total (12x monthly)
                                        setFormProgram((s) => ({ ...s, precoPrev: mensal * 12 }))
                                    } catch {
                                        toastError('Falha ao calcular preço')
                                    }
                                }}
                            >Calcular preço</Button>
                        </div>
                    </div>
                    <SheetFooter className="mt-4">
                        <Button
                            disabled={!canRemoveItems}
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    const payload = { programa_id: formProgram.programa_id, quantidade: formProgram.quantidade, desconto: formProgram.desconto, acrescimo_mensal: Math.max(0, Number(formProgram.acrescimo_mensal || 0)) }
                                    const res = await addProgramToProposal(Number(id), payload)
                                    if (res.item) {
                                        setProgramas(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toastSuccess('Programa adicionado')
                                        setOpenProgram(false)
                                    }
                                } catch {
                                    toastError('Falha ao adicionar programa')
                                }
                            }}
                        >Salvar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            {/* Sheet: Add Chemical */}
            <Sheet open={openChemical} onOpenChange={setOpenChemical}>
                <SheetContent className="sm:max-w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Adicionar Químico</SheetTitle>
                        <SheetDescription>Informe grupo, pontos e valores.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="text-sm mb-1">Químico</div>
                            <Select
                                value={formChemical.selectedKey || ''}
                                onValueChange={(v) => {
                                    const idx = Number(v)
                                    const q = chemicals[idx]
                                    const unit = (q?.valor_unitario ?? q?.preco_unitario ?? q?.valor ?? q?.preco) ?? 0
                                    const grupo = q?.grupo ?? ''
                                    const pontos = Number(q?.pontos ?? 0)
                                    setFormChemical((s) => ({ ...s, selectedKey: v, quimico_id: Number(q?.id || 0), grupo, pontos, valor_unitario: Number(unit) }))
                                }}
                            >
                                <SelectTrigger className='w-full'><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {chemicals.map((q, idx) => (
                                        <SelectItem key={`chem-${q.id ?? 'noid'}-${idx}`} value={String(idx)}>
                                            {q.descricao || q.grupo || `Químico ${q.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-sm mb-1">Pontos</div>
                                <Input type="number" min={1} value={formChemical.pontos} onChange={(e) => setFormChemical((s) => ({ ...s, pontos: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <div className="text-sm mb-1">Valor Unitário</div>
                                <Input type="number" value={formChemical.valor_unitario} onChange={(e) => setFormChemical((s) => ({ ...s, valor_unitario: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div>
                            <div className="text-sm mb-1">Desconto (R$)</div>
                            <Input type="number" min={0} value={formChemical.desconto} onChange={(e) => setFormChemical((s) => ({ ...s, desconto: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground px-2">
                        Total previsto: {fmtBRL(Math.max(0, Number(formChemical.pontos || 0) * Number(formChemical.valor_unitario || 0) - Number(formChemical.desconto || 0)))}
                    </div>
                    <SheetFooter className="mt-4">
                        <Button
                            disabled={!canRemoveItems}
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    if (!formChemical.valor_unitario || formChemical.valor_unitario <= 0) { toastError('Selecione um químico para preencher o preço'); return }
                                    if (!formChemical.pontos || formChemical.pontos <= 0) { toastError('Informe os pontos'); return }
                                    const { grupo, pontos, valor_unitario, desconto } = formChemical as any
                                    const res = await addChemicalToProposal(Number(id), { grupo, pontos, valor_unitario, desconto })
                                    if (res.item) {
                                        setQuimicos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toastSuccess('Químico adicionado')
                                        setOpenChemical(false)
                                    }
                                } catch {
                                    toastError('Falha ao adicionar químico')
                                }
                            }}
                        >Salvar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Sheet: Add Product */}
            <Sheet open={openProduct} onOpenChange={setOpenProduct}>
                <SheetContent className="sm:max-w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Adicionar Produto</SheetTitle>
                        <SheetDescription>Selecione um produto e informe a quantidade e desconto. O preço será calculado conforme a regra.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="text-sm mb-1">Produto</div>
                            <Select value={String(formProduct.produto_id || '')} onValueChange={(v) => setFormProduct((s) => ({ ...s, produto_id: Number(v) }))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-sm mb-1">Quantidade</div>
                                <Input type="number" min={1} value={formProduct.quantidade} onChange={(e) => setFormProduct((s) => ({ ...s, quantidade: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <div className="text-sm mb-1">Desconto (R$)</div>
                                <Input type="number" min={0} value={formProduct.desconto} onChange={(e) => setFormProduct((s) => ({ ...s, desconto: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total previsto: {fmtBRL(formProduct.precoPrev)}
                        </div>
                        <div>
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        if (!formProduct.produto_id || !formProduct.quantidade) return
                                        const rule = await getProductPrice(formProduct.produto_id, formProduct.quantidade)
                                        const unit = Number((rule as any).preco_unitario ?? 0)
                                        const minQ = Number((rule as any).min_quantidade ?? 0)
                                        const adicional = Number((rule as any).preco_adicional ?? 0)
                                        const isLinear = Boolean((rule as any).preco_linear ?? (rule as any).preco_adicional)
                                        let total: number
                                        if (!isLinear) {
                                            total = unit
                                        } else {
                                            const extra = Math.max(0, formProduct.quantidade - minQ) * adicional
                                            total = Math.max(0, unit + extra - (formProduct.desconto || 0))
                                        }
                                        setFormProduct((s) => ({ ...s, precoPrev: total }))
                                    } catch {
                                        toastError('Falha ao calcular preço')
                                    }
                                }}
                            >Calcular preço</Button>
                        </div>
                    </div>
                    <SheetFooter className="mt-4">
                        <Button
                            disabled={!canRemoveItems}
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    const payload = { produto_id: formProduct.produto_id, quantidade: formProduct.quantidade, desconto: formProduct.desconto }
                                    const res = await addProductToProposal(Number(id), payload)
                                    if (res.item) {
                                        setProdutos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toastSuccess('Produto adicionado')
                                        setOpenProduct(false)
                                    }
                                } catch {
                                    toastError('Falha ao adicionar produto')
                                }
                            }}
                        >Salvar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) { setConfirmOpen(false); setConfirming(false) } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar remoção</DialogTitle>
                        <DialogDescription>{confirmText || 'Deseja remover este item da proposta?'}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirming}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!confirmActionRef.current) { setConfirmOpen(false); return }
                                try { setConfirming(true); await confirmActionRef.current(); } finally { setConfirming(false); setConfirmOpen(false) }
                            }}
                            disabled={confirming}
                        >{confirming ? 'Removendo...' : 'Remover'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Confirmation Dialog component inline
// Render after the main component return block

