import React, { useEffect, useState, useMemo } from 'react'
import { listLivroRegistros, createLivroRegistro, deleteLivroRegistro } from '@/services/livroRegistros'
import type { LivroRegistro } from '@/services/livroRegistros'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { IconDownload, IconTrash, IconCopy, IconDotsVertical, IconSearch, IconX } from '@tabler/icons-react'
import { getAllCompanies } from '@/services/companies'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Cursos: criar fallback rápido através do catálogo de propostas se existir endpoint (usando /propostas/catalog/cursos)

interface Curso { id: number; nome: string }

interface NewForm {
  numero?: string
  data_aquisicao?: string
  participante: string
  empresa_id: number
  curso_id: number
  instrutor?: string
  carga_horaria: number
  data_conclusao: string
  modalidade: string
  sesmo: boolean
  observacoes?: string
}

const emptyForm: NewForm = {
  numero: '',
  data_aquisicao: '',
  participante: '',
  empresa_id: 0,
  curso_id: 0,
  instrutor: '',
  carga_horaria: 0,
  data_conclusao: '',
  modalidade: '',
  sesmo: false
}

// Formata data ISO/"YYYY-MM-DD" para padrão brasileiro dd/MM/yyyy
function formatDateBR(value?: string | null) {
  if (!value) return ''
  // aceita 'YYYY-MM-DD' ou ISO completo
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(value)
  if (!m) {
    // tentativa de parse genérica
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  const [, y, mo, d] = m
  return `${d}/${mo}/${y}`
}

export default function LivroRegistrosPage() {
  const [data, setData] = useState<LivroRegistro[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NewForm>({ ...emptyForm })
  const [empresas, setEmpresas] = useState<Array<{ id: number; nome: string }>>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [filters, setFilters] = useState({ participante: '', modalidade: '', sesmo: 'all', empresa_id: '', curso_id: '' })
  const [dateRange, setDateRange] = useState({ inicio: '', fim: '' })
  // pagination + local table state (client-side paging for the already-filtered server result)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rows, setRows] = useState<LivroRegistro[]>([])
  const [confirmDelete, setConfirmDelete] = useState<{ id: number | null; open: boolean }>({ id: null, open: false })
  // estado 'duplicating' removido (não utilizado diretamente)
  // const [duplicating, setDuplicating] = useState<LivroRegistro | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await listLivroRegistros({
        participante: filters.participante || undefined,
        modalidade: filters.modalidade || undefined,
        sesmo: filters.sesmo === 'all' ? undefined : (filters.sesmo === '1' ? 1 : 0),
        empresa_id: filters.empresa_id ? Number(filters.empresa_id) : undefined,
        curso_id: filters.curso_id ? Number(filters.curso_id) : undefined,
        data_conclusao_inicio: dateRange.inicio || undefined,
        data_conclusao_fim: dateRange.fim || undefined,
        limit: pageSize,
        offset: pageIndex * pageSize
      })
      setData(res.registros)
      setRows(res.registros)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar')
    } finally { setLoading(false) }
  }

  // load data when filters/dateRange or pagination change
  useEffect(() => { load() }, [filters, dateRange, pageIndex, pageSize])

  useEffect(() => {
    async function fetchAux() {
      try {
        const emp = await getAllCompanies().catch(()=>({ companies: [] }))
        setEmpresas(emp.companies?.map(c => ({ id: c.id, nome: c.nome })) || [])
        // cursos via catálogo de propostas
        const token = localStorage.getItem('token')
        const res = await fetch((import.meta.env.VITE_API_URL || '/api') + '/propostas/catalog/cursos', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
        if (res.ok) {
          const json = await res.json()
          const arr: Curso[] = (json.cursos || json || []).map((c: any) => ({ id: c.id ?? c.curso_id ?? c.cursoId ?? c[0], nome: c.nome ?? c.curso_nome ?? c.nome_curso ?? c[1] }))
          setCursos(arr.filter(c => c.id && c.nome))
        }
      } catch { /* ignore */ }
    }
    fetchAux()
  }, [])

  // keep local rows in sync with loaded data
  useEffect(() => { setRows(data); setPageIndex(0) }, [data])

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 150)
    return () => clearTimeout(t)
  }, [search])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement
    const { name } = target
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm(f => ({ ...f, [name]: target.checked }))
    } else {
      setForm(f => ({ ...f, [name]: target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (!form.participante || !form.empresa_id || !form.curso_id || !form.carga_horaria || !form.data_conclusao || !form.modalidade) {
        toast.error('Preencha os campos obrigatórios')
        return
      }
      const payload = { ...form, empresa_id: Number(form.empresa_id), curso_id: Number(form.curso_id), carga_horaria: Number(form.carga_horaria) }
      const created = await createLivroRegistro(payload as any)
      toast.success('Registro criado')
      setData(d => [created, ...d])
      setOpen(false)
      setForm({ ...emptyForm })
    } catch (e: any) {
      toast.error(e.message || 'Erro ao criar registro')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLivroRegistro(id)
      setData(d => d.filter(r => r.id !== id))
      toast.success('Removido')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover')
    } finally {
      setConfirmDelete({ id: null, open: false })
    }
  }

  // sort not implemented for this table (server-side sorting could be added)

  function exportCSV() {
    if (!data.length) { toast.error('Nada para exportar'); return }
    const headers = ['ID','Numero','Data_Aquisicao','Participante','Empresa','Curso','Instrutor','Carga_Horaria','Data_Conclusao','Modalidade','SESMO','Observacoes']
    const lines = data.map(r => [
      r.id,
      r.numero||'',
      formatDateBR(r.data_aquisicao)||'',
      escapeCSV(r.participante),
      escapeCSV(r.empresa_nome||String(r.empresa_id)),
      escapeCSV(r.curso_nome||String(r.curso_id)),
      escapeCSV(r.instrutor||''),
      r.carga_horaria,
      formatDateBR(r.data_conclusao),
      r.modalidade,
      r.sesmo?'1':'0',
      escapeCSV(r.observacoes||'')
    ].join(','))
    const csv = [headers.join(','),...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'livro_registros.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function duplicate(r: LivroRegistro) {
    setForm({
      numero: r.numero || '',
      data_aquisicao: r.data_aquisicao || '',
      participante: r.participante,
      empresa_id: r.empresa_id,
      curso_id: r.curso_id,
      instrutor: r.instrutor || '',
      carga_horaria: r.carga_horaria,
      data_conclusao: r.data_conclusao,
      modalidade: r.modalidade,
      sesmo: r.sesmo,
      observacoes: r.observacoes || ''
    })
    setOpen(true)
  }

  function escapeCSV(v: string) { return /[",;\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v }

  // client-side filtered + paginated list
  const filtered = useMemo(() => {
    const q = debouncedSearch
    return rows.filter(r => {
      if (q.length === 0) return true
      const participante = (r.participante || '').toString().toLowerCase()
      const empresa = (r.empresa_nome || String(r.empresa_id || '')).toString().toLowerCase()
      const curso = (r.curso_nome || String(r.curso_id || '')).toString().toLowerCase()
      return participante.includes(q) || empresa.includes(q) || curso.includes(q)
    })
  }, [rows, debouncedSearch])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const safePageIndex = useMemo(() => Math.min(Math.max(0, pageIndex), totalPages - 1), [pageIndex, totalPages])
  const pageItems = useMemo(() => filtered.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize), [filtered, safePageIndex, pageSize])

  const LivroActionsMenu: React.FC<{ r: LivroRegistro }> = ({ r }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="data-[state=open]:bg-muted text-muted-foreground">
          <IconDotsVertical />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => { duplicate(r) }}>
          <IconCopy className="mr-2" /> Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setConfirmDelete({ id: r.id, open: true }) }}>
          <IconTrash className="mr-2 text-destructive" /> Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Livro de Registros</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="flex items-center gap-1"><IconDownload size={16}/> Exportar</Button>
          <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Novo Registro</Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo Registro</SheetTitle>
              <SheetDescription>Cadastre um novo item no livro de registros.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 px-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Número</label>
                  <input className="border rounded px-2 py-1" placeholder="Opcional" name="numero" value={form.numero} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Data Aquisição</label>
                  <input className="border rounded px-2 py-1" type="date" name="data_aquisicao" value={form.data_aquisicao} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-medium">Participante *</label>
                  <input className="border rounded px-2 py-1" name="participante" value={form.participante} onChange={handleChange} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Empresa *</label>
                  <Select value={String(form.empresa_id || '')} onValueChange={(v)=> setForm(f=>({...f, empresa_id: Number(v)}))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {empresas.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Curso *</label>
                  <Select value={String(form.curso_id || '')} onValueChange={(v)=> setForm(f=>({...f, curso_id: Number(v)}))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {cursos.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-medium">Instrutor</label>
                  <input className="border rounded px-2 py-1" name="instrutor" value={form.instrutor} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Carga Horária *</label>
                  <input className="border rounded px-2 py-1" name="carga_horaria" value={form.carga_horaria} onChange={handleChange} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Data Conclusão *</label>
                  <input className="border rounded px-2 py-1" type="date" name="data_conclusao" value={form.data_conclusao} onChange={handleChange} required />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-medium">Modalidade *</label>
                  <input className="border rounded px-2 py-1" name="modalidade" value={form.modalidade} onChange={handleChange} required />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input id="sesmo" type="checkbox" name="sesmo" checked={form.sesmo} onChange={handleChange} />
                  <label htmlFor="sesmo" className="text-sm">SESMO</label>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-medium">Observações</label>
                  <Textarea name="observacoes" value={form.observacoes} onChange={handleChange} className="min-h-[90px]" />
                </div>
              </div>
              <SheetFooter className="flex gap-2 pt-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">Salvar</Button>
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Filtros */}
      <div className="border rounded p-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs">Participante</label>
          <Input value={filters.participante} onChange={e=> setFilters(f=>({...f, participante: e.target.value}))} placeholder="Buscar..." className="h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">Modalidade</label>
          <Input value={filters.modalidade} onChange={e=> setFilters(f=>({...f, modalidade: e.target.value}))} placeholder="Modalidade" className="h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">Empresa</label>
          <Select value={filters.empresa_id ? String(filters.empresa_id) : 'all'} onValueChange={v=> setFilters(f=>({...f, empresa_id: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {empresas.map(e=> <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">Curso</label>
          <Select value={filters.curso_id ? String(filters.curso_id) : 'all'} onValueChange={v=> setFilters(f=>({...f, curso_id: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {cursos.map(c=> <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">SESMO</label>
          <Select value={filters.sesmo} onValueChange={v=> setFilters(f=>({...f, sesmo: v }))}>
            <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Sim</SelectItem>
              <SelectItem value="0">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">Conclusão Início</label>
          <Input type="date" value={dateRange.inicio} onChange={e=> setDateRange(r=>({...r, inicio: e.target.value}))} className="h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs">Conclusão Fim</label>
          <Input type="date" value={dateRange.fim} onChange={e=> setDateRange(r=>({...r, fim: e.target.value}))} className="h-8" />
        </div>
        <Button variant="outline" size="sm" onClick={()=> { setPageIndex(0); load() }} className="flex items-center gap-1">Aplicar</Button>
      </div>
      {/* Table (styled) */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Livro de Registros</h3>
          <div />
        </div>
        <div className="px-4 pb-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Pesquisar participante, empresa ou curso"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPageIndex(0) }}
                className="pr-8"
              />
              {search ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSearch(''); setPageIndex(0) }}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="Limpar pesquisa"
                >
                  <IconX />
                </Button>
              ) : (
                <IconSearch className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data Aquisição</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Data Conclusão</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>SESMO</TableHead>
                <TableHead>Obs</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 w-full text-center">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 w-full text-center text-muted-foreground">Nenhum registro</TableCell>
                </TableRow>
              ) : (
                pageItems.map(r => (
                  <TableRow key={r.id} className="align-top">
                    <TableCell>{r.numero || '-'}</TableCell>
                    <TableCell>{formatDateBR(r.data_aquisicao) || '-'}</TableCell>
                    <TableCell>{r.participante}</TableCell>
                    <TableCell>{r.empresa_nome || r.empresa_id}</TableCell>
                    <TableCell>{r.curso_nome || r.curso_id}</TableCell>
                    <TableCell>{r.instrutor || '-'}</TableCell>
                    <TableCell>{r.carga_horaria}</TableCell>
                    <TableCell>{formatDateBR(r.data_conclusao)}</TableCell>
                    <TableCell>{r.modalidade}</TableCell>
                    <TableCell>{r.sesmo ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="max-w-[160px] truncate" title={r.observacoes || ''}>{r.observacoes ? r.observacoes : '-'}</TableCell>
                    <TableCell>
                      <LivroActionsMenu r={r} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Linhas por página</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0) }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm">Página {safePageIndex + 1} de {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>{'<<'}</Button>
                <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={safePageIndex === 0}>{'<'}</Button>
                <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={safePageIndex >= totalPages - 1}>{'>'}</Button>
                <Button variant="outline" size="sm" onClick={() => setPageIndex(totalPages - 1)} disabled={safePageIndex >= totalPages - 1}>{'>>'}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={confirmDelete.open} onOpenChange={(o)=> !o && setConfirmDelete({ id: null, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm">Tem certeza que deseja remover o registro ID {confirmDelete.id}?</p>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={()=> setConfirmDelete({ id: null, open: false })}>Cancelar</Button>
            <Button variant="destructive" onClick={()=> confirmDelete.id && handleDelete(confirmDelete.id)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
