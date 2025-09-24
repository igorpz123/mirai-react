import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toastError, toastSuccess } from '@/lib/customToast'
import { createUnidade, deleteUnidade, listUnidades, updateUnidade, type Unidade } from '@/services/unidadesAdmin'

export default function AdminUnidades() {
  const [items, setItems] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingNome, setEditingNome] = useState('')
  const [newNome, setNewNome] = useState('')

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const res = await listUnidades()
      setItems(res.unidades || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar unidades')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(u => String(u.nome || '').toLowerCase().includes(q))
  }, [items, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * pageSize
  const end = start + pageSize
  const paged = filtered.slice(start, end)

  async function onCreate() {
    const nome = newNome.trim()
    if (!nome) return
    try {
      const created = await createUnidade({ nome })
      setItems(prev => [...prev, created])
      setNewNome('')
      toastSuccess('Unidade criada')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao criar unidade')
    }
  }

  function startEdit(u: Unidade) {
    setEditingId(u.id)
    setEditingNome(u.nome)
  }

  async function onSaveEdit(id: number) {
    const nome = editingNome.trim()
    if (!nome) return
    try {
      const updated = await updateUnidade(id, { nome })
      setItems(prev => prev.map(p => p.id === id ? updated : p))
      setEditingId(null)
      toastSuccess('Unidade atualizada')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao atualizar unidade')
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Excluir esta unidade?')) return
    try {
      await deleteUnidade(id)
      setItems(prev => prev.filter(p => p.id !== id))
      toastSuccess('Unidade excluída')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao excluir unidade')
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title="Unidades | Administrativo" />
  <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nome..." className="max-w-xl" />
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

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm">Nova unidade</label>
            <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Nome da unidade" />
          </div>
          <Button className="button-primary" onClick={onCreate} disabled={!newNome.trim()}>Adicionar</Button>
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
              {paged.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    {editingId === u.id ? (
                      <Input value={editingNome} onChange={(e) => setEditingNome(e.target.value)} />
                    ) : (
                      <span>{u.nome}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === u.id ? (
                      <>
                        <Button size="sm" className="button-primary" onClick={() => onSaveEdit(u.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(u)}>Editar</Button>
                        <Button size="sm" className="button-remove" onClick={() => onDelete(u.id)}>Excluir</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-6 text-sm opacity-70">Nenhuma unidade encontrada.</TableCell>
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
