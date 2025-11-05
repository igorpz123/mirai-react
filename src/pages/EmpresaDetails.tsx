import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { getCompanyById, updateCompany, getProposalsByCompany, type Company } from '@/services/companies'
import { getTasksByCompany, type Task } from '@/services/tasks'
import { getUnidades, type Unidade } from '@/services/unidades'
import { getUsersByUnitId, type User } from '@/services/users'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toastError, toastSuccess } from '@/lib/customToast'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { onlyDigits, formatCNPJ, validateCNPJ } from '@/lib/utils'

// CPF formatting and validation
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false // Rejects known invalid patterns like 111.111.111-11
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(digits.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(digits.charAt(10))) return false
  
  return true
}

export default function EmpresaDetails() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [empresa, setEmpresa] = useState<Company | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [tecnicos, setTecnicos] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [reactivating, setReactivating] = useState(false)
  const [futureYearsDialog, setFutureYearsDialog] = useState(false)
  const [futureYears, setFutureYears] = useState(1)

  const [form, setForm] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    caepf: '',
    cidade: '',
    telefone: '',
    unidade_responsavel: null as number | null,
    tecnico_responsavel: null as number | null,
    periodicidade: null as number | null,
    data_renovacao: '' as string,
  })

  const cnpjDigits = useMemo(() => onlyDigits(form.cnpj), [form.cnpj])
  const cnpjIsValid = useMemo(() => (cnpjDigits.length === 0 || validateCNPJ(cnpjDigits)), [cnpjDigits])
  const caepfDigits = useMemo(() => form.caepf.replace(/\D/g, ''), [form.caepf])
  const caepfIsValid = useMemo(() => (caepfDigits.length === 0 || isValidCPF(form.caepf)), [caepfDigits, form.caepf])
  const canSave = useMemo(() => {
    return (form.nome_fantasia?.trim().length ?? 0) > 0 && cnpjIsValid && caepfIsValid
  }, [form.nome_fantasia, cnpjIsValid, caepfIsValid])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const [data, uni] = await Promise.all([
          getCompanyById(Number(id)),
          getUnidades().catch(() => ({ unidades: [], total: 0 })),
        ])
        if (mounted) {
          setEmpresa(data)
          setUnidades(Array.isArray((uni as any).unidades) ? (uni as any).unidades : [])
          setForm({
            nome_fantasia: (data as any).nome_fantasia || (data as any).nome || '',
            razao_social: (data as any).razao_social || '',
            cnpj: formatCNPJ((data as any).cnpj || ''),
            caepf: formatCPF((data as any).caepf || ''),
            cidade: (data as any).cidade || '',
            telefone: (data as any).telefone || '',
            unidade_responsavel: (data as any).unidade_id ?? (data as any).unidade_responsavel ?? null,
            tecnico_responsavel: (data as any).tecnico_responsavel ?? null,
            periodicidade: (data as any).periodicidade ?? null,
            data_renovacao: (data as any).data_renovacao ?? '',
          })
        }
        // Load related tasks and proposals in parallel (best effort)
        Promise.allSettled([
          getTasksByCompany(Number(id)),
          getProposalsByCompany(Number(id)),
        ]).then((results) => {
          if (!mounted) return
          const tasksRes = results[0]
          if (tasksRes.status === 'fulfilled') {
            const t = (tasksRes.value as any).tasks ?? []
            setTasks(t)
          }
          const propRes = results[1]
          if (propRes.status === 'fulfilled') {
            const p = (propRes.value as any).proposals ?? []
            setProposals(p)
          }
        })
      } catch (err) {
        // minimal error surfacing inline
        if (mounted) {
          toastError(err instanceof Error ? err.message : 'Erro ao carregar empresa')
          setEmpresa(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  // When unit changes, load technicians for that unit
  useEffect(() => {
    let mounted = true
    async function loadUsers() {
      const unitId = form.unidade_responsavel
      if (!unitId) { setTecnicos([]); return }
      try {
        const { users } = await getUsersByUnitId(Number(unitId))
        if (mounted) setTecnicos(users)
      } catch (e) {
        if (mounted) setTecnicos([])
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [form.unidade_responsavel])

  const handleSave = async (skipDialog = false) => {
    if (!id) return
    if (!canSave) {
      toastError('Preencha os campos obrigatórios e verifique o CNPJ/CAEPF')
      return
    }

    // Se tem mudanças em periodicidade ou data_renovacao e não foi confirmado ainda
    if (!skipDialog && (
      form.data_renovacao !== ((empresa as any)?.data_renovacao || '') ||
      form.periodicidade !== ((empresa as any)?.periodicidade || null)
    )) {
      setFutureYearsDialog(true)
      return
    }

    setSaving(true)
    try {
      const payload: any = { ...form }
      // remove empty strings to avoid overwriting with blanks
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || typeof payload[k] === 'undefined') delete payload[k]
      })
      if (typeof payload.cnpj !== 'undefined') {
        const d = onlyDigits(payload.cnpj)
        if (d.length === 0) delete payload.cnpj
        else payload.cnpj = d
      }
      if (typeof payload.caepf !== 'undefined') {
        const d = payload.caepf.replace(/\D/g, '')
        if (d.length === 0) delete payload.caepf
        else payload.caepf = d
      }
      
      // Passa o parâmetro futureYears se foi confirmado via diálogo
      const updated = await updateCompany(
        Number(id), 
        payload,
        skipDialog ? futureYears : undefined
      )
      setEmpresa(updated)
      toastSuccess('Empresa atualizada')
      
      // Recarrega as tarefas para mostrar as novas tarefas automáticas
      if (skipDialog) {
        const response = await getTasksByCompany(Number(id))
        setTasks(Array.isArray(response) ? response : (response as any).tasks || [])
      }
    } catch (e: any) {
      toastError(e?.message || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const confirmSaveWithFutureYears = async () => {
    setFutureYearsDialog(false)
    await handleSave(true)
  }

  async function handleReactivate() {
    if (!id) return
    try {
      setReactivating(true)
      const updated = await updateCompany(Number(id), { status: 'ativo' } as any)
      setEmpresa(updated)
      try { toastSuccess('Empresa reativada') } catch {}
    } catch (e: any) {
      toastError(e?.message || 'Falha ao reativar a empresa')
    } finally {
      setReactivating(false)
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title={`Empresa #${id}`} />
      <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 mx-6">
        {loading && <div>Carregando...</div>}
        {!loading && (
          <>
            {/* Ações rápidas */}
            {empresa && (empresa as any).status === 'inativo' && (
              <div className="flex items-center justify-end">
                <Button className="success" onClick={handleReactivate} disabled={reactivating}>
                  {reactivating ? 'Reativando...' : 'Reativar empresa'}
                </Button>
              </div>
            )}

            {/* Edit form */}
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="text-lg font-semibold">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className='lg:col-span-2'>
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input id="nome_fantasia" value={form.nome_fantasia} onChange={(e) => setForm(f => ({ ...f, nome_fantasia: e.target.value }))} />
                </div>
                <div className='lg:col-span-2'>
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input id="razao_social" value={form.razao_social} onChange={(e) => setForm(f => ({ ...f, razao_social: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={form.cnpj}
                    onChange={(e) => {
                      const masked = formatCNPJ(e.target.value)
                      setForm(f => ({ ...f, cnpj: masked, caepf: '' }))
                    }}
                    placeholder="00.000.000/0000-00"
                    aria-invalid={!cnpjIsValid && !!form.cnpj}
                    className={!cnpjIsValid && !!form.cnpj ? 'border-destructive focus-visible:ring-destructive' : ''}
                    disabled={!!form.caepf}
                  />
                  {!cnpjIsValid && !!form.cnpj && (
                    <p className="text-destructive text-xs mt-1">CNPJ inválido</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="caepf">CAEPF (CPF Rural)</Label>
                  <Input
                    id="caepf"
                    value={form.caepf}
                    onChange={(e) => {
                      const masked = formatCPF(e.target.value)
                      setForm(f => ({ ...f, caepf: masked, cnpj: '' }))
                    }}
                    placeholder="000.000.000-00"
                    aria-invalid={!caepfIsValid && !!form.caepf}
                    className={!caepfIsValid && !!form.caepf ? 'border-destructive focus-visible:ring-destructive' : ''}
                    disabled={!!form.cnpj}
                  />
                  {!caepfIsValid && !!form.caepf && (
                    <p className="text-destructive text-xs mt-1">CPF inválido</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={form.cidade} onChange={(e) => setForm(f => ({ ...f, cidade: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="periodicidade">Periodicidade (dias)</Label>
                  <Input
                    id="periodicidade"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.periodicidade ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm(f => ({ ...f, periodicidade: v === '' ? null : Number(v) }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="data_renovacao">Data de renovação</Label>
                  <Input
                    id="data_renovacao"
                    type="date"
                    value={form.data_renovacao ? String(form.data_renovacao).slice(0, 10) : ''}
                    onChange={(e) => setForm(f => ({ ...f, data_renovacao: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="unidade">Unidade Responsável</Label>
                  <Select
                    value={form.unidade_responsavel ? String(form.unidade_responsavel) : ''}
                    onValueChange={(v) => setForm(f => ({ ...f, unidade_responsavel: v ? Number(v) : null, tecnico_responsavel: null }))}
                  >
                    <SelectTrigger id="unidade" className='w-full'><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                    <SelectContent>
                      {unidades.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Select
                    value={form.tecnico_responsavel ? String(form.tecnico_responsavel) : ''}
                    onValueChange={(v) => setForm(f => ({ ...f, tecnico_responsavel: v ? Number(v) : null }))}
                    disabled={!form.unidade_responsavel || tecnicos.length === 0}
                  >
                    <SelectTrigger id="tecnico" className='w-full'><SelectValue placeholder={form.unidade_responsavel ? (tecnicos.length ? 'Selecione o técnico' : 'Sem usuários na unidade') : 'Escolha a unidade primeiro'} /></SelectTrigger>
                    <SelectContent>
                      {tecnicos.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  if (!empresa) return
                  setForm({
                    nome_fantasia: (empresa as any).nome_fantasia || (empresa as any).nome || '',
                    razao_social: (empresa as any).razao_social || '',
                    cnpj: formatCNPJ((empresa as any).cnpj || ''),
                    caepf: formatCPF((empresa as any).caepf || ''),
                    cidade: (empresa as any).cidade || '',
                    telefone: (empresa as any).telefone || '',
                    unidade_responsavel: (empresa as any).unidade_id ?? (empresa as any).unidade_responsavel ?? null,
                    tecnico_responsavel: (empresa as any).tecnico_responsavel ?? null,
                    periodicidade: (empresa as any).periodicidade ?? null,
                    data_renovacao: (empresa as any).data_renovacao ?? '',
                  })
                }}>Cancelar</Button>
                <Button onClick={() => handleSave()} disabled={!canSave || saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>

            {/* Related tasks */}
            <div className="rounded-lg border">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-lg font-semibold">Tarefas vinculadas</h3>
              </div>
              <div className="pb-4">
                <TechnicalTaskTable tasks={tasks} />
              </div>
            </div>

            {/* Related proposals */}
            <div className="rounded-lg border">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-lg font-semibold">Propostas vinculadas</h3>
              </div>
              <div className="pb-4">
                <CommercialProposalsTable proposals={proposals as any} />
              </div>
            </div>
          </>
        )}

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
              <Button onClick={confirmSaveWithFutureYears}>
                Salvar e Gerar Tarefas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
