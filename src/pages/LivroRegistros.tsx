import { useEffect, useState } from 'react'
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
import { IconDownload, IconArrowsSort, IconFilter, IconTrash, IconCopy, IconDotsVertical } from '@tabler/icons-react'
import { getAllCompanies } from '@/services/companies'
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
  const [pagination, setPagination] = useState({ limit: 25, offset: 0 })
  const [sort, setSort] = useState<{ col: string; dir: 'ASC' | 'DESC' }>({ col: 'data_conclusao', dir: 'DESC' })
  const [confirmDelete, setConfirmDelete] = useState<{ id: number | null; open: boolean }>({ id: null, open: false })
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
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
        limit: pagination.limit,
        offset: pagination.offset,
        sort: sort.col,
        order: sort.dir
      })
      setData(res.registros)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters, pagination.offset, pagination.limit, sort, dateRange])

  // Fecha menu de ações ao clicar fora ou pressionar ESC
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target instanceof HTMLElement)) return
      const actionsCell = e.target.closest('[data-actions-menu]')
      if (!actionsCell) setMenuOpenId(null)
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpenId(null) }
    if (menuOpenId !== null) {
      document.addEventListener('click', handleClick)
      window.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [menuOpenId])

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

  function toggleSort(col: string) {
    setSort(s => ({ col, dir: s.col === col ? (s.dir === 'ASC' ? 'DESC' : 'ASC') : 'ASC' }))
  }

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
        <Button variant="outline" size="sm" onClick={()=> { setPagination(p=>({...p, offset:0})); load() }} className="flex items-center gap-1"><IconFilter size={14}/>Aplicar</Button>
      </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="">
            <tr>
              {['numero','data_aquisicao','participante','empresa','curso','instrutor','carga_horaria','data_conclusao','modalidade','sesmo'].map(col => (
                <th key={col} className="p-2 text-left cursor-pointer select-none" onClick={()=> toggleSort(col === 'empresa' ? 'participante' : col)}>
                  <span className="inline-flex items-center gap-1">
                    {col.replace('_',' ').toUpperCase()}
                    {sort.col === (col === 'empresa' ? 'participante' : col) && <IconArrowsSort size={14} className={sort.dir==='ASC'?'rotate-180 transition':'transition'} />}
                  </span>
                </th>
              ))}
              <th className="p-2 text-left">OBS</th>
              <th className="p-2 text-left">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_,i)=>(
              <tr key={i} className="border-t">
                <td colSpan={12} className="p-2"><Skeleton className="h-5 w-full" /></td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr><td colSpan={12} className="p-4 text-center">Nenhum registro</td></tr>
            )}
            {data.map(r => (
              <tr key={r.id} className="border-t hover:bg-foreground/10">
                <td className="p-2">{r.numero || '-'}</td>
                <td className="p-2">{formatDateBR(r.data_aquisicao) || '-'}</td>
                <td className="p-2">{r.participante}</td>
                <td className="p-2">{r.empresa_nome || r.empresa_id}</td>
                <td className="p-2">{r.curso_nome || r.curso_id}</td>
                <td className="p-2">{r.instrutor || '-'}</td>
                <td className="p-2">{r.carga_horaria}</td>
                <td className="p-2">{formatDateBR(r.data_conclusao)}</td>
                <td className="p-2">{r.modalidade}</td>
                <td className="p-2">{r.sesmo ? 'Sim' : 'Não'}</td>
                <td className="p-2 max-w-[160px] truncate" title={r.observacoes || ''}>{r.observacoes? r.observacoes : '-'}</td>
                <td className="relative p-2" data-actions-menu>
                  <button
                    onClick={(e)=> { e.stopPropagation(); setMenuOpenId(menuOpenId === r.id ? null : r.id) }}
                    className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent focus:outline-none border"
                    aria-haspopup="menu"
                    aria-expanded={menuOpenId === r.id}
                    aria-label="Ações"
                  >
                    <IconDotsVertical size={16} />
                  </button>
                  {menuOpenId === r.id && (
                    <div
                      className="absolute right-0 mt-1 w-36 bg-popover/95 backdrop-blur-sm border rounded shadow-md z-20 py-1 text-xs animate-in fade-in"
                      role="menu"
                    >
                      <button
                        className="w-full flex items-center gap-1 px-3 py-1 hover:bg-accent text-left"
                        onClick={()=> { duplicate(r); setMenuOpenId(null) }}
                        role="menuitem"
                      >
                        <IconCopy size={14}/> Duplicar
                      </button>
                      <button
                        className="w-full flex items-center gap-1 px-3 py-1 hover:bg-accent text-left text-red-600"
                        onClick={()=> { setConfirmDelete({ id: r.id, open: true }); setMenuOpenId(null) }}
                        role="menuitem"
                      >
                        <IconTrash size={14}/> Remover
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginação simples */}
      <div className="flex items-center gap-4 justify-end">
        <span className="text-xs text-muted-foreground">Limit:
          <select value={pagination.limit} onChange={e=> setPagination(p=>({ ...p, limit: Number(e.target.value), offset:0 }))} className="ml-1 border rounded px-1 py-0.5 text-xs">
            {[10,25,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </span>
        <Button size="sm" variant="outline" disabled={pagination.offset===0} onClick={()=> setPagination(p=> ({ ...p, offset: Math.max(p.offset - p.limit, 0) }))}>Anterior</Button>
        <Button size="sm" variant="outline" onClick={()=> setPagination(p=> ({ ...p, offset: p.offset + p.limit }))}>Próxima</Button>
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
