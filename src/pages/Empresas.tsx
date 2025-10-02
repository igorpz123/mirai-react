import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toastError } from '@/lib/customToast'
import { getAllCompanies, type Company, generateAutoTasksForUnit } from '@/services/companies'
import { getUnidades } from '@/services/unidades'
import { getAllUsers, type User } from '@/services/users'

export default function Empresas() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [unidades, setUnidades] = useState<{ id: number; nome: string }[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [selectedUnidade, setSelectedUnidade] = useState<number | ''>('')
  const [selectedTecnico, setSelectedTecnico] = useState<number | ''>('')
  const [sortKey, setSortKey] = useState<'nome' | 'razao_social' | 'cnpj' | 'tecnico'>('nome')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const res = await getAllCompanies()
      setItems((res.companies || []).map((c: any) => ({
        id: c.id,
        nome: c.nome || c.nome_fantasia || '',
        razao_social: c.razao_social,
        cnpj: c.cnpj,
        tecnico_responsavel: c.tecnico_responsavel,
        tecnico_nome: c.tecnico_nome,
        ...c,
      })))
      // fetch filter sources (unidades and usuarios)
      try {
        const u = await getUnidades()
        setUnidades(u.unidades || [])
      } catch {}
      try {
        const us = await getAllUsers()
        setUsuarios(us.users || [])
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas')
      toastError(err instanceof Error ? err.message : 'Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let data = items
    if (q) {
      data = data.filter(e =>
        String(e.nome || '').toLowerCase().includes(q) ||
        String((e as any).razao_social || '').toLowerCase().includes(q) ||
        String((e as any).cnpj || '').toLowerCase().includes(q)
      )
    }
    if (selectedUnidade !== '') {
      data = data.filter(e => Number((e as any).unidade_id ?? (e as any).unidadeId) === Number(selectedUnidade))
    }
    if (selectedTecnico !== '') {
      data = data.filter(e => Number(e.tecnico_responsavel) === Number(selectedTecnico))
    }
    return data
  }, [items, query, selectedUnidade, selectedTecnico])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a: any, b: any) => {
      const va = sortKey === 'tecnico' ? (a.tecnico_nome || a.tecnico_responsavel || '') : (a[sortKey] || '')
      const vb = sortKey === 'tecnico' ? (b.tecnico_nome || b.tecnico_responsavel || '') : (b[sortKey] || '')
      return String(va).localeCompare(String(vb), 'pt-BR') * dir
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const start = (pageSafe - 1) * pageSize
  const end = start + pageSize
  const paged = sorted.slice(start, end)

  function toggleSort(key: 'nome' | 'razao_social' | 'cnpj' | 'tecnico') {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const arrow = (key: 'nome' | 'razao_social' | 'cnpj' | 'tecnico') => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  async function onGenerateAutoTasksForUnit() {
    if (selectedUnidade === '') {
      toastError('Selecione uma unidade para gerar as tarefas automáticas.')
      return
    }
    try {
      setLoading(true)
      const result = await generateAutoTasksForUnit(Number(selectedUnidade))
      const msg = `Processadas ${result.processed} empresas. Tarefas criadas: ${result.createdTotal}.`
      // Use success toast to indicate completion
      import('@/lib/customToast').then(({ toastSuccess }) => toastSuccess(msg)).catch(() => alert(msg))
      // Optionally, refresh list or keep as-is
    } catch (e: any) {
      const m = e?.message || 'Falha ao gerar tarefas automáticas por unidade'
      toastError(m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title="Empresas" />
      <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6 mx-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nome, razão social ou CNPJ..." className="max-w-xl" />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onGenerateAutoTasksForUnit} disabled={loading || selectedUnidade === ''}>Gerar tarefas automáticas (Unidade)</Button>
            </div>
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
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-80" htmlFor="fUnidade">Unidade</label>
              <select
                id="fUnidade"
                className="border rounded-md px-2 py-1 text-sm bg-background"
                value={selectedUnidade === '' ? '' : Number(selectedUnidade)}
                onChange={e => { const v = e.target.value; setSelectedUnidade(v === '' ? '' : Number(v)); setPage(1) }}
              >
                <option value="">Todas</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-80" htmlFor="fTecnico">Técnico</label>
              <select
                id="fTecnico"
                className="border rounded-md px-2 py-1 text-sm bg-background"
                value={selectedTecnico === '' ? '' : Number(selectedTecnico)}
                onChange={e => { const v = e.target.value; setSelectedTecnico(v === '' ? '' : Number(v)); setPage(1) }}
              >
                <option value="">Todos</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{`${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && <div>Carregando empresas...</div>}
        {error && <div className="text-destructive">{error}</div>}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => toggleSort('nome')} className="cursor-pointer select-none">Nome Fantasia{arrow('nome')}</TableHead>
                <TableHead onClick={() => toggleSort('razao_social')} className="cursor-pointer select-none">Razão Social{arrow('razao_social')}</TableHead>
                <TableHead onClick={() => toggleSort('cnpj')} className="cursor-pointer select-none">CNPJ{arrow('cnpj')}</TableHead>
                <TableHead onClick={() => toggleSort('tecnico')} className="cursor-pointer select-none">Técnico Responsável{arrow('tecnico')}</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{e.nome || e.nome_fantasia || '-'}</TableCell>
                  <TableCell>{e.razao_social || '-'}</TableCell>
                  <TableCell>{e.cnpj || '-'}</TableCell>
                  <TableCell>{e.tecnico_nome || e.tecnico_responsavel_nome || e.tecnico_responsavel || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" className="button-primary" onClick={() => navigate(`/empresa/${e.id}`)}>Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm opacity-70">Nenhuma empresa encontrada.</TableCell>
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
