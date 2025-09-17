import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProposalById, type Proposal, getCursosByProposal, getProdutosByProposal, getQuimicosByProposal, type ProposalCurso, type ProposalProduto, type ProposalQuimico, getCoursesCatalog, getProductsCatalog, addCourseToProposal, addChemicalToProposal, addProductToProposal, getProductPrice, type Curso, type Produto, getChemicalsCatalog, type Quimico } from '@/services/proposals'
import ProposalStatusBadge from '@/components/proposal-status-badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SiteHeader } from '@/components/layout/site-header'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function CommercialProposalDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [proposal, setProposal] = React.useState<Proposal | null>(null)
    const [loading, setLoading] = React.useState<boolean>(true)
    const [error, setError] = React.useState<string | null>(null)
    const [cursos, setCursos] = React.useState<ProposalCurso[] | null>(null)
    const [produtos, setProdutos] = React.useState<ProposalProduto[] | null>(null)
    const [quimicos, setQuimicos] = React.useState<ProposalQuimico[] | null>(null)
    const [loadingItens, setLoadingItens] = React.useState<boolean>(false)
    // Catalogs
    const [courses, setCourses] = React.useState<Curso[]>([])
    const [products, setProducts] = React.useState<Produto[]>([])
    const [chemicals, setChemicals] = React.useState<Quimico[]>([])
    React.useEffect(() => {
        let mounted = true
        Promise.all([
            getCoursesCatalog().catch(() => [] as Curso[]),
            getProductsCatalog().catch(() => [] as Produto[]),
            getChemicalsCatalog().catch(() => [] as Quimico[]),
        ]).then(([cs, ps, qs]) => { if (!mounted) return; setCourses(cs); setProducts(ps); setChemicals(qs) })
        return () => { mounted = false }
    }, [])

    // Sheets state
    const [openCourse, setOpenCourse] = React.useState(false)
    const [openChemical, setOpenChemical] = React.useState(false)
    const [openProduct, setOpenProduct] = React.useState(false)
    // Form state
    const [formCourse, setFormCourse] = React.useState({ curso_id: 0, quantidade: 1, valor_unitario: 0, desconto: 0 })
    const [formChemical, setFormChemical] = React.useState({ selectedKey: '', quimico_id: 0, grupo: '', pontos: 0, valor_unitario: 0, desconto: 0 })
    const [formProduct, setFormProduct] = React.useState({ produto_id: 0, quantidade: 1, desconto: 0, precoPrev: 0 })

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
        ])
            .then(([c, q, p]) => {
                if (!mounted) return
                setCursos(c)
                setQuimicos(q)
                setProdutos(p)
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
                            <Button onClick={() => setOpenCourse(true)}>+ Curso</Button>
                            <Button onClick={() => setOpenChemical(true)}>+ Químico</Button>
                            <Button onClick={() => setOpenProduct(true)}>+ Produto</Button>
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

                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Produtos vinculados</h2>
                        {loadingItens ? (
                            <div className="text-sm text-muted-foreground">Carregando itens...</div>
                        ) : (
                            <div className="space-y-6">
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
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cursos.map((c) => (
                                                    <TableRow key={`curso-${c.id}`}>
                                                        <TableCell>{c.curso_nome || c.curso_id}</TableCell>
                                                        <TableCell className="text-right">{Number(c.quantidade ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(c.valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(c.valor_total)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{cursosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(cursosTotals.valor)}</TableCell>
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
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {quimicos.map((q) => (
                                                    <TableRow key={`quimico-${q.id}`}>
                                                        <TableCell>{(q as any).grupo || '—'}</TableCell>
                                                        <TableCell className="text-right">{Number((q as any).pontos ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL((q as any).valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL((q as any).valor_total)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{quimicosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(quimicosTotals.valor)}</TableCell>
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
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {produtos.map((p) => (
                                                    <TableRow key={`produto-${p.id}`}>
                                                        <TableCell>{p.produto_nome || p.produto_id}</TableCell>
                                                        <TableCell className="text-right">{Number(p.quantidade ?? 0)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_unitario)}</TableCell>
                                                        <TableCell className="text-right">{fmtBRL(p.valor_total)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell className="font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-semibold">{produtosTotals.qtd}</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right font-semibold">{fmtBRL(produtosTotals.valor)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
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
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    if (!formCourse.curso_id) { toast.error('Selecione um curso'); return }
                                    if (!formCourse.quantidade || formCourse.quantidade <= 0) { toast.error('Quantidade inválida'); return }
                                    if (!formCourse.valor_unitario || formCourse.valor_unitario <= 0) { toast.error('Valor unitário inválido'); return }
                                    const payload = { ...formCourse }
                                    const res = await addCourseToProposal(Number(id), payload)
                                    if (res.item) {
                                        setCursos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toast.success('Curso adicionado')
                                        setOpenCourse(false)
                                    }
                                } catch {
                                    toast.error('Falha ao adicionar curso')
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
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    if (!formChemical.valor_unitario || formChemical.valor_unitario <= 0) { toast.error('Selecione um químico para preencher o preço'); return }
                                    if (!formChemical.pontos || formChemical.pontos <= 0) { toast.error('Informe os pontos'); return }
                                    const { grupo, pontos, valor_unitario, desconto } = formChemical as any
                                    const res = await addChemicalToProposal(Number(id), { grupo, pontos, valor_unitario, desconto })
                                    if (res.item) {
                                        setQuimicos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toast.success('Químico adicionado')
                                        setOpenChemical(false)
                                    }
                                } catch {
                                    toast.error('Falha ao adicionar químico')
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
                                        toast.error('Falha ao calcular preço')
                                    }
                                }}
                            >Calcular preço</Button>
                        </div>
                    </div>
                    <SheetFooter className="mt-4">
                        <Button
                            onClick={async () => {
                                try {
                                    if (!id) return
                                    const payload = { produto_id: formProduct.produto_id, quantidade: formProduct.quantidade, desconto: formProduct.desconto }
                                    const res = await addProductToProposal(Number(id), payload)
                                    if (res.item) {
                                        setProdutos(prev => [res.item as any, ...(prev ?? [])])
                                        setProposal(prev => prev ? { ...prev, valor_total: Number((prev.valor_total ?? 0)) + Number((res.item as any).valor_total ?? 0) } : prev)
                                        toast.success('Produto adicionado')
                                        setOpenProduct(false)
                                    }
                                } catch {
                                    toast.error('Falha ao adicionar produto')
                                }
                            }}
                        >Salvar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    )
}
