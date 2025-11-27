import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toastError, toastSuccess } from '@/lib/customToast'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { onlyDigits, formatCNPJ, validateCNPJ } from '@/lib/utils'
import { 
  IconBuilding, 
  IconPhone, 
  IconMapPin, 
  IconCalendar, 
  IconUsers, 
  IconUserCheck,
  IconClock,
  IconFileText,
  IconChartBar,
  IconArrowLeft,
  IconDeviceFloppy,
  IconX,
  IconAlertCircle,
  IconCircleCheck,
  IconRefresh
} from '@tabler/icons-react'

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
  const navigate = useNavigate()
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
  const [hasChanges, setHasChanges] = useState(false)

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
      <SiteHeader title="Detalhes da Empresa" />
      
      <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
        {/* Page Header with Back Button */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <IconBuilding className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">
              {empresa?.nome_fantasia || `Empresa #${id}`}
            </h2>
            {empresa && (empresa as any).status === 'inativo' && (
              <Badge variant="destructive">Inativa</Badge>
            )}
            {empresa && (empresa as any).status === 'ativo' && (
              <Badge variant="default" className="bg-green-600">Ativa</Badge>
            )}
          </div>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <IconRefresh className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados da empresa...</p>
            </div>
          </div>
        )}
        
        {!loading && empresa && (
          <>
            {/* Alert de Empresa Inativa */}
            {(empresa as any).status === 'inativo' && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-1">Empresa Inativa</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Esta empresa está inativa no sistema. Reative-a para permitir novas operações.
                      </p>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={handleReactivate} 
                        disabled={reactivating}
                      >
                        {reactivating ? (
                          <>
                            <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                            Reativando...
                          </>
                        ) : (
                          <>
                            <IconCircleCheck className="h-4 w-4 mr-2" />
                            Reativar Empresa
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Dados da Empresa */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconFileText className="h-5 w-5" />
                      Informações da Empresa
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Gerencie os dados cadastrais e configurações da empresa
                    </CardDescription>
                  </div>
                  {hasChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <IconAlertCircle className="h-3 w-3 mr-1" />
                      Alterações não salvas
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Identificação */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <IconBuilding className="h-4 w-4 text-primary" />
                      Identificação
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 lg:col-span-1">
                        <Label htmlFor="nome_fantasia" className="flex items-center gap-1.5">
                          Nome Fantasia
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="nome_fantasia" 
                          value={form.nome_fantasia} 
                          onChange={(e) => {
                            setForm(f => ({ ...f, nome_fantasia: e.target.value }))
                            setHasChanges(true)
                          }}
                          placeholder="Digite o nome fantasia"
                          className="mt-1.5"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-1">
                        <Label htmlFor="razao_social">Razão Social</Label>
                        <Input 
                          id="razao_social" 
                          value={form.razao_social} 
                          onChange={(e) => {
                            setForm(f => ({ ...f, razao_social: e.target.value }))
                            setHasChanges(true)
                          }}
                          placeholder="Digite a razão social"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj" className="flex items-center gap-1.5">
                          CNPJ
                          {!cnpjIsValid && !!form.cnpj && (
                            <IconAlertCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Label>
                        <Input
                          id="cnpj"
                          value={form.cnpj}
                          onChange={(e) => {
                            const masked = formatCNPJ(e.target.value)
                            setForm(f => ({ ...f, cnpj: masked, caepf: '' }))
                            setHasChanges(true)
                          }}
                          placeholder="00.000.000/0000-00"
                          aria-invalid={!cnpjIsValid && !!form.cnpj}
                          className={`mt-1.5 ${!cnpjIsValid && !!form.cnpj ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          disabled={!!form.caepf}
                        />
                        {!cnpjIsValid && !!form.cnpj && (
                          <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                            <IconAlertCircle className="h-3 w-3" />
                            CNPJ inválido
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="caepf" className="flex items-center gap-1.5">
                          CAEPF (CPF Rural)
                          {!caepfIsValid && !!form.caepf && (
                            <IconAlertCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Label>
                        <Input
                          id="caepf"
                          value={form.caepf}
                          onChange={(e) => {
                            const masked = formatCPF(e.target.value)
                            setForm(f => ({ ...f, caepf: masked, cnpj: '' }))
                            setHasChanges(true)
                          }}
                          placeholder="000.000.000-00"
                          aria-invalid={!caepfIsValid && !!form.caepf}
                          className={`mt-1.5 ${!caepfIsValid && !!form.caepf ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          disabled={!!form.cnpj}
                        />
                        {!caepfIsValid && !!form.caepf && (
                          <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                            <IconAlertCircle className="h-3 w-3" />
                            CPF inválido
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contato e Localização */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <IconMapPin className="h-4 w-4 text-primary" />
                      Contato e Localização
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cidade" className="flex items-center gap-1.5">
                          <IconMapPin className="h-3.5 w-3.5" />
                          Cidade
                        </Label>
                        <Input 
                          id="cidade" 
                          value={form.cidade} 
                          onChange={(e) => {
                            setForm(f => ({ ...f, cidade: e.target.value }))
                            setHasChanges(true)
                          }}
                          placeholder="Digite a cidade"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone" className="flex items-center gap-1.5">
                          <IconPhone className="h-3.5 w-3.5" />
                          Telefone
                        </Label>
                        <Input 
                          id="telefone" 
                          value={form.telefone} 
                          onChange={(e) => {
                            setForm(f => ({ ...f, telefone: e.target.value }))
                            setHasChanges(true)
                          }}
                          placeholder="(00) 00000-0000"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Gestão e Responsabilidade */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <IconUsers className="h-4 w-4 text-primary" />
                      Gestão e Responsabilidade
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unidade" className="flex items-center gap-1.5">
                          <IconBuilding className="h-3.5 w-3.5" />
                          Unidade Responsável
                        </Label>
                        <Select
                          value={form.unidade_responsavel ? String(form.unidade_responsavel) : ''}
                          onValueChange={(v) => {
                            setForm(f => ({ ...f, unidade_responsavel: v ? Number(v) : null, tecnico_responsavel: null }))
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger id="unidade" className='w-full mt-1.5'>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map(u => (
                              <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tecnico" className="flex items-center gap-1.5">
                          <IconUserCheck className="h-3.5 w-3.5" />
                          Técnico Responsável
                        </Label>
                        <Select
                          value={form.tecnico_responsavel ? String(form.tecnico_responsavel) : ''}
                          onValueChange={(v) => {
                            setForm(f => ({ ...f, tecnico_responsavel: v ? Number(v) : null }))
                            setHasChanges(true)
                          }}
                          disabled={!form.unidade_responsavel || tecnicos.length === 0}
                        >
                          <SelectTrigger id="tecnico" className='w-full mt-1.5'>
                            <SelectValue placeholder={
                              form.unidade_responsavel 
                                ? (tecnicos.length ? 'Selecione o técnico' : 'Sem usuários na unidade') 
                                : 'Escolha a unidade primeiro'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {tecnicos.map(t => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.nome} {t.sobrenome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Periodicidade e Renovação */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-primary" />
                      Periodicidade e Renovação
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="periodicidade" className="flex items-center gap-1.5">
                          <IconClock className="h-3.5 w-3.5" />
                          Periodicidade (dias)
                        </Label>
                        <Input
                          id="periodicidade"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={form.periodicidade ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setForm(f => ({ ...f, periodicidade: v === '' ? null : Number(v) }))
                            setHasChanges(true)
                          }}
                          placeholder="Ex: 30, 60, 90"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="data_renovacao" className="flex items-center gap-1.5">
                          <IconCalendar className="h-3.5 w-3.5" />
                          Data de Renovação
                        </Label>
                        <Input
                          id="data_renovacao"
                          type="date"
                          value={form.data_renovacao ? String(form.data_renovacao).slice(0, 10) : ''}
                          onChange={(e) => {
                            setForm(f => ({ ...f, data_renovacao: e.target.value }))
                            setHasChanges(true)
                          }}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Action Buttons */}
                <div className="flex items-center gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
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
                      setHasChanges(false)
                    }}
                    disabled={!hasChanges}
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => handleSave()} 
                    disabled={!canSave || saving || !hasChanges}
                  >
                    {saving ? (
                      <>
                        <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <IconDeviceFloppy className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs de Tarefas e Propostas */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Tarefas e Propostas Vinculadas
                </CardTitle>
                <CardDescription>
                  Visualize todas as tarefas e propostas relacionadas a esta empresa
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <Tabs defaultValue="tasks" className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="tasks" className="gap-2">
                      <IconFileText className="h-4 w-4" />
                      Tarefas
                      <Badge variant="secondary" className="ml-1">
                        {tasks.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="proposals" className="gap-2">
                      <IconChartBar className="h-4 w-4" />
                      Propostas
                      <Badge variant="secondary" className="ml-1">
                        {proposals.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tasks" className="mt-4">
                    <TechnicalTaskTable tasks={tasks} />
                  </TabsContent>

                  <TabsContent value="proposals" className="mt-4">
                    <CommercialProposalsTable proposals={proposals as any} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog de configuração de anos futuros */}
        <Dialog open={futureYearsDialog} onOpenChange={setFutureYearsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-primary" />
                Gerar Tarefas Automáticas
              </DialogTitle>
              <DialogDescription>
                Configure quantos anos futuros deseja gerar tarefas automáticas (além do ano atual).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="futureYears" className="flex items-center gap-1.5 mb-2">
                Anos futuros a gerar
              </Label>
              <Input
                id="futureYears"
                type="number"
                min="0"
                max="5"
                value={futureYears}
                onChange={(e) => setFutureYears(Math.max(0, Math.min(5, Number(e.target.value))))}
              />
              <Card className="mt-4 bg-muted/50 border-none">
                <CardContent className="pt-4 pb-3">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <IconCalendar className="h-4 w-4 mt-0.5 text-primary" />
                    <span>
                      Será gerado para o ano atual <strong>({new Date().getFullYear()})</strong>
                      {futureYears > 0 && (
                        <>
                          {' '}+ <strong>{futureYears}</strong> ano{futureYears > 1 ? 's' : ''} futuro{futureYears > 1 ? 's' : ''}
                          {' '}(até <strong>{new Date().getFullYear() + futureYears}</strong>)
                        </>
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setFutureYearsDialog(false)}>
                <IconX className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={confirmSaveWithFutureYears}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Salvar e Gerar Tarefas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
