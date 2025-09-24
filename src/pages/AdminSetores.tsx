import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toastError, toastSuccess } from '@/lib/customToast'
import { createSetor, deleteSetor, listSetores, updateSetor, type Setor } from '@/services/setoresAdmin'

export default function AdminSetores() {
  const [items, setItems] = useState<Setor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ nome: string }>({ nome: '' })
  const [newForm, setNewForm] = useState<{ nome: string }>({ nome: '' })

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const res = await listSetores()
      setItems(res.setores || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar setores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
  return items.filter(s => String(s.nome || '').toLowerCase().includes(q))
  }, [items, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * pageSize
  const end = start + pageSize
  const paged = filtered.slice(start, end)

  async function onCreate() {
    const nome = (newForm.nome || '').trim()
    if (!nome) return
    try {
      const created = await createSetor({ nome })
      setItems(prev => [...prev, created])
      setNewForm({ nome: '' })
      toastSuccess('Setor criado')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao criar setor')
    }
  }

  function startEdit(s: Setor) {
    setEditingId(s.id)
    setForm({ nome: s.nome || '' })
  }

  async function onSaveEdit(id: number) {
    const nome = (form.nome || '').trim()
    if (!nome) return
    try {
      const updated = await updateSetor(id, { nome })
      setItems(prev => prev.map(p => p.id === id ? updated : p))
      setEditingId(null)
      toastSuccess('Setor atualizado')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao atualizar setor')
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Excluir este setor?')) return
    try {
      await deleteSetor(id)
      setItems(prev => prev.filter(p => p.id !== id))
      toastSuccess('Setor excluído')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao excluir setor')
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title="Setores | Administrativo" />
  <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nome ou descrição..." className="max-w-xl" />
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-80" htmlFor="pageSize">Itens por página</label>
            <select id="pageSize" className="border rounded-md px-2 py-1 text-sm bg-background" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm">Novo setor</label>
            <Input value={newForm.nome} onChange={(e) => setNewForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do setor" />
          </div>
          <div className="md:col-span-2" />
          <div className="md:col-span-3">
            <Button className="button-primary" onClick={onCreate} disabled={!newForm.nome.trim()}>Adicionar</Button>
          </div>
        </div>

        {loading && <div>Carregando...</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    {editingId === s.id ? (
                      <Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} />
                    ) : (
                      <span>{s.nome}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === s.id ? (
                      <>
                        <Button size="sm" className="button-primary" onClick={() => onSaveEdit(s.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(s)}>Editar</Button>
                        <Button size="sm" className="button-remove" onClick={() => onDelete(s.id)}>Excluir</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-6 text-sm opacity-70">Nenhum setor encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            Mostrando {filtered.length === 0 ? 0 : start + 1}–{Math.min(end, filtered.length)} de {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={pageSafe <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
            <span>Página {pageSafe} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={pageSafe >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
