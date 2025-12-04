import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProposalById, type Proposal, getCursosByProposal, getProdutosByProposal, getQuimicosByProposal, type ProposalCurso, type ProposalProduto, type ProposalQuimico, getCoursesCatalog, getProductsCatalog, addCourseToProposal, addChemicalToProposal, addProductToProposal, getProductPrice, type Curso, type Produto, getChemicalsCatalog, type Quimico, updateProposalStatus, PROPOSAL_STATUSES, type ProposalStatus, getProposalHistory, type ProposalHistoryEntry, getProgramsCatalog, type Programa, addProgramToProposal, getProgramasByProposal, type ProposalPrograma, getProgramPrice, deleteCourseFromProposal, deleteChemicalFromProposal, deleteProductFromProposal, deleteProgramFromProposal, addProposalObservation, listProposalFiles, uploadProposalFile, deleteProposalFile, type Arquivo as PropostaArquivo, exportProposalDocx, updateProposalPayment, PAYMENT_METHOD_OPTIONS } from '@/services/proposals'
import ProposalStatusBadge from '@/components/proposal-status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SiteHeader } from '@/components/layout/site-header'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toastError, toastSuccess } from '@/lib/customToast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconTrash, IconPlus, IconChevronDown, IconFileText } from '@tabler/icons-react'
import { AuthContext } from '@/contexts/AuthContext'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { buildFileUrl } from '@/lib/fileUrl'

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

    // Payment dialog state
    const [payOpen, setPayOpen] = React.useState(false)
    const [savingPay, setSavingPay] = React.useState(false)
    const [payMethod, setPayMethod] = React.useState<string>('pix_mp')
    const [payInstallments, setPayInstallments] = React.useState<string>('1')

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
            <div className='container-main'>
                <SiteHeader title='Detalhes da Proposta' />
                <div className="p-6 space-y-6 max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                                Proposta #{proposal.id}
                            </h1>
                            <div className="flex items-center gap-2">
                                <ProposalStatusBadge status={proposal.status} />
                                <span className="text-sm text-muted-foreground">
                                    Última alteração: {fmtDate(proposal.dataAlteracao)}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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

                            {/* Botão para gerar contrato (só aparece se tiver programas) */}
                            {programas && programas.length > 0 && (
                                <Button
                                    variant="secondary"
                                    onClick={async () => {
                                        try {
                                            if (!id) return
                                            const res = await fetch(`/api/documentos/documents/proposta/${id}`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                }
                                            })
                                            if (!res.ok) throw new Error(await res.text())
                                            toastSuccess('Contrato gerado com sucesso!')
                                            // Redirecionar para página de documentos
                                            setTimeout(() => {
                                                navigate('/admin/documentos')
                                            }, 1500)
                                        } catch (err: any) {
                                            toastError(err?.message || 'Falha ao gerar contrato')
                                        }
                                    }}
                                >
                                    <IconFileText className="mr-2" size={18} />
                                    Gerar Contrato
                                </Button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        disabled={!canRemoveItems}
                                        title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível adicionar itens.' : 'Apenas o responsável ou um administrador pode adicionar itens.') : undefined}
                                    >
                                        <IconPlus className="mr-2" size={18} />
                                        Adicionar Item
                                        <IconChevronDown className="ml-2" size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={() => setOpenProgram(true)}
                                        className="cursor-pointer"
                                    >
                                        <IconPlus className="mr-2" size={16} />
                                        Programa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setOpenCourse(true)}
                                        className="cursor-pointer"
                                    >
                                        <IconPlus className="mr-2" size={16} />
                                        Curso
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setOpenChemical(true)}
                                        className="cursor-pointer"
                                    >
                                        <IconPlus className="mr-2" size={16} />
                                        Químico
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setOpenProduct(true)}
                                        className="cursor-pointer"
                                    >
                                        <IconPlus className="mr-2" size={16} />
                                        Produto
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-lg border bg-card shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</p>
                                <p className="text-base font-medium">{proposal.titulo || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</p>
                                <p className="text-base font-medium">{proposal.cliente || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsável</p>
                                <p className="text-base font-medium">{proposal.responsavel || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Indicação</p>
                                <p className="text-base font-medium">{proposal.indicacao || '—'}</p>
                            </div>
                        </div>

                        <div className="h-px bg-border my-6"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data de Criação</p>
                                <p className="text-base font-medium">{fmtDate(proposal.criadoEm)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Total</p>
                                <p className="text-2xl font-bold text-primary">{fmtBRL(proposal.valor_total ?? proposal.valor)}</p>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status da Proposta</p>
                                <Select
                                    disabled={!canUpdateStatus}
                                    value={(proposal.status || '').toString().toLowerCase().replace('progress', 'andamento').replace('análise', 'analise')}
                                    onValueChange={async (v) => {
                                        try {
                                            const key = v as ProposalStatus
                                            if (key === 'aprovada') {
                                                setPayMethod((proposal as any).payment_method || 'pix_mp')
                                                setPayInstallments(String((proposal as any).payment_installments || 1))
                                                setPayOpen(true)
                                                return
                                            }
                                            if (key === 'rejeitada') {
                                                const ok = window.confirm(`Tem certeza que deseja marcar como ${PROPOSAL_STATUSES.find(s => s.key === key)?.label}?`)
                                                if (!ok) return
                                            }
                                            const res = await updateProposalStatus(proposal.id, key)
                                            setProposal((prev) => prev ? { ...prev, status: res.status, dataAlteracao: res.dataAlteracao ?? prev.dataAlteracao } : prev)
                                            try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                                            toastSuccess('Status atualizado')
                                        } catch (e: any) {
                                            toastError(e?.response?.data?.message || 'Falha ao atualizar status')
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full max-w-xs">
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
                    </div>

                    {/* Products Section */}
                    <div className="rounded-lg border bg-card shadow-sm">
                        <div className="p-6 pb-0">
                            <h2 className="text-xl font-semibold mb-4">Produtos Vinculados</h2>
                        </div>
                        {loadingItens ? (
                            <div className="p-6 text-sm text-muted-foreground">Carregando itens...</div>
                        ) : (
                            <Tabs defaultValue="programas" className="w-full">
                                <div className="px-6">
                                    <TabsList className="w-full grid grid-cols-4 h-auto">
                                        <TabsTrigger value="programas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="flex flex-col items-center py-1">
                                                <span className="font-medium">Programas</span>
                                                <span className="text-xs opacity-80">({programas?.length || 0})</span>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="cursos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="flex flex-col items-center py-1">
                                                <span className="font-medium">Cursos</span>
                                                <span className="text-xs opacity-80">({cursos?.length || 0})</span>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="quimicos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="flex flex-col items-center py-1">
                                                <span className="font-medium">Químicos</span>
                                                <span className="text-xs opacity-80">({quimicos?.length || 0})</span>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="produtos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="flex flex-col items-center py-1">
                                                <span className="font-medium">Produtos</span>
                                                <span className="text-xs opacity-80">({produtos?.length || 0})</span>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="programas" className="p-6 pt-4 space-y-4">
                                    <div>
                                        {(!programas || programas.length === 0) ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                Nenhum programa vinculado
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="font-semibold">Nome</TableHead>
                                                            <TableHead className="text-right font-semibold">Qtd</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Unit. (mês)</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Total (anual)</TableHead>
                                                            <TableHead className="w-[80px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {programas.map((p) => (
                                                            <TableRow key={`programa-${p.id}`}>
                                                                <TableCell className="font-medium">{p.programa_nome || p.programa_id}</TableCell>
                                                                <TableCell className="text-right">{Number(p.quantidade ?? 0)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(p.valor_unitario)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(p.valor_total)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className='hover:bg-destructive hover:text-destructive-foreground'
                                                                        disabled={!canRemoveItems}
                                                                        title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                        onClick={() => openConfirm(
                                                                            `Remover programa ${p.programa_nome || p.programa_id}?`,
                                                                            async () => {
                                                                                await deleteProgramFromProposal(proposal.id, p.id)
                                                                                setProgramas(prev => prev ? prev.filter(x => x.id !== p.id) : prev)
                                                                                setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(p.valor_total || 0) } : prev)
                                                                                try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                                                                                toastSuccess('Programa removido')
                                                                            }
                                                                        )}
                                                                    ><IconTrash size={18} /></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="bg-muted/30 font-semibold">
                                                            <TableCell className="font-bold">Total</TableCell>
                                                            <TableCell className="text-right font-bold">{programasTotals.qtd}</TableCell>
                                                            <TableCell className="text-right">—</TableCell>
                                                            <TableCell className="text-right font-bold text-primary">{fmtBRL(programasTotals.valor)}</TableCell>
                                                            <TableCell>—</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="cursos" className="p-6 pt-4 space-y-4">
                                    <div>
                                        {(!cursos || cursos.length === 0) ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                Nenhum curso vinculado
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="font-semibold">Nome</TableHead>
                                                            <TableHead className="text-right font-semibold">Qtd</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Unit.</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Total</TableHead>
                                                            <TableHead className="w-[80px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {cursos.map((c) => (
                                                            <TableRow key={`curso-${c.id}`}>
                                                                <TableCell className="font-medium">{c.curso_nome || c.curso_id}</TableCell>
                                                                <TableCell className="text-right">{Number(c.quantidade ?? 0)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(c.valor_unitario)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(c.valor_total)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className='hover:bg-destructive hover:text-destructive-foreground'
                                                                        disabled={!canRemoveItems}
                                                                        title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                        onClick={() => openConfirm(
                                                                            `Remover curso ${c.curso_nome || c.curso_id}?`,
                                                                            async () => {
                                                                                await deleteCourseFromProposal(proposal.id, c.id)
                                                                                setCursos(prev => prev ? prev.filter(x => x.id !== c.id) : prev)
                                                                                setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(c.valor_total || 0) } : prev)
                                                                                try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                                                                                toastSuccess('Curso removido')
                                                                            }
                                                                        )}
                                                                    ><IconTrash size={18} /></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="bg-muted/30 font-semibold">
                                                            <TableCell className="font-bold">Total</TableCell>
                                                            <TableCell className="text-right font-bold">{cursosTotals.qtd}</TableCell>
                                                            <TableCell className="text-right">—</TableCell>
                                                            <TableCell className="text-right font-bold text-primary">{fmtBRL(cursosTotals.valor)}</TableCell>
                                                            <TableCell>—</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="quimicos" className="p-6 pt-4 space-y-4">
                                    <div>
                                        {(!quimicos || quimicos.length === 0) ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                Nenhum químico vinculado
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="font-semibold">Grupo Químico</TableHead>
                                                            <TableHead className="text-right font-semibold">Qtd</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Unit.</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Total</TableHead>
                                                            <TableHead className="w-[80px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {quimicos.map((q) => (
                                                            <TableRow key={`quimico-${q.id}`}>
                                                                <TableCell className="font-medium">{(q as any).grupo || '—'}</TableCell>
                                                                <TableCell className="text-right">{Number((q as any).pontos ?? 0)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL((q as any).valor_unitario)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL((q as any).valor_total)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className='hover:bg-destructive hover:text-destructive-foreground'
                                                                        disabled={!canRemoveItems}
                                                                        title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                        onClick={() => openConfirm(
                                                                            `Remover químico do grupo ${(q as any).grupo || ''}?`,
                                                                            async () => {
                                                                                await deleteChemicalFromProposal(proposal.id, q.id)
                                                                                setQuimicos(prev => prev ? prev.filter(x => x.id !== q.id) : prev)
                                                                                setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number((q as any).valor_total || 0) } : prev)
                                                                                try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                                                                                toastSuccess('Químico removido')
                                                                            }
                                                                        )}
                                                                    ><IconTrash size={18} /></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="bg-muted/30 font-semibold">
                                                            <TableCell className="font-bold">Total</TableCell>
                                                            <TableCell className="text-right font-bold">{quimicosTotals.qtd}</TableCell>
                                                            <TableCell className="text-right">—</TableCell>
                                                            <TableCell className="text-right font-bold text-primary">{fmtBRL(quimicosTotals.valor)}</TableCell>
                                                            <TableCell>—</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="produtos" className="p-6 pt-4 space-y-4">
                                    <div>
                                        {(!produtos || produtos.length === 0) ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                Nenhum produto vinculado
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="font-semibold">Nome</TableHead>
                                                            <TableHead className="text-right font-semibold">Qtd</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Unit.</TableHead>
                                                            <TableHead className="text-right font-semibold">Valor Total</TableHead>
                                                            <TableHead className="w-[80px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {produtos.map((p) => (
                                                            <TableRow key={`produto-${p.id}`}>
                                                                <TableCell className="font-medium">{p.produto_nome || p.produto_id}</TableCell>
                                                                <TableCell className="text-right">{Number(p.quantidade ?? 0)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(p.valor_unitario)}</TableCell>
                                                                <TableCell className="text-right">{fmtBRL(p.valor_total)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className='hover:bg-destructive hover:text-destructive-foreground'
                                                                        disabled={!canRemoveItems}
                                                                        title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover itens.' : 'Apenas o responsável ou um administrador pode remover itens.') : undefined}
                                                                        onClick={() => openConfirm(
                                                                            `Remover produto ${p.produto_nome || p.produto_id}?`,
                                                                            async () => {
                                                                                await deleteProductFromProposal(proposal.id, p.id)
                                                                                setProdutos(prev => prev ? prev.filter(x => x.id !== p.id) : prev)
                                                                                setProposal(prev => prev ? { ...prev, valor_total: Number(prev.valor_total || 0) - Number(p.valor_total || 0) } : prev)
                                                                                try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                                                                                toastSuccess('Produto removido')
                                                                            }
                                                                        )}
                                                                    ><IconTrash size={18} /></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="bg-muted/30 font-semibold">
                                                            <TableCell className="font-bold">Total</TableCell>
                                                            <TableCell className="text-right font-bold">{produtosTotals.qtd}</TableCell>
                                                            <TableCell className="text-right">—</TableCell>
                                                            <TableCell className="text-right font-bold text-primary">{fmtBRL(produtosTotals.valor)}</TableCell>
                                                            <TableCell>—</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    {/* Observations & Files Section */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Observações */}
                        <div className="rounded-lg border bg-card shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">Observações</h2>
                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Adicionar observação sobre esta proposta..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={savingNote}
                                    className="min-h-[80px] resize-none"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                if (!id || !user?.id) return
                                                const content = (note || '').trim()
                                                if (!content) { toastError('Digite uma observação'); return }
                                                setSavingNote(true)
                                                await addProposalObservation(Number(id), Number(user.id), content)
                                                setNote('')
                                                try { const h = await getProposalHistory(Number(id)); setHistory(h) } catch { }
                                                toastSuccess('Observação adicionada')
                                            } catch (err: any) {
                                                toastError(err?.response?.data?.message || err?.message || 'Erro ao adicionar observação')
                                            } finally {
                                                setSavingNote(false)
                                            }
                                        }}
                                        disabled={savingNote}
                                    >
                                        {savingNote ? 'Salvando...' : 'Salvar observação'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Arquivos */}
                        <div className="rounded-lg border bg-card shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">Arquivos</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="file-proposta"
                                        className="hidden"
                                        disabled={uploading}
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
                                                try { inputEl.value = '' } catch { }
                                                setUploading(false)
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={uploading}
                                        onClick={() => document.getElementById('file-proposta')?.click()}
                                    >
                                        {uploading ? 'Enviando...' : 'Selecionar arquivo'}
                                    </Button>
                                </div>
                                <div className="rounded-md border bg-muted/30 p-4 max-h-[120px] overflow-y-auto">
                                    {!arquivos || arquivos.length === 0 ? (
                                        <div className="text-center text-sm text-muted-foreground py-6">
                                            Nenhum arquivo enviado
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {arquivos.map((a) => (
                                                <li key={a.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-background transition-colors">
                                                    <a
                                                        href={buildFileUrl(a.caminho)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm text-primary hover:underline truncate flex-1"
                                                    >
                                                        {a.nome_arquivo}
                                                    </a>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                                                            disabled={!canRemoveItems}
                                                            title={!canRemoveItems ? (isApproved ? 'Proposta aprovada: não é possível remover arquivos.' : 'Apenas o responsável ou um administrador pode remover arquivos.') : undefined}
                                                            onClick={() => openConfirm(
                                                                `Remover arquivo ${a.nome_arquivo}?`,
                                                                async () => {
                                                                    await deleteProposalFile(proposal.id, a.id)
                                                                    setArquivos(prev => prev ? prev.filter(x => x.id !== a.id) : prev)
                                                                    toastSuccess('Arquivo removido')
                                                                }
                                                            )}
                                                        >
                                                            <IconTrash size={16} />
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History section */}
                    <div className="rounded-lg border bg-card shadow-sm p-6">
                        <h2 className="text-xl font-semibold mb-6">Histórico de Alterações</h2>
                        {!history || history.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                Nenhuma alteração registrada
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {history.map((h, idx) => (
                                    <div key={`hist-${h.id}`} className={`flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors ${idx > 0 ? 'border-t' : ''}`}>
                                        <div className="flex-shrink-0 mt-1">
                                            <Avatar className="size-10">
                                                {h.actor?.foto ? (
                                                    <AvatarImage src={h.actor.foto} alt={`${h.actor.nome} ${h.actor.sobrenome || ''}`} />
                                                ) : (
                                                    <AvatarFallback className="text-sm font-medium">{(h.actor?.nome || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                                )}
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-sm font-medium">
                                                    {h.actor ? `${h.actor.nome} ${h.actor.sobrenome || ''}`.trim() : 'Usuário'}
                                                </p>
                                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {h.data_alteracao ? new Date(h.data_alteracao).toLocaleString('pt-BR') : '—'}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {(() => {
                                                    switch (h.acao) {
                                                        case 'criar':
                                                            return 'criou a proposta'
                                                        case 'adicionar_item': {
                                                            const t = h.novo?.tipo
                                                            if (t === 'curso') {
                                                                return `adicionou o curso ${h.novo?.curso_nome || h.novo?.curso_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'quimico') {
                                                                return `adicionou químico do grupo ${h.novo?.grupo || ''} (Pontos: ${h.novo?.pontos ?? 0}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'produto') {
                                                                return `adicionou o produto ${h.novo?.produto_nome || h.novo?.produto_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            } else if (t === 'programa') {
                                                                return `adicionou o programa ${h.novo?.programa_nome || h.novo?.programa_id || ''} (Qtd: ${h.novo?.quantidade ?? 0}, Total: ${fmtBRL(h.novo?.valor_total)})`
                                                            }
                                                            return 'adicionou um item'
                                                        }
                                                        case 'aprovar':
                                                            return 'marcou a proposta como aprovada'
                                                        case 'rejeitar':
                                                        case 'atualizar_status':
                                                            return `atualizou o status de ${h.anterior?.status || '—'} para ${h.novo?.status || '—'}`
                                                        case 'adicionar_observacao':
                                                            return 'adicionou uma observação'
                                                        case 'atualizar_pagamento':
                                                            return 'atualizou as informações de pagamento'
                                                        default:
                                                            return `realizou ${h.acao?.replace('_', ' ')}`
                                                    }
                                                })()}
                                            </p>
                                            {h.observacoes ? (
                                                <p className="text-sm mt-2 p-2 rounded bg-muted/50 italic">
                                                    "{h.observacoes}"
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                        <Button variant="outline" className='cursor-pointer' onClick={() => setConfirmOpen(false)} disabled={confirming}>Cancelar</Button>
                        <Button
                            className="button-remove"
                            onClick={async () => {
                                if (!confirmActionRef.current) { setConfirmOpen(false); return }
                                try { setConfirming(true); await confirmActionRef.current(); } finally { setConfirming(false); setConfirmOpen(false) }
                            }}
                            disabled={confirming}
                        >{confirming ? 'Removendo...' : 'Remover'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={payOpen} onOpenChange={(o) => { if (!savingPay) setPayOpen(o) }}>
                <DialogContent className="sm:max-w-[420px]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Forma de pagamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor={`pay-method-${proposal.id}`}>Método</Label>
                            <Select value={payMethod} onValueChange={setPayMethod}>
                                <SelectTrigger id={`pay-method-${proposal.id}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHOD_OPTIONS.map(opt => (
                                        <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`pay-inst-${proposal.id}`}>Parcelas</Label>
                            <Input id={`pay-inst-${proposal.id}`} type="number" min={1} value={payInstallments} onChange={(e) => setPayInstallments(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setPayOpen(false)} disabled={savingPay}>Cancelar</Button>
                        <Button onClick={async () => {
                            try {
                                setSavingPay(true)
                                const installments = Math.max(1, Number(payInstallments || '1'))
                                // Save payment first
                                const resp = await updateProposalPayment(proposal.id, { payment_method: payMethod as any, payment_installments: installments })
                                setProposal(prev => prev ? { ...prev, payment_method: resp.payment_method as any, payment_installments: resp.payment_installments as any, dataAlteracao: (resp as any).dataAlteracao ?? prev.dataAlteracao } : prev)
                                // Then set status to aprovada
                                const resStatus = await updateProposalStatus(proposal.id, 'aprovada')
                                setProposal(prev => prev ? { ...prev, status: resStatus.status, dataAlteracao: resStatus.dataAlteracao ?? prev.dataAlteracao } : prev)
                                toastSuccess('Pagamento salvo e proposta aprovada')
                                setPayOpen(false)
                                try { const h = await getProposalHistory(proposal.id); setHistory(h) } catch { }
                            } catch (e: any) {
                                toastError(e?.response?.data?.message || 'Falha ao salvar pagamento')
                            } finally {
                                setSavingPay(false)
                            }
                        }} disabled={savingPay}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// Confirmation Dialog component inline
// Render after the main component return block

