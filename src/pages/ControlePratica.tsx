import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { listLivroRegistros, updateLivroRegistro } from '@/services/livroRegistros'
import type { LivroRegistro } from '@/services/livroRegistros'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { IconDownload } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// interface Curso removed; curso options will be derived from data

function formatDateBR(value?: string | null) {
  if (!value) return ''
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(value)
  if (!m) {
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

export default function ControlePraticaPage() {
  const [loading, setLoading] = useState(false)
  const [registros, setRegistros] = useState<LivroRegistro[]>([])
  const [filters, setFilters] = useState<{ empresa_id: string; curso_id: string; somentePendentes: boolean; busca: string }>({ empresa_id: '', curso_id: '', somentePendentes: true, busca: '' })
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)
  const [confirmState, setConfirmState] = useState<{ open: boolean; scope: 'single' | 'bulk'; next: boolean; ids: number[] }>({ open: false, scope: 'single', next: false, ids: [] })

  async function load() {
    setLoading(true)
    try {
      // Usamos modalidade "resencial" para casar LIKE e pegar Presencial e Semipresencial
      const res = await listLivroRegistros({ modalidade: 'resencial', limit: 200 })
  const list = res.registros || []
  setRegistros(list)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar registros')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds(prev => {
      const copy = new Set(prev)
      if (checked) copy.add(id); else copy.delete(id)
      return copy
    })
  }

  function toggleSelectAllCurrentPage(checked: boolean) {
    setSelectedIds(prev => {
      const copy = new Set(prev)
      if (checked) {
        pageItems.forEach(r => copy.add(r.id))
      } else {
        pageItems.forEach(r => copy.delete(r.id))
      }
      return copy
    })
  }

  // moved below after pageItems definition

  async function handleBulkUpdatePratica(next: boolean) {
    const ids = Array.from(selectedIds)
    if (!ids.length) { toast.error('Selecione pelo menos um registro'); return }
    setBulkSaving(true)
    // snapshot valores anteriores
    const prevMap = new Map<number, boolean>()
    registros.forEach(r => { if (selectedIds.has(r.id)) prevMap.set(r.id, !!r.pratica) })
    // otimista
    setRegistros(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, pratica: next } : r))
    try {
      const results = await Promise.allSettled(ids.map(id => updateLivroRegistro(id, { pratica: next } as any)))
      const failed: number[] = []
      results.forEach((res, idx) => { if (res.status === 'rejected') failed.push(ids[idx]) })
      if (failed.length) {
        // rollback falhas
        setRegistros(prev => prev.map(r => failed.includes(r.id) ? { ...r, pratica: prevMap.get(r.id) ?? r.pratica } : r))
        toast.error(`Falhou em ${failed.length} de ${ids.length} registros`)
      } else {
        toast.success(`Atualizados ${ids.length} registros`)
      }
    } catch (e: any) {
      // rollback geral
      setRegistros(prev => prev.map(r => prevMap.has(r.id) ? { ...r, pratica: prevMap.get(r.id)! } : r))
      toast.error(e?.message || 'Falha ao atualizar registros')
    } finally {
      setBulkSaving(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // removed fetch of cursos; options will be computed from registros

  // client-side filter/paging for usability
  const filtered = useMemo(() => {
    const empresaId = filters.empresa_id ? Number(filters.empresa_id) : null
    const cursoId = filters.curso_id ? Number(filters.curso_id) : null
    const q = filters.busca.trim().toLowerCase()
    return (registros || []).filter(r => {
      if (empresaId && r.empresa_id !== empresaId) return false
      if (cursoId && r.curso_id !== cursoId) return false
      if (filters.somentePendentes && r.pratica) return false
      if (q) {
        const participante = (r.participante || '').toLowerCase()
        const empresa = (r.empresa_nome || String(r.empresa_id || '')).toLowerCase()
        const curso = (r.curso_nome || String(r.curso_id || '')).toLowerCase()
        if (!participante.includes(q) && !empresa.includes(q) && !curso.includes(q)) return false
      }
      return true
    })
  }, [registros, filters])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const safePageIndex = useMemo(() => Math.min(Math.max(0, pageIndex), totalPages - 1), [pageIndex, totalPages])
  const pageItems = useMemo(() => filtered.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize), [filtered, safePageIndex, pageSize])

  // Empresas disponíveis com base na tabela atual (excluindo o filtro de empresa para evitar ciclo)
  const filteredNoEmpresa = useMemo(() => {
    const cursoId = filters.curso_id ? Number(filters.curso_id) : null
    const q = filters.busca.trim().toLowerCase()
    return (registros || []).filter(r => {
      if (cursoId && r.curso_id !== cursoId) return false
      if (filters.somentePendentes && r.pratica) return false
      if (q) {
        const participante = (r.participante || '').toLowerCase()
        const empresa = (r.empresa_nome || String(r.empresa_id || '')).toLowerCase()
        const curso = (r.curso_nome || String(r.curso_id || '')).toLowerCase()
        if (!participante.includes(q) && !empresa.includes(q) && !curso.includes(q)) return false
      }
      return true
    })
  }, [registros, filters.curso_id, filters.somentePendentes, filters.busca])

  const empresasDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const r of filteredNoEmpresa) {
      if (!r?.empresa_id) continue
      const nome = r.empresa_nome || String(r.empresa_id)
      if (!map.has(r.empresa_id)) map.set(r.empresa_id, nome)
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  }, [filteredNoEmpresa])

  // Se a empresa selecionada não está disponível após filtros, resetar para 'todas'
  useEffect(() => {
    if (filters.empresa_id && !empresasDisponiveis.some(e => String(e.id) === filters.empresa_id)) {
      setFilters(f => ({ ...f, empresa_id: '' }))
    }
  }, [empresasDisponiveis])

  // Cursos disponíveis com base na tabela atual (excluindo o filtro de curso para evitar ciclo)
  const filteredNoCurso = useMemo(() => {
    const empresaId = filters.empresa_id ? Number(filters.empresa_id) : null
    const q = filters.busca.trim().toLowerCase()
    return (registros || []).filter(r => {
      if (empresaId && r.empresa_id !== empresaId) return false
      if (filters.somentePendentes && r.pratica) return false
      if (q) {
        const participante = (r.participante || '').toLowerCase()
        const empresa = (r.empresa_nome || String(r.empresa_id || '')).toLowerCase()
        const curso = (r.curso_nome || String(r.curso_id || '')).toLowerCase()
        if (!participante.includes(q) && !empresa.includes(q) && !curso.includes(q)) return false
      }
      return true
    })
  }, [registros, filters.empresa_id, filters.somentePendentes, filters.busca])

  const cursosDisponiveis = useMemo(() => {
    const map = new Map<number, string>()
    for (const r of filteredNoCurso) {
      if (!r?.curso_id) continue
      const nome = r.curso_nome || String(r.curso_id)
      if (!map.has(r.curso_id)) map.set(r.curso_id, nome)
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  }, [filteredNoCurso])

  // Se o curso selecionado não está disponível após filtros, resetar para 'todos'
  useEffect(() => {
    if (filters.curso_id && !cursosDisponiveis.some(c => String(c.id) === filters.curso_id)) {
      setFilters(f => ({ ...f, curso_id: '' }))
    }
  }, [cursosDisponiveis])

  const allCurrentSelected = useMemo(() => pageItems.length > 0 && pageItems.every(r => selectedIds.has(r.id)), [pageItems, selectedIds])
  const someCurrentSelected = useMemo(() => pageItems.some(r => selectedIds.has(r.id)) && !allCurrentSelected, [pageItems, selectedIds, allCurrentSelected])

  useEffect(() => {
    setPageIndex(0)
  }, [filters.empresa_id, filters.curso_id, filters.somentePendentes, filters.busca, pageSize])

  function exportCSV() {
    if (!filtered.length) { toast.error('Nada para exportar'); return }
    const headers = ['Data_Aquisicao','Participante','Empresa','Curso','Pratica']
    const lines = filtered.map(r => [
      formatDateBR(r.data_aquisicao) || '',
      escapeCSV(r.participante),
      escapeCSV(r.empresa_nome || String(r.empresa_id)),
      escapeCSV(r.curso_nome || String(r.curso_id)),
      r.pratica ? 'Sim' : 'Não'
    ].join(','))
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'controle_pratica.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function escapeCSV(v: string) { return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }


  async function handleTogglePratica(r: LivroRegistro, next: boolean) {
    if (!r?.id) return
    setSavingId(r.id)
    // otimista
    setRegistros(prev => prev.map(it => it.id === r.id ? { ...it, pratica: next } : it))
    try {
      await updateLivroRegistro(r.id, { pratica: next } as any)
    } catch (e: any) {
      // rollback e aviso
      setRegistros(prev => prev.map(it => it.id === r.id ? { ...it, pratica: !next } : it))
      toast.error(e?.message || 'Falha ao atualizar prática')
    } finally {
      setSavingId(null)
    }
  }

  function openConfirmSingle(r: LivroRegistro, next: boolean) {
    setConfirmState({ open: true, scope: 'single', next, ids: [r.id] })
  }

  function openConfirmBulk(next: boolean) {
    const ids = Array.from(selectedIds)
    if (!ids.length) { toast.error('Selecione pelo menos um registro'); return }
    setConfirmState({ open: true, scope: 'bulk', next, ids })
  }

  async function onConfirm() {
    const { scope, next, ids } = confirmState
    if (!ids.length) { setConfirmState(s => ({ ...s, open: false })); return }
    if (scope === 'single') {
      const id = ids[0]
      const r = registros.find(x => x.id === id)
      if (r) await handleTogglePratica(r, next)
    } else {
      await handleBulkUpdatePratica(next)
    }
    setConfirmState(s => ({ ...s, open: false }))
  }
  return (
    <div className="container-main">
      <SiteHeader title="Controle de Prática" />
      <div className="p-4 space-y-4">
        {/* Ações e filtros */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs">Empresa</label>
              <Select value={filters.empresa_id || 'all'} onValueChange={(v) => setFilters(f => ({ ...f, empresa_id: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {empresasDisponiveis.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs">Curso</label>
              <Select value={filters.curso_id || 'all'} onValueChange={(v) => setFilters(f => ({ ...f, curso_id: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {cursosDisponiveis.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs">Buscar</label>
              <Input placeholder="Aluno, empresa ou curso" value={filters.busca} onChange={e => setFilters(f => ({ ...f, busca: e.target.value }))} className="h-8 w-[240px]" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Checkbox id="pendentes" checked={filters.somentePendentes} onCheckedChange={(v) => setFilters(f => ({ ...f, somentePendentes: Boolean(v) }))} />
              <label htmlFor="pendentes" className="text-sm">Somente pendentes</label>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {selectedIds.size > 0 && (
              <span className="text-sm text-muted-foreground">Selecionados: {selectedIds.size}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => openConfirmBulk(true)} disabled={bulkSaving || selectedIds.size === 0}>Marcar como realizada</Button>
            <Button variant="outline" size="sm" onClick={() => openConfirmBulk(false)} disabled={bulkSaving || selectedIds.size === 0}>Marcar como pendente</Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="flex items-center gap-1"><IconDownload size={16} /> Exportar</Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-lg border">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allCurrentSelected ? true : (someCurrentSelected ? 'indeterminate' : false)}
                      onCheckedChange={(v) => toggleSelectAllCurrentPage(Boolean(v))}
                    />
                  </TableHead>
                  <TableHead>Data de Aquisição</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Prática</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 w-full text-center"><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ) : pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 w-full text-center text-muted-foreground">Nenhum registro</TableCell>
                  </TableRow>
                ) : (
                  pageItems.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={(v) => toggleSelect(r.id, Boolean(v))}
                        />
                      </TableCell>
                      <TableCell>{formatDateBR(r.data_aquisicao) || '-'}</TableCell>
                      <TableCell>{r.participante}</TableCell>
                      <TableCell>{r.empresa_nome || r.empresa_id}</TableCell>
                      <TableCell>{r.curso_nome || r.curso_id}</TableCell>
                      <TableCell>
                        <label className="inline-flex items-center gap-2 select-none">
                          <Checkbox
                            checked={!!r.pratica}
                            disabled={savingId === r.id}
                            onCheckedChange={(v) => openConfirmSingle(r, Boolean(v))}
                          />
                          <span className="text-sm">{r.pratica ? 'Realizada' : 'Pendente'}</span>
                        </label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginação */}
            <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Linhas por página</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0) }}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5,10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">Página {safePageIndex + 1} de {Math.max(1, totalPages)}</span>
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
      </div>
      <Dialog open={confirmState.open} onOpenChange={(o) => setConfirmState(s => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar atualização</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Você deseja {confirmState.next ? 'marcar como realizada' : 'marcar como pendente'} {confirmState.scope === 'bulk' ? `${confirmState.ids.length} registro(s)` : 'este registro'}?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmState(s => ({ ...s, open: false }))}>Cancelar</Button>
            <Button onClick={onConfirm} disabled={bulkSaving || savingId !== null}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
