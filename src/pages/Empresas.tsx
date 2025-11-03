import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconDotsVertical, IconTrash } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toastError } from '@/lib/customToast'
import { getAllCompanies, type Company, generateAutoTasksForUnit, updateCompany, createCompany, getCompanyByCNPJ } from '@/services/companies'
import { toastSuccess } from '@/lib/customToast'
import { getUnidades } from '@/services/unidades'
import { getAllUsers, type User } from '@/services/users'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IconPlus } from '@tabler/icons-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'

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
  const [confirmInativar, setConfirmInativar] = useState<{ open: boolean; id?: number; nome?: string }>({ open: false })
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [futureYearsDialog, setFutureYearsDialog] = useState(false)
  const [futureYears, setFutureYears] = useState(1) // Padrão: gerar 1 ano futuro
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    cidade: '',
    telefone: '',
    periodicidade: '',
    data_renovacao: '',
    tecnico_responsavel: '',
    unidade_responsavel: ''
  })

  // Função para formatar CNPJ
  function formatCNPJ(value: string) {
    const cleanValue = value.replace(/\D/g, '')
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18)
  }

  // Função para formatar telefone
  function formatPhone(value: string) {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 10) {
      return cleanValue
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    } else {
      return cleanValue
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
  }

  // Função para validar CNPJ
  function isValidCNPJ(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return false
    
    // Elimina CNPJs inválidos conhecidos
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false
    
    // Valida DVs
    let tamanho = cleanCnpj.length - 2
    let numeros = cleanCnpj.substring(0, tamanho)
    let digitos = cleanCnpj.substring(tamanho)
    let soma = 0
    let pos = tamanho - 7
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado !== parseInt(digitos.charAt(0))) return false
    
    tamanho = tamanho + 1
    numeros = cleanCnpj.substring(0, tamanho)
    soma = 0
    pos = tamanho - 7
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    return resultado === parseInt(digitos.charAt(1))
  }

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

  async function inativarEmpresa(id: number) {
    try {
      setLoading(true)
      await updateCompany(id, { status: 'inativo' } as any)
      // atualiza status localmente sem novo fetch para sensação de instantâneo
      setItems(prev => prev.map(e => Number(e.id) === Number(id) ? { ...e, status: 'inativo' } : e))
      try { toastSuccess('Empresa inativada') } catch {}
    } catch (e: any) {
      toastError(e?.message || 'Falha ao inativar empresa')
    } finally {
      setLoading(false)
    }
  }

  async function reativarEmpresa(id: number) {
    try {
      setLoading(true)
      await updateCompany(id, { status: 'ativo' } as any)
      setItems(prev => prev.map(e => Number(e.id) === Number(id) ? { ...e, status: 'ativo' } : e))
      try { toastSuccess('Empresa reativada') } catch {}
    } catch (e: any) {
      toastError(e?.message || 'Falha ao reativar empresa')
    } finally {
      setLoading(false)
    }
  }

  async function onGenerateAutoTasksForUnit() {
    if (selectedUnidade === '') {
      toastError('Selecione uma unidade para gerar as tarefas automáticas.')
      return
    }
    
    // Abrir diálogo para confirmar anos futuros
    setFutureYearsDialog(true)
  }

  async function confirmGenerateAutoTasks() {
    if (selectedUnidade === '') return
    
    try {
      setLoading(true)
      setFutureYearsDialog(false)
      const result = await generateAutoTasksForUnit(Number(selectedUnidade), futureYears)
      const msg = `Processadas ${result.processed} empresas. Tarefas criadas: ${result.createdTotal} (${result.yearsProcessed} ano${result.yearsProcessed > 1 ? 's' : ''}).`
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

  async function handleCreateCompany() {
    if (!formData.cnpj || !formData.razao_social || !formData.nome_fantasia) {
      toastError('CNPJ, Razão Social e Nome Fantasia são obrigatórios.')
      return
    }

    if (!isValidCNPJ(formData.cnpj)) {
      toastError('CNPJ inválido. Verifique o número informado.')
      return
    }

    try {
      setCreateLoading(true)
      
      // Verificar se já existe empresa com esse CNPJ
      const existingCompany = await getCompanyByCNPJ(formData.cnpj.replace(/\D/g, ''))
      if (existingCompany) {
        toastError('Já existe uma empresa cadastrada com este CNPJ.')
        return
      }

      const payload: any = {
        cnpj: formData.cnpj.replace(/\D/g, ''), // Remove formatação para enviar
        razao_social: formData.razao_social,
        nome_fantasia: formData.nome_fantasia,
      }

      if (formData.cidade) payload.cidade = formData.cidade
      if (formData.telefone) payload.telefone = formData.telefone
      if (formData.periodicidade) payload.periodicidade = Number(formData.periodicidade) || null
      if (formData.data_renovacao) payload.data_renovacao = formData.data_renovacao
      if (formData.tecnico_responsavel) payload.tecnico_responsavel = Number(formData.tecnico_responsavel) || null
      if (formData.unidade_responsavel) payload.unidade_responsavel = Number(formData.unidade_responsavel) || null

      const newCompany = await createCompany(payload)
      
      // Adicionar a nova empresa à lista local
      setItems(prev => [...prev, {
        ...newCompany,
        nome: newCompany.nome || formData.nome_fantasia,
        razao_social: formData.razao_social,
        cnpj: formData.cnpj,
        tecnico_responsavel: Number(formData.tecnico_responsavel) || null,
        tecnico_nome: usuarios.find(u => u.id === Number(formData.tecnico_responsavel))?.nome || null,
      }])

      // Limpar formulário e fechar sheet
      setFormData({
        cnpj: '',
        razao_social: '',
        nome_fantasia: '',
        cidade: '',
        telefone: '',
        periodicidade: '',
        data_renovacao: '',
        tecnico_responsavel: '',
        unidade_responsavel: ''
      })
      setCreateSheetOpen(false)
      toastSuccess('Empresa criada com sucesso!')
    } catch (e: any) {
      toastError(e?.message || 'Erro ao criar empresa')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title="Empresas" />
      <div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6 mx-6">
        {/* Dialog de confirmação para inativar */}
        <Dialog open={confirmInativar.open} onOpenChange={(open) => setConfirmInativar(s => ({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inativar empresa</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja inativar {confirmInativar.nome ? `"${confirmInativar.nome}"` : 'esta empresa'}? Essa ação pode ser revertida depois.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmInativar({ open: false })}>Cancelar</Button>
              <Button
                className='button-remove'
                onClick={async () => {
                  const id = confirmInativar.id
                  setConfirmInativar({ open: false })
                  if (id) await inativarEmpresa(Number(id))
                }}
              >
                <IconTrash /> Inativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de configuração de anos futuros */}
        <Dialog open={futureYearsDialog} onOpenChange={setFutureYearsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Tarefas Automáticas</DialogTitle>
              <DialogDescription>
                Configure quantos anos futuros deseja gerar tarefas (além do ano atual).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="futureYears">Anos futuros a gerar</Label>
              <Input
                id="futureYears"
                type="number"
                min="0"
                max="5"
                value={futureYears}
                onChange={(e) => setFutureYears(Math.max(0, Math.min(5, Number(e.target.value))))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Será gerado para o ano atual ({new Date().getFullYear()})
                {futureYears > 0 && ` + ${futureYears} ano${futureYears > 1 ? 's' : ''} futuro${futureYears > 1 ? 's' : ''}`}
                {futureYears > 0 && ` (até ${new Date().getFullYear() + futureYears})`}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFutureYearsDialog(false)}>Cancelar</Button>
              <Button onClick={confirmGenerateAutoTasks}>
                Gerar Tarefas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar por nome, razão social ou CNPJ..." className="max-w-xl" />
            <div className="flex items-center gap-2">
              <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm">
                    <IconPlus className="mr-2" />
                    Nova Empresa
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Criar Nova Empresa</SheetTitle>
                    <SheetDescription>
                      Preencha os dados da nova empresa
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4 mx-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <div className="relative">
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => {
                            const formattedCNPJ = formatCNPJ(e.target.value)
                            setFormData(prev => ({ ...prev, cnpj: formattedCNPJ }))
                          }}
                          placeholder="00.000.000/0000-00"
                          disabled={createLoading}
                          maxLength={18}
                          className={formData.cnpj && !isValidCNPJ(formData.cnpj) ? 'border-red-500' : ''}
                        />
                        {formData.cnpj && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {isValidCNPJ(formData.cnpj) ? (
                              <span className="text-green-600 text-sm">✓</span>
                            ) : (
                              <span className="text-red-600 text-sm">✗</span>
                            )}
                          </div>
                        )}
                      </div>
                      {formData.cnpj && !isValidCNPJ(formData.cnpj) && (
                        <span className="text-red-600 text-xs">CNPJ inválido</span>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="razao_social">Razão Social *</Label>
                      <Input
                        id="razao_social"
                        value={formData.razao_social}
                        onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                        placeholder="Razão social da empresa"
                        disabled={createLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                      <Input
                        id="nome_fantasia"
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                        placeholder="Nome fantasia da empresa"
                        disabled={createLoading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                          placeholder="Cidade da empresa"
                          disabled={createLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => {
                            const formattedPhone = formatPhone(e.target.value)
                            setFormData(prev => ({ ...prev, telefone: formattedPhone }))
                          }}
                          placeholder="(00) 00000-0000"
                          disabled={createLoading}
                          maxLength={15}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unidade_responsavel">Unidade Responsável</Label>
                      <select
                        id="unidade_responsavel"
                        className="border rounded-md px-3 py-2 text-sm bg-background"
                        value={formData.unidade_responsavel}
                        onChange={(e) => setFormData(prev => ({ ...prev, unidade_responsavel: e.target.value }))}
                        disabled={createLoading}
                      >
                        <option value="">Selecione uma unidade</option>
                        {unidades.map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tecnico_responsavel">Técnico Responsável</Label>
                      <select
                        id="tecnico_responsavel"
                        className="border rounded-md px-3 py-2 text-sm bg-background"
                        value={formData.tecnico_responsavel}
                        onChange={(e) => setFormData(prev => ({ ...prev, tecnico_responsavel: e.target.value }))}
                        disabled={createLoading}
                      >
                        <option value="">Selecione um técnico</option>
                        {usuarios.map(u => (
                          <option key={u.id} value={u.id}>{`${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''}`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="periodicidade">Periodicidade (dias)</Label>
                        <Input
                          id="periodicidade"
                          type="number"
                          value={formData.periodicidade}
                          onChange={(e) => setFormData(prev => ({ ...prev, periodicidade: e.target.value }))}
                          placeholder="30"
                          disabled={createLoading}
                          min="1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="data_renovacao">Data de Renovação</Label>
                        <Input
                          id="data_renovacao"
                          type="date"
                          value={formData.data_renovacao}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_renovacao: e.target.value }))}
                          disabled={createLoading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          cnpj: '',
                          razao_social: '',
                          nome_fantasia: '',
                          cidade: '',
                          telefone: '',
                          periodicidade: '',
                          data_renovacao: '',
                          tecnico_responsavel: '',
                          unidade_responsavel: ''
                        })
                      }}
                      disabled={createLoading}
                      type="button"
                    >
                      Limpar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCreateSheetOpen(false)}
                      disabled={createLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateCompany}
                      disabled={createLoading || !formData.cnpj || !formData.razao_social || !formData.nome_fantasia || (!!formData.cnpj && !isValidCNPJ(formData.cnpj))}
                    >
                      {createLoading ? 'Criando...' : 'Criar Empresa'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
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
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    <Badge className={(String((e as any).status || 'ativo').toLowerCase() === 'inativo') ? 'button-remove' : 'button-success'}>
                      {String((e as any).status || 'ativo').toLowerCase() === 'inativo' ? 'Inativo' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <IconDotsVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/empresa/${e.id}`)}>
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {String((e as any).status || 'ativo').toLowerCase() === 'inativo' ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => reativarEmpresa(Number(e.id))}
                          >
                            Reativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setConfirmInativar({ open: true, id: Number(e.id), nome: e.nome || e.nome_fantasia })}
                          >
                              <IconTrash className='mr-2 text-destructive' /> Inativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
