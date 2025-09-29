import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { getAllUsers, inactivateUser, type User } from '@/services/users'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toastError, toastSuccess } from '@/lib/customToast'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { getUnidades, type Unidade } from '@/services/unidades'
import { getSetores, type Setor } from '@/services/setores'
import { getCargos, type Cargo } from '@/services/cargos'
import { createUser, type CreateUserData } from '@/services/users'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // create user modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])

  const [form, setForm] = useState({ nome: '', sobrenome: '', email: '', senha: '', empresaId: 0, unidadeId: 0, setorId: 0, cargo: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

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

  async function loadAuxData() {
    try {
      const uni = await getUnidades().catch(() => ({ unidades: [] }))
      setUnidades(uni.unidades || [])
      const st = await getSetores().catch(() => ({ setores: [] }))
      setSetores(st.setores || [])
      const cg = await getCargos().catch(() => ({ cargos: [] }))
      setCargos(cg.cargos || [])
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchUsers()
    loadAuxData()
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

  function resetForm() {
    setForm({ nome: '', sobrenome: '', email: '', senha: '', empresaId: 0, unidadeId: 0, setorId: 0, cargo: '' })
    setSelectedFile(null)
  }

  async function handleCreateUser() {
    // basic validation
    if (!form.nome || !form.email || !form.senha) { toastError('Nome, email e senha são obrigatórios'); return }
    setCreating(true)
    try {
      const payload: CreateUserData = {
        nome: form.nome,
        sobrenome: form.sobrenome || '',
        email: form.email,
        senha: form.senha,
        empresaId: Number(form.empresaId) || 0,
        unidadeId: Number(form.unidadeId) || 0,
        setorId: Number(form.setorId) || 0,
        cargo: undefined,
        cargoId: form.cargo ? Number(form.cargo) : undefined,
      }
      const created = await createUser(payload)
      // created may be { user } or user directly; try to extract id
  const anyCreated: any = created
  const newUserId = anyCreated?.user?.id || anyCreated?.id
      // if a file was selected, upload it to /api/usuarios/:id/photo
      if (newUserId && selectedFile) {
        try {
          const fd = new FormData()
          fd.append('file', selectedFile)
          const upRes = await fetch(`/api/usuarios/${newUserId}/photo`, { method: 'POST', body: fd })
          if (!upRes.ok) {
            const err = await upRes.json().catch(() => ({ message: 'Erro ao enviar foto' }))
            throw new Error(err.message || 'Erro ao enviar foto')
          }
        } catch (e: any) {
          // show error but don't block user creation
          toastError(e?.message || 'Usuário criado, mas falha ao enviar foto')
        }
      }
      toastSuccess('Usuário criado')
      // refresh list
      await fetchUsers()
      setCreateOpen(false)
      resetForm()
    } catch (err: any) {
      toastError(err?.message || 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title="Usuários | Administrativo" />

  <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Buscar por nome, email, cargo, unidade ou setor..."
            className="max-w-xl"
          />
          <div className="flex items-center gap-2">
            <Dialog open={createOpen} onOpenChange={(o) => setCreateOpen(o)}>
              <DialogTrigger asChild>
                <Button size="sm" className="button-primary">Novo usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo usuário</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    <Input placeholder="Sobrenome" value={form.sobrenome} onChange={e => setForm(f => ({ ...f, sobrenome: e.target.value }))} />
                  </div>
                  <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <Input placeholder="Senha" type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
                  <Select onValueChange={v => setForm(f => ({ ...f, unidadeId: Number(v) }))}>
                    <SelectTrigger size="sm"><SelectValue placeholder="Unidade" /></SelectTrigger>
                    <SelectContent>
                      {unidades.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={v => setForm(f => ({ ...f, setorId: Number(v) }))}>
                    <SelectTrigger size="sm"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      {setores.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={v => setForm(f => ({ ...f, cargo: v }))}>
                    <SelectTrigger size="sm"><SelectValue placeholder="Cargo" /></SelectTrigger>
                    <SelectContent>
                      {cargos.map(cg => <SelectItem key={cg.id} value={String(cg.id)}>{cg.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div>
                    <label className="text-sm">Foto do usuário</label>
                    <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                  </div>
                </div>
                <DialogFooter>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setCreateOpen(false); resetForm() }} variant="ghost">Cancelar</Button>
                    <Button size="sm" onClick={() => handleCreateUser()} disabled={creating}>{creating ? 'Criando...' : 'Criar usuário'}</Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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

        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[800px]">
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
