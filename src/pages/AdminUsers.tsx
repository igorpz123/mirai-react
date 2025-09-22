import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { getAllUsers, inactivateUser, type User } from '@/services/users'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toastError, toastSuccess } from '@/lib/customToast'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await getAllUsers()
      setUsers(res.users || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => {
      const nome = `${u.nome} ${u.sobrenome || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      const cargo = String((u as any).cargo || u.cargo || '').toLowerCase()
      const unidades = String((u as any).unidade_nomes || u.unidade || '').toLowerCase()
      const setores = String((u as any).setor_nomes || u.setor || '').toLowerCase()
      return nome.includes(q) || email.includes(q) || cargo.includes(q) || unidades.includes(q) || setores.includes(q)
    })
  }, [users, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * pageSize
  const end = start + pageSize
  const paged = filtered.slice(start, end)

  const rows = useMemo(() => paged.map(u => ({
    id: u.id,
    nome: `${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''}`,
    email: u.email,
    cargo: (u as any).cargo || u.cargo || '-',
    foto: (u as any).foto_url || (u as any).fotoUrl || '',
  })), [paged])

  async function handleInactivate(id: number) {
    try {
      await inactivateUser(id)
      toastSuccess('Usuário inativado')
      // remove otimistamente da lista
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao inativar usuário')
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="w-full">
      <SiteHeader title="Usuários | Administrativo" />

      <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6 mx-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Buscar por nome, email, cargo, unidade ou setor..."
            className="max-w-xl"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-80" htmlFor="pageSize">Itens por página</label>
            <select
              id="pageSize"
              className="border rounded-md px-2 py-1 text-sm bg-background"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        {loading && <div>Carregando usuários...</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={r.foto || undefined} alt={r.nome} />
                        <AvatarFallback>{r.nome?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{r.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>
                    {r.cargo ? <Badge variant="secondary">{r.cargo}</Badge> : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" className='button-primary' onClick={() => navigate(`/admin/usuario/${r.id}`)}>Detalhes</Button>
                    {confirmingId === r.id ? (
                      <>
                        <Button size="sm" className='button-remove' onClick={() => handleInactivate(r.id)}>Confirmar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <Button size="sm" className='button-remove' onClick={() => setConfirmingId(r.id)}>Inativar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-sm opacity-70">Nenhum usuário encontrado.</TableCell>
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
