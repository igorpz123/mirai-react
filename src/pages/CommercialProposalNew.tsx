import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toastError, toastWarning, toastSuccess } from '@/lib/customToast'
import { useAuth } from '@/hooks/use-auth'
import { useUnit } from '@/contexts/UnitContext'
import { getCompanyByCNPJ, createCompany, type Company } from '@/services/companies'
import { getProductsCatalog, getCoursesCatalog, getChemicalsCatalog, type Curso, type Produto, type Quimico, addCourseToProposal, addChemicalToProposal, addProductToProposal, createProposal, type CreateProposalPayload, PROPOSAL_STATUSES, getProgramsCatalog, type Programa, addProgramToProposal, getProgramPrice, getProductPrice } from '@/services/proposals'
import { getUsersByUnitId } from '@/services/users'
import { SiteHeader } from '@/components/layout/site-header'
import { IconTrash, IconPlus, IconSearch, IconBuilding, IconFileText, IconTags, IconFlask, IconPackage, IconChecklist, IconChevronRight, IconChevronLeft } from '@tabler/icons-react'
import { onlyDigits, formatCNPJ, validateCNPJ } from '@/lib/utils'

export default function CommercialProposalNew() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unitId } = useUnit()

  // step control
  const [step, setStep] = React.useState(1)

  // custom step labels for the progress component
  const stepLabels = [
    { label: 'Consulta', icon: IconSearch },
    { label: 'Empresa', icon: IconBuilding },
    { label: 'Programas', icon: IconChecklist },
    { label: 'Cursos', icon: IconFileText },
    { label: 'Químicos', icon: IconFlask },
    { label: 'Produtos', icon: IconPackage },
    { label: 'Proposta', icon: IconTags },
  ]

  // Step 1: CNPJ or CAEPF
  const [documentType, setDocumentType] = React.useState<'cnpj' | 'caepf'>('cnpj')
  const [cnpj, setCnpj] = React.useState('')
  const [caepf, setCaepf] = React.useState('')
  const cnpjDigits = React.useMemo(() => onlyDigits(cnpj), [cnpj])
  const cnpjIsValid = React.useMemo(() => validateCNPJ(cnpjDigits), [cnpjDigits])

  // CPF validation helper
  const isValidCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cleanCpf.charAt(i)) * (10 - i)
    }
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cleanCpf.charAt(9))) return false

    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cleanCpf.charAt(i)) * (11 - i)
    }
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cleanCpf.charAt(10))) return false

    return true
  }

  // CPF formatting helper
  const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const caepfIsValid = React.useMemo(() => {
    const cleaned = caepf.replace(/\D/g, '')
    return cleaned.length === 0 || isValidCPF(caepf)
  }, [caepf])

  // Step 2: Company info
  const [company, setCompany] = React.useState<Company | null>(null)
  const [empresaForm, setEmpresaForm] = React.useState({ cnpj: '', caepf: '', razao_social: '', nome_fantasia: '', cidade: '' })

  // Items buffers (for display before creation)
  type ProgramaItem = { programa_id: number; nome?: string; quantidade: number; desconto: number; descontoIsPercent?: boolean; valor_unitario?: number; acrescimo_mensal?: number }
  type CursoItem = { curso_id: number; nome?: string; quantidade: number; valor_unitario: number; desconto: number; descontoIsPercent?: boolean }
  type QuimicoItem = { grupo: string; pontos: number; valor_unitario: number; desconto: number; descontoIsPercent?: boolean }
  type ProdutoItem = { produto_id: number; nome?: string; quantidade: number; desconto: number; descontoIsPercent?: boolean; valor_unitario?: number }

  const [programas, setProgramas] = React.useState<ProgramaItem[]>([])
  const [cursos, setCursos] = React.useState<CursoItem[]>([])
  const [quimicos, setQuimicos] = React.useState<QuimicoItem[]>([])
  const [produtos, setProdutos] = React.useState<ProdutoItem[]>([])

  // Catalogs
  const [courses, setCourses] = React.useState<Curso[]>([])
  const [chemicals, setChemicals] = React.useState<Quimico[]>([])
  const [products, setProducts] = React.useState<Produto[]>([])
  const [programs, setPrograms] = React.useState<Programa[]>([])

  // Program selection helpers (step 3)
  const [selectedProgramId, setSelectedProgramId] = React.useState<string | undefined>(undefined)
  const [programQuantity, setProgramQuantity] = React.useState<number>(1)
  // discount as string to allow values like '10%' or '100.00'
  const [programDiscount, setProgramDiscount] = React.useState<string>('0')
  const [programIncrement, setProgramIncrement] = React.useState<string>('0')

  // Course helpers (step 4)
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | undefined>(undefined)
  const [courseQuantity, setCourseQuantity] = React.useState<number>(1)
  const [courseDiscount, setCourseDiscount] = React.useState<string>('0')

  // Chemical helpers (step 5)
  const [selectedChemicalIdx, setSelectedChemicalIdx] = React.useState<string | undefined>(undefined)
  const [chemicalPontos, setChemicalPontos] = React.useState<number>(1)
  const [chemicalDiscount, setChemicalDiscount] = React.useState<string>('0')

  // Product helpers (step 6)
  const [selectedProductId, setSelectedProductId] = React.useState<string | undefined>(undefined)
  const [productQuantity, setProductQuantity] = React.useState<number>(1)
  const [productDiscount, setProductDiscount] = React.useState<string>('0')

  // Step 7: Proposal info
  const [indicacoes, setIndicacoes] = React.useState<{ id: number; nome: string; sobrenome?: string }[]>([])
  const [form, setForm] = React.useState<{ titulo: string; indicacao_id?: number | null; data?: string; status: string; observacoes?: string }>({ titulo: '', status: 'pendente' })

  React.useEffect(() => {
    let mounted = true
    Promise.all([
      getCoursesCatalog().catch(() => [] as Curso[]),
      getChemicalsCatalog().catch(() => [] as Quimico[]),
      getProductsCatalog().catch(() => [] as Produto[]),
      getProgramsCatalog().catch(() => [] as Programa[]),
    ]).then(([cs, qs, ps, prgs]) => { if (!mounted) return; setCourses(cs); setChemicals(qs); setProducts(ps); setPrograms(prgs) })
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    let mounted = true
    if (!unitId) return
    getUsersByUnitId(unitId).then(res => {
      if (!mounted) return
      const users = (res.users || []).map(u => ({ id: u.id, nome: u.nome, sobrenome: u.sobrenome }))
      setIndicacoes(users)
    }).catch(() => setIndicacoes([]))
    return () => { mounted = false }
  }, [unitId])

  const fmtBRL = (n?: number | null) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0))

  // Validation functions for required steps
  const validateStep1 = (): boolean => {
    return documentType === 'cnpj' ? cnpjIsValid : caepfIsValid
  }

  const validateStep2 = (): boolean => {
    return !!(empresaForm.razao_social && empresaForm.nome_fantasia && empresaForm.cidade)
  }

  const validateStep7 = (): boolean => {
    return !!(form.titulo && company?.id)
  }

  const getStepStatus = (stepNumber: number): 'complete' | 'invalid' | 'incomplete' | 'current' => {
    if (stepNumber === step) return 'current'
    if (stepNumber < step) {
      // Check if required steps are valid
      if (stepNumber === 1 && !validateStep1()) return 'invalid'
      if (stepNumber === 2 && !validateStep2()) return 'invalid'
      if (stepNumber === 7 && !validateStep7()) return 'invalid'
      return 'complete'
    }
    return 'incomplete'
  }

  return (
    <div className='container-main'>
      <SiteHeader title="Nova Proposta Comercial" />
      <div className="p-6 space-y-8 max-w-7xl mx-auto">

        {/* Step navigation - Redesigned */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <IconChecklist className="h-5 w-5 text-primary" />
              Progresso da Proposta
            </CardTitle>
            <CardDescription>
              Etapa {step} de {stepLabels.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar with indicators */}
            <div className="relative h-3">
              
              {/* Connection lines between steps */}
              <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
                <div className="relative h-3 flex items-center">
                  {stepLabels.map((_, idx) => {
                    if (idx === stepLabels.length - 1) return null // No line after last step
                    
                    const currentStepNumber = idx + 1
                    const nextStepNumber = idx + 2
                    const currentStatus = getStepStatus(currentStepNumber)
                    const nextStatus = getStepStatus(nextStepNumber)
                    
                    const startPos = Math.round((idx / (stepLabels.length - 1)) * 100)
                    const endPos = Math.round(((idx + 1) / (stepLabels.length - 1)) * 100)
                    const width = endPos - startPos
                    
                    // Determine line color based on both steps status
                    let lineColor = 'bg-slate-200' // default incomplete
                    if (currentStatus === 'complete' && nextStatus === 'complete') {
                      lineColor = 'bg-green-500'
                    } else if (currentStatus === 'invalid' || nextStatus === 'invalid') {
                      lineColor = 'bg-red-500'
                    } else if (currentStatus === 'complete' || currentStatus === 'current') {
                      lineColor = 'bg-primary'
                    }
                    
                    return (
                      <div
                        key={`line-${idx}`}
                        className={`absolute h-1 transition-all duration-300 ${lineColor}`}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
              
              {/* Interactive step indicators */}
              <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
                <div className="relative h-3">
                  {stepLabels.map((stepInfo, idx) => {
                    const s = idx + 1
                    const pos = Math.round((idx / (stepLabels.length - 1)) * 100)
                    const status = getStepStatus(s)
                    
                    return (
                      <button
                        key={`indicator-${s}`}
                        type="button"
                        onClick={() => setStep(s)}
                        title={stepInfo.label}
                        aria-current={status === 'current'}
                        className="pointer-events-auto absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                        style={{ left: `${pos}%` }}
                      >
                        <span
                          className={`block w-6 h-6 rounded-full border-3 transition-all shadow-md ${
                            status === 'complete'
                              ? 'bg-green-500 border-green-600 scale-100'
                              : status === 'invalid'
                                ? 'bg-red-500 border-red-600 scale-100'
                                : status === 'current'
                                  ? 'bg-primary border-primary scale-125 ring-4 ring-primary/30'
                                  : 'bg-white border-slate-300 scale-90'
                          }`}
                        />
                        <span className="sr-only">{stepInfo.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Step buttons grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {stepLabels.map((stepInfo, idx) => {
                const s = idx + 1
                const status = getStepStatus(s)
                const StepIcon = stepInfo.icon
                
                return (
                  <Button
                    key={`step-${s}`}
                    variant={status === 'current' ? 'default' : status === 'complete' || status === 'invalid' ? 'outline' : 'outline'}
                    onClick={() => setStep(s)}
                    className={`relative overflow-hidden group transition-all ${
                      status === 'complete'
                        ? 'border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 text-green-700 dark:text-green-400'
                        : status === 'invalid'
                          ? 'border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400'
                          : status === 'current'
                            ? 'shadow-lg scale-105'
                            : ''
                    }`}
                    size="lg"
                  >
                    <div className="flex items-center gap-2">
                      <StepIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{stepInfo.label}</span>
                    </div>
                    {status === 'complete' && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    )}
                    {status === 'invalid' && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Parte 01 - Consulta da Empresa */}
        {step === 1 && (
          <Card className="border-2 py-0 pb-4 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconSearch className="h-6 w-6 text-primary" />
                Consulta da Empresa
              </CardTitle>
              <CardDescription className="text-base">
                Pesquise a empresa pelo CNPJ ou CAEPF para iniciar a proposta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-4 space-y-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Document Type Selection */}
                <div className="flex items-center justify-center gap-6 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Documento:</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${documentType === 'cnpj' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        }`}>
                        {documentType === 'cnpj' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${documentType === 'cnpj' ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                        CNPJ
                      </span>
                      <input
                        type="radio"
                        name="documentType"
                        checked={documentType === 'cnpj'}
                        onChange={() => {
                          setDocumentType('cnpj')
                          setCaepf('')
                        }}
                        className="sr-only"
                      />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${documentType === 'caepf' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        }`}>
                        {documentType === 'caepf' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${documentType === 'caepf' ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                        CAEPF (CPF Rural)
                      </span>
                      <input
                        type="radio"
                        name="documentType"
                        checked={documentType === 'caepf'}
                        onChange={() => {
                          setDocumentType('caepf')
                          setCnpj('')
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Document Input */}
                {documentType === 'cnpj' ? (
                  <div className="space-y-3">
                    <Label htmlFor="cnpj-input" className="text-base font-semibold">CNPJ da Empresa</Label>
                    <div className="relative">
                      <Input
                        id="cnpj-input"
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        aria-invalid={cnpj.length > 0 && !cnpjIsValid}
                        className={`h-12 text-lg pl-4 ${cnpj.length > 0 && !cnpjIsValid ? 'border-destructive focus-visible:ring-destructive' : 'border-2'}`}
                      />
                      {cnpj.length > 0 && !cnpjIsValid && (
                        <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center">!</span>
                          CNPJ inválido - verifique os dígitos
                        </p>
                      )}
                      {cnpj.length > 0 && cnpjIsValid && (
                        <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                          CNPJ válido
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="caepf-input" className="text-base font-semibold">CAEPF (CPF Rural)</Label>
                    <div className="relative">
                      <Input
                        id="caepf-input"
                        value={caepf}
                        onChange={(e) => setCaepf(formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        aria-invalid={caepf.length > 0 && !caepfIsValid}
                        className={`h-12 text-lg pl-4 ${caepf.length > 0 && !caepfIsValid ? 'border-destructive focus-visible:ring-destructive' : 'border-2'}`}
                      />
                      {caepf.length > 0 && !caepfIsValid && (
                        <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center">!</span>
                          CPF inválido - verifique os dígitos
                        </p>
                      )}
                      {caepf.length > 0 && caepfIsValid && (
                        <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                          CPF válido
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    disabled={documentType === 'cnpj' ? !cnpjIsValid : !caepfIsValid}
                    onClick={async () => {
                      try {
                        const document = documentType === 'cnpj' ? onlyDigits(cnpj) : caepf.replace(/\D/g, '')
                        const cmp = await getCompanyByCNPJ(document)
                        if (cmp) {
                          setCompany(cmp)
                          setEmpresaForm({
                            cnpj: cmp.cnpj ? formatCNPJ(cmp.cnpj) : '',
                            caepf: cmp.caepf ? formatCPF(cmp.caepf) : '',
                            razao_social: cmp.razao_social || '',
                            nome_fantasia: cmp.nome || '',
                            cidade: cmp.cidade || ''
                          })
                          if (cmp.cnpj) setCnpj(formatCNPJ(cmp.cnpj))
                          if (cmp.caepf) setCaepf(formatCPF(cmp.caepf))
                          toastSuccess('Empresa localizada')
                        } else {
                          setCompany(null)
                          setEmpresaForm({
                            cnpj: documentType === 'cnpj' ? formatCNPJ(cnpj) : '',
                            caepf: documentType === 'caepf' ? formatCPF(caepf) : '',
                            razao_social: '',
                            nome_fantasia: '',
                            cidade: ''
                          })
                          toastWarning('Empresa não cadastrada, preencha os dados na próxima etapa')
                        }
                        setStep(2)
                      } catch (e: any) {
                        toastError(e?.message || 'Falha na consulta')
                      }
                    }}
                    size="lg"
                    className="min-w-[200px] shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <IconSearch className="mr-2 h-5 w-5" />
                    Consultar Empresa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 02 - Informações da Empresa */}
        {step === 2 && (
          <Card className="border-2 shadow-lg py-0 pb-4">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconBuilding className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Informações da Empresa
              </CardTitle>
              <CardDescription className="text-base">
                {company ? 'Empresa encontrada! Revise os dados ou edite conforme necessário' : 'Preencha os dados da nova empresa'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {company && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                    <span className="inline-block w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                    Empresa já cadastrada no sistema
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {empresaForm.cnpj && (
                  <div className="space-y-2">
                    <Label htmlFor="empresa-cnpj" className="text-sm font-semibold flex items-center gap-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      CNPJ
                    </Label>
                    <Input
                      id="empresa-cnpj"
                      value={empresaForm.cnpj}
                      disabled
                      className="bg-muted/50 h-11 font-mono"
                    />
                  </div>
                )}
                {empresaForm.caepf && (
                  <div className="space-y-2">
                    <Label htmlFor="empresa-caepf" className="text-sm font-semibold flex items-center gap-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      CAEPF (CPF)
                    </Label>
                    <Input
                      id="empresa-caepf"
                      value={empresaForm.caepf}
                      disabled
                      className="bg-muted/50 h-11 font-mono"
                    />
                  </div>
                )}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="razao-social" className="text-sm font-semibold flex items-center gap-2">
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    Razão Social *
                  </Label>
                  <Input
                    id="razao-social"
                    value={empresaForm.razao_social}
                    onChange={(e) => setEmpresaForm(s => ({ ...s, razao_social: e.target.value }))}
                    className="h-11"
                    placeholder="Nome oficial da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome-fantasia" className="text-sm font-semibold flex items-center gap-2">
                    <IconTags className="h-4 w-4 text-muted-foreground" />
                    Nome Fantasia *
                  </Label>
                  <Input
                    id="nome-fantasia"
                    value={empresaForm.nome_fantasia}
                    onChange={(e) => setEmpresaForm(s => ({ ...s, nome_fantasia: e.target.value }))}
                    className="h-11"
                    placeholder="Nome comercial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-sm font-semibold flex items-center gap-2">
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    Cidade *
                  </Label>
                  <Input
                    id="cidade"
                    value={empresaForm.cidade}
                    onChange={(e) => setEmpresaForm(s => ({ ...s, cidade: e.target.value }))}
                    className="h-11"
                    placeholder="Cidade da empresa"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setStep(1)} size="lg">
                  <IconChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={async () => {
                  // if company not found, create
                  if (!company) {
                    try {
                      // Ensure we have a unit id before creating (DB constraint unidade_responsavel NOT NULL)
                      if (!unitId) {
                        toastError('Unidade não definida. Tente novamente em instantes.')
                        return
                      }

                      // Validate that we have either CNPJ or CAEPF
                      if (!empresaForm.cnpj && !empresaForm.caepf) {
                        toastError('CNPJ ou CAEPF é obrigatório')
                        return
                      }

                      const payload: any = {
                        razao_social: empresaForm.razao_social,
                        nome_fantasia: empresaForm.nome_fantasia,
                        cidade: empresaForm.cidade,
                        unidade_responsavel: unitId,
                      }

                      if (empresaForm.cnpj) {
                        payload.cnpj = onlyDigits(empresaForm.cnpj)
                      }
                      if (empresaForm.caepf) {
                        payload.caepf = empresaForm.caepf.replace(/\D/g, '')
                      }

                      const created = await createCompany(payload)
                      setCompany({ ...created, nome: created.nome })
                      toastSuccess('Empresa cadastrada')
                    } catch (e: any) {
                      toastError(e?.message || 'Falha ao cadastrar empresa')
                      return
                    }
                  }
                  setStep(3)
                }} size="lg" className="shadow-lg">
                  Continuar
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 03 - Programas de Prevenção */}
        {step === 3 && (
          <Card className="border-2 shadow-lg py-0 pb-4">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconChecklist className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Programas de Prevenção
              </CardTitle>
              <CardDescription className="text-base">
                Selecione programas, quantidade e desconto. Esta etapa é opcional - você pode pular
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {/* Add Program Form */}
              <div className="p-5 bg-muted/30 rounded-lg border-2 border-dashed space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-lg">Adicionar Programa</h3>
                </div>

                <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="select-program" className="text-sm font-semibold">Programa *</Label>
                    <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v) }}>
                      <SelectTrigger id="select-program" className="h-11">
                        <SelectValue placeholder="Selecione um programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-qty" className="text-sm font-semibold">Quantidade</Label>
                    <Input
                      id="program-qty"
                      type="number"
                      min={1}
                      value={programQuantity}
                      onChange={(e) => setProgramQuantity(Number(e.target.value || 1))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-discount" className="text-sm font-semibold">Desconto</Label>
                    <Input
                      id="program-discount"
                      type="text"
                      value={programDiscount}
                      onChange={(e) => setProgramDiscount(e.target.value)}
                      className="h-11"
                      placeholder="0 ou 10%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-increment" className="text-sm font-semibold">Acréscimo Mensal</Label>
                    <Input
                      id="program-increment"
                      type="text"
                      value={programIncrement}
                      onChange={(e) => setProgramIncrement(e.target.value)}
                      className="h-11"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className='h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all'
                      onClick={async () => {
                        if (!selectedProgramId) { toastWarning('Selecione um programa antes de adicionar'); return }
                        const p = programs.find(pp => pp.id === Number(selectedProgramId))
                        if (!p) return
                        // prevent duplicate program
                        if (programas.some(pr => pr.programa_id === p.id)) { toastWarning('Este programa já foi adicionado'); return }
                        // parse discount: allow values like '10%' or '100.00'
                        const raw = (programDiscount || '').toString().trim()
                        let descontoNum = 0
                        let descontoIsPercent = false
                        if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                        // attempt to fetch unit price for the program so we can cap fixed discounts
                        let unitVal = 0
                        try {
                          const pr = await getProgramPrice(p.id, programQuantity)
                          unitVal = Number(pr.preco_unitario ?? 0)
                        } catch (err) {
                          unitVal = 0
                        }
                        // cap values: percent 0-100, fixed 0 - unitVal (if available)
                        if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                        else if (unitVal > 0) descontoNum = Math.min(Math.max(0, descontoNum), unitVal)
                        else descontoNum = Math.max(0, descontoNum)
                        // parse increment as currency
                        let incVal = 0
                        const incRaw = (programIncrement || '').toString().trim()
                        incVal = Number(incRaw.replace(',', '.'))
                        if (Number.isNaN(incVal)) incVal = 0
                        incVal = Math.max(0, incVal)
                        setProgramas(prev => [...prev, { programa_id: p.id, nome: p.nome, quantidade: programQuantity, desconto: descontoNum, descontoIsPercent, valor_unitario: unitVal, acrescimo_mensal: incVal }])
                        setProgramQuantity(1)
                        setProgramDiscount('0')
                        setProgramIncrement('0')
                        setSelectedProgramId(undefined)
                      }}>
                      <IconPlus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Programs Table */}
              {programas.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <IconChecklist className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Programas Adicionados
                    </h3>
                    <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950/30 rounded-full">
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        {programas.length} {programas.length === 1 ? 'programa' : 'programas'}
                      </span>
                    </div>
                  </div>

                  <div className="border-2 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">Programa</TableHead>
                          <TableHead className="font-semibold text-center">Qtd</TableHead>
                          <TableHead className="font-semibold text-center">Valor Unit. (mês)</TableHead>
                          <TableHead className="font-semibold text-center">Desc (R$ ou %)</TableHead>
                          <TableHead className="font-semibold text-center">Acrésc. Mensal (R$)</TableHead>
                          <TableHead className="font-semibold text-center">Valor Total (anual)</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programas.map((p, idx) => {
                          const unit = Number(p.valor_unitario || 0)
                          const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                          const cappedDescontoPerUnit = Math.min(Math.max(0, descontoPerUnit), unit)
                          // monthly line total
                          const monthlyBase = Math.max(0, (unit - cappedDescontoPerUnit) * (p.quantidade || 1))
                          const inc = Math.max(0, Number(p.acrescimo_mensal || 0))
                          const monthly = Math.max(0, monthlyBase + inc)
                          // annualized for contract
                          const lineTotal = monthly * 12
                          return (
                            <TableRow key={`ppp-${idx}`}>
                              <TableCell>{p.nome || p.programa_id}</TableCell>
                              <TableCell className="text-center">{p.quantidade}</TableCell>
                              <TableCell className="text-center">{fmtBRL(unit)}</TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="text"
                                  value={p.descontoIsPercent ? `${p.desconto}%` : String(p.desconto)}
                                  onChange={(e) => {
                                    const raw = e.target.value.trim()
                                    let descontoNum = 0
                                    let descontoIsPercent = false
                                    if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                                    // cap percent and fixed using stored unit price when available
                                    const unitLocal = Number(p.valor_unitario || 0)
                                    if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                                    else if (unitLocal > 0) descontoNum = Math.min(Math.max(0, descontoNum), unitLocal)
                                    else descontoNum = Math.max(0, descontoNum)
                                    setProgramas(prev => prev.map((pp, i) => i === idx ? { ...pp, desconto: descontoNum, descontoIsPercent } : pp))
                                  }}
                                  className="text-center w-32"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min={0}
                                  value={p.acrescimo_mensal ?? 0}
                                  onChange={(e) => {
                                    const v = Math.max(0, Number(e.target.value))
                                    setProgramas(prev => prev.map((pp, i) => i === idx ? { ...pp, acrescimo_mensal: v } : pp))
                                  }}
                                  className="text-center w-32"
                                />
                              </TableCell>
                              <TableCell className="text-center">{fmtBRL(lineTotal)}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  onClick={() => setProgramas(prev => prev.filter((_, i) => i !== idx))}
                                  className="gap-1 button-remove"
                                >
                                  <IconTrash className="h-4 w-4" />
                                  Remover
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Summary */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Total dos Programas (anual):</span>
                      <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{fmtBRL(programas.reduce((sum, p) => {
                        const unit = Number(p.valor_unitario || 0)
                        const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                        const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                        const monthlyBase = Math.max(0, (unit - capped) * (p.quantidade || 1))
                        const inc = Math.max(0, Number(p.acrescimo_mensal || 0))
                        const monthly = Math.max(0, monthlyBase + inc)
                        return sum + (monthly * 12)
                      }, 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setStep(2)} size="lg">
                  <IconChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button variant="outline" onClick={() => setStep(4)} size="lg">
                  Pular Etapa
                </Button>
                <Button onClick={() => setStep(4)} size="lg" className="shadow-lg">
                  Continuar
                  <IconChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 04 - Cursos */}
        {step === 4 && (
          <Card className="border-2 py-0 pb-4 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500/5 to-orange-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconFileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                Cursos
              </CardTitle>
              <CardDescription className="text-base">
                Selecione cursos, quantidade e desconto. Esta etapa é opcional - você pode pular
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {/* Add Course Form */}
              <div className="p-5 bg-muted/30 rounded-lg border-2 border-dashed space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconPlus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-semibold text-lg">Adicionar Curso</h3>
                </div>

                <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="select-course" className="text-sm font-semibold">Curso *</Label>
                    <Select value={selectedCourseId} onValueChange={(v) => setSelectedCourseId(v)}>
                      <SelectTrigger id="select-course" className="h-11 w-full                                                                                                                    ">
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => (<SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-qty" className="text-sm font-semibold">Quantidade</Label>
                    <Input
                      id="course-qty"
                      type="number"
                      min={1}
                      value={courseQuantity}
                      onChange={(e) => setCourseQuantity(Number(e.target.value || 1))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-discount" className="text-sm font-semibold">Desconto</Label>
                    <Input
                      id="course-discount"
                      type="text"
                      value={courseDiscount}
                      onChange={(e) => setCourseDiscount(e.target.value)}
                      className="h-11"
                      placeholder="0 ou 10%"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className='h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all'
                      onClick={() => {
                        if (!selectedCourseId) { toastWarning('Selecione um curso antes de adicionar'); return }
                        const c = courses.find(cc => cc.id === Number(selectedCourseId))
                        if (!c) return
                        // prevent duplicate course
                        if (cursos.some(cur => cur.curso_id === c.id)) { toastWarning('Este curso já foi adicionado'); return }
                        const raw = (courseDiscount || '').toString().trim()
                        let descontoNum = 0
                        let descontoIsPercent = false
                        const unitVal = Number(c.valor_unitario ?? c.preco_unitario ?? c.valor ?? c.preco ?? 0)
                        if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                        // Normalize/cap
                        if (descontoIsPercent) {
                          descontoNum = Math.min(Math.max(0, descontoNum), 100)
                        } else {
                          descontoNum = Math.min(Math.max(0, descontoNum), unitVal)
                        }
                        setCursos(prev => [...prev, { curso_id: c.id, nome: c.nome, quantidade: courseQuantity, valor_unitario: unitVal, desconto: descontoNum, descontoIsPercent }])
                        setCourseQuantity(1)
                        setCourseDiscount('0')
                        setSelectedCourseId(undefined)
                      }}><IconPlus /></Button>
                  </div>
                </div>
              </div>
              {cursos.length > 0 && (
                <>
                  <Table className="border-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Curso</TableHead>
                        <TableHead className="font-semibold">Quantidade</TableHead>
                        <TableHead className="font-semibold">Valor Unit</TableHead>
                        <TableHead className="font-semibold">Desc (R$ ou %)</TableHead>
                        <TableHead className="font-semibold">Valor Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cursos.map((c, idx) => {
                        // helper to compute discount per unit in currency
                        const unit = Number(c.valor_unitario || 0)
                        const descontoPerUnit = c.descontoIsPercent ? (Number(c.desconto || 0) / 100) * unit : Number(c.desconto || 0)
                        const cappedDescontoPerUnit = Math.min(Math.max(0, descontoPerUnit), unit)
                        return (
                          <TableRow key={`cur-${idx}`}>
                            <TableCell>{c.nome || c.curso_id}</TableCell>
                            <TableCell className="text-center"><Input type="number" min={1} value={c.quantidade} onChange={(e) => {
                              const q = Number(e.target.value || 1)
                              setCursos(prev => prev.map((pp, i) => i === idx ? { ...pp, quantidade: q } : pp))
                            }} className="w-20 text-center" /></TableCell>
                            <TableCell className="text-center">{fmtBRL(c.valor_unitario)}</TableCell>
                            <TableCell className="text-center flex justify-center">
                              <Input type="text" value={c.descontoIsPercent ? `${c.desconto}%` : String(c.desconto)} onChange={(e) => {
                                const raw = e.target.value.trim()
                                let descontoNum = 0
                                let descontoIsPercent = false
                                if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                                // normalize: cap percentage to 100 and fixed discount to unit price
                                if (descontoIsPercent) {
                                  descontoNum = Math.min(Math.max(0, descontoNum), 100)
                                } else {
                                  descontoNum = Math.min(Math.max(0, descontoNum), unit)
                                }
                                setCursos(prev => prev.map((pp, i) => i === idx ? { ...pp, desconto: descontoNum, descontoIsPercent } : pp))
                              }} className="w-20 text-center" />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm text-center">{fmtBRL(Math.max(0, (unit - cappedDescontoPerUnit) * (c.quantidade || 1)))}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button className='button-remove' onClick={() => setCursos(prev => prev.filter((_, i) => i !== idx))}><IconTrash /> Remover</Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Total dos cursos adicionados */}
                  <Card className="bg-gradient-to-r from-orange-500/5 to-orange-600/10 border-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Total dos Cursos</span>
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {fmtBRL(cursos.reduce((sum, c) => {
                            const unit = Number(c.valor_unitario || 0)
                            const descontoPerUnit = c.descontoIsPercent ? (Number(c.desconto || 0) / 100) * unit : Number(c.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            const line = Math.max(0, (unit - capped) * (c.quantidade || 1))
                            return sum + line
                          }, 0))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(3)}>
                  <IconChevronLeft size={20} />
                  Voltar
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep(5)}>
                  Pular Etapa
                </Button>
                <Button size="lg" onClick={() => setStep(5)}>
                  Continuar
                  <IconChevronRight size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 05 - Químicos */}
        {step === 5 && (
          <Card className="border-2 py-0 pb-4 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-500/5 to-teal-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconFlask className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                Químicos
                {quimicos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-teal-50 text-teal-700 border-teal-200">
                    {quimicos.length} adicionado(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Selecione químicos (grupos), pontos e desconto. Esta etapa é opcional - você pode pular
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Add Chemical Form */}
              <div className="p-5 bg-muted/30 rounded-lg border-2 border-dashed space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-semibold text-lg">Adicionar Químico</h3>
                </div>

                <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="select-chemical" className="text-sm font-semibold">Químico (Grupo) *</Label>
                    <Select value={selectedChemicalIdx} onValueChange={(v) => setSelectedChemicalIdx(v)}>
                      <SelectTrigger id="select-chemical" className="h-11 w-full">
                        <SelectValue placeholder="Selecione um químico" />
                      </SelectTrigger>
                      <SelectContent>
                        {chemicals.map((q, idx) => (<SelectItem key={`chem-${q.id ?? idx}`} value={String(idx)}>{q.descricao || q.grupo || `Químico ${q.id}`}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chemical-pontos" className="text-sm font-semibold">Pontos</Label>
                    <Input
                      id="chemical-pontos"
                      type="number"
                      min={1}
                      value={chemicalPontos}
                      onChange={(e) => setChemicalPontos(Number(e.target.value || 1))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chemical-discount" className="text-sm font-semibold">Desconto</Label>
                    <Input
                      id="chemical-discount"
                      type="text"
                      value={chemicalDiscount}
                      onChange={(e) => setChemicalDiscount(e.target.value)}
                      className="h-11"
                      placeholder="0 ou 10%"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className='h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all'
                      onClick={() => {
                        if (!selectedChemicalIdx) { toastWarning('Selecione um químico antes de adicionar'); return }
                        const idx = Number(selectedChemicalIdx)
                        const q = chemicals[idx]
                        if (!q) return
                        // prevent duplicate chemical by group
                        const grupo = q.grupo || String(q.id)
                        if (quimicos.some(qq => qq.grupo === grupo)) { toastWarning('Este químico já foi adicionado'); return }
                        const raw = (chemicalDiscount || '').toString().trim()
                        let descontoNum = 0
                        let descontoIsPercent = false
                        if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                        const unitVal = Number(q.valor_unitario ?? q.preco_unitario ?? q.valor ?? q.preco ?? 0)
                        if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                        else descontoNum = Math.min(Math.max(0, descontoNum), unitVal)
                        setQuimicos(prev => [...prev, { grupo: q.grupo || 'Grupo', pontos: Number(q.pontos || chemicalPontos), valor_unitario: unitVal, desconto: descontoNum, descontoIsPercent }])
                        setChemicalPontos(1)
                        setChemicalDiscount('0')
                        setSelectedChemicalIdx(undefined)
                      }}><IconPlus /></Button>
                  </div>
                </div>
              </div>

              {quimicos.length > 0 && (
                <>
                  <Table className="border-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Grupo</TableHead>
                        <TableHead className="font-semibold">Pontos</TableHead>
                        <TableHead className="font-semibold">Valor Unit</TableHead>
                        <TableHead className="font-semibold">Desc (R$ ou %)</TableHead>
                        <TableHead className="font-semibold">Valor Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quimicos.map((q, idx) => {
                        const unit = Number(q.valor_unitario || 0)
                        const descontoPerUnit = q.descontoIsPercent ? (Number(q.desconto || 0) / 100) * unit : Number(q.desconto || 0)
                        const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                        return (
                          <TableRow key={`qui-${idx}`}>
                            <TableCell>{q.grupo}</TableCell>
                            <TableCell className="text-center"><Input type="number" min={1} value={q.pontos} onChange={(e) => {
                              const v = Number(e.target.value || 1)
                              setQuimicos(prev => prev.map((pp, i) => i === idx ? { ...pp, pontos: v } : pp))
                            }} className="w-20 text-center" /></TableCell>
                            <TableCell className="text-center">{fmtBRL(q.valor_unitario)}</TableCell>
                            <TableCell className="text-center"><Input type="text" value={q.descontoIsPercent ? `${q.desconto}%` : String(q.desconto)} onChange={(e) => {
                              const raw = e.target.value.trim()
                              let descontoNum = 0
                              let descontoIsPercent = false
                              if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                              if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                              else descontoNum = Math.min(Math.max(0, descontoNum), unit)
                              setQuimicos(prev => prev.map((pp, i) => i === idx ? { ...pp, desconto: descontoNum, descontoIsPercent } : pp))
                            }} className="w-20 text-center" /></TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm text-center">{fmtBRL(Math.max(0, (unit - capped) * (q.pontos || 1)))}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button className='button-remove' onClick={() => setQuimicos(prev => prev.filter((_, i) => i !== idx))}><IconTrash /> Remover</Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Total dos químicos adicionados */}
                  <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10 border-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Total dos Químicos</span>
                        <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          {fmtBRL(quimicos.reduce((sum, q) => {
                            const unit = Number(q.valor_unitario || 0)
                            const descontoPerUnit = q.descontoIsPercent ? (Number(q.desconto || 0) / 100) * unit : Number(q.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            const line = Math.max(0, (unit - capped) * (q.pontos || 1))
                            return sum + line
                          }, 0))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(4)}>
                  <IconChevronLeft size={20} />
                  Voltar
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep(6)}>
                  Pular Etapa
                </Button>
                <Button size="lg" onClick={() => setStep(6)}>
                  Continuar
                  <IconChevronRight size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 06 - Produtos */}
        {step === 6 && (
          <Card className="border-2 py-0 pb-4 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-indigo-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconPackage className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                Produtos
                {produtos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                    {produtos.length} adicionado(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Selecione produtos, quantidade e desconto. Esta etapa é opcional - você pode pular
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {/* Add Product Form */}
              <div className="p-5 bg-muted/30 rounded-lg border-2 border-dashed space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <IconPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-lg">Adicionar Produto</h3>
                </div>

                <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="select-product" className="text-sm font-semibold">Produto *</Label>
                    <Select value={selectedProductId} onValueChange={(v) => setSelectedProductId(v)}>
                      <SelectTrigger id="select-product" className="h-11 w-full">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-qty" className="text-sm font-semibold">Quantidade</Label>
                    <Input
                      id="product-qty"
                      type="number"
                      min={1}
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(Number(e.target.value || 1))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-discount" className="text-sm font-semibold">Desconto</Label>
                    <Input
                      id="product-discount"
                      type="text"
                      value={productDiscount}
                      onChange={(e) => setProductDiscount(e.target.value)}
                      className="h-11"
                      placeholder="0 ou 10%"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className='h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all'
                      onClick={async () => {
                        if (!selectedProductId) { toastWarning('Selecione um produto antes de adicionar'); return }
                        const p = products.find(pp => pp.id === Number(selectedProductId))
                        if (!p) return
                        // prevent duplicate product
                        if (produtos.some(pr => pr.produto_id === p.id)) { toastWarning('Este produto já foi adicionado'); return }
                        const raw = (productDiscount || '').toString().trim()
                        let descontoNum = 0
                        let descontoIsPercent = false
                        if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                        // try fetch unit price rules to cap fixed discounts
                        let unitVal = 0
                        try {
                          const rule = await getProductPrice(p.id, productQuantity)
                          unitVal = Number(rule.preco_unitario ?? 0)
                        } catch (err) {
                          unitVal = 0
                        }
                        if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                        else if (unitVal > 0) descontoNum = Math.min(Math.max(0, descontoNum), unitVal)
                        else descontoNum = Math.max(0, descontoNum)
                        setProdutos(prev => [...prev, { produto_id: p.id, nome: p.nome, quantidade: productQuantity, desconto: descontoNum, descontoIsPercent, valor_unitario: unitVal }])
                        setProductQuantity(1)
                        setProductDiscount('0')
                        setSelectedProductId(undefined)
                      }}><IconPlus /></Button>
                  </div>
                </div>
              </div>

              {produtos.length > 0 && (
                <>
                  <Table className="border-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Produto</TableHead>
                        <TableHead className="font-semibold">Qtd</TableHead>
                        <TableHead className="font-semibold">Valor Unit.</TableHead>
                        <TableHead className="font-semibold">Desc</TableHead>
                        <TableHead className="font-semibold">Valor Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((p, idx) => (
                        <TableRow className='w-full' key={`pro-${idx}`}>
                          <TableCell>{p.nome || p.produto_id}</TableCell>
                          <TableCell className="text-center">{p.quantidade}</TableCell>
                          <TableCell className="text-center">{fmtBRL(p.valor_unitario)}</TableCell>
                          <TableCell className="text-center"><Input type="text" value={p.descontoIsPercent ? `${p.desconto}%` : String(p.desconto)} onChange={async (e) => {
                            const raw = e.target.value.trim()
                            let descontoNum = 0
                            let descontoIsPercent = false
                            if (raw.endsWith('%')) { descontoIsPercent = true; descontoNum = Number(raw.replace('%', '')) || 0 } else { descontoNum = Number(raw) || 0 }
                            // prefer stored unit price if present, otherwise try fetching price rule
                            let unitVal = Number(p.valor_unitario ?? 0)
                            if (!unitVal) {
                              try {
                                const rule = await getProductPrice(p.produto_id, p.quantidade || 1)
                                unitVal = Number(rule.preco_unitario ?? 0)
                              } catch (err) {
                                unitVal = 0
                              }
                            }
                            if (descontoIsPercent) descontoNum = Math.min(Math.max(0, descontoNum), 100)
                            else if (unitVal > 0) descontoNum = Math.min(Math.max(0, descontoNum), unitVal)
                            else descontoNum = Math.max(0, descontoNum)
                            setProdutos(prev => prev.map((pp, i) => i === idx ? { ...pp, desconto: descontoNum, descontoIsPercent } : pp))
                          }} className="w-36 text-center" /></TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm">{fmtBRL(Math.max(0, (() => {
                              const unit = Number(p.valor_unitario || 0)
                              const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                              const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                              return (unit - capped) * (p.quantidade || 1)
                            })()))}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button className='button-remove' onClick={() => setProdutos(prev => prev.filter((_, i) => i !== idx))}><IconTrash /> Remover</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Total dos produtos adicionados */}
                  <Card className="bg-gradient-to-r from-indigo-500/5 to-indigo-600/10 border-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Total dos Produtos</span>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {fmtBRL(produtos.reduce((sum, p) => {
                            const unit = Number(p.valor_unitario || 0)
                            const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            const line = Math.max(0, (unit - capped) * (p.quantidade || 1))
                            return sum + line
                          }, 0))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(5)}>
                  <IconChevronLeft size={20} />
                  Voltar
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setStep(7)}>
                  Pular Etapa
                </Button>
                <Button size="lg" onClick={() => setStep(7)}>
                  Continuar
                  <IconChevronRight size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parte 07 - Informações da Proposta */}
        {step === 7 && (
          <Card className="border-2 py-0 pb-4 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-600/10 border-b">
              <CardTitle className="flex items-center gap-2 pt-4 text-2xl">
                <IconChecklist className="h-6 w-6 text-green-600 dark:text-green-400" />
                Informações da Proposta
              </CardTitle>
              <CardDescription className="text-base">
                Complete os dados finais da proposta comercial
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">

              {/* Form Fields */}
              <div className="p-5 bg-muted/30 rounded-lg border-2 border-dashed space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposal-title" className="text-sm font-semibold flex items-center gap-2">
                      <IconFileText size={16} />
                      Título <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="proposal-title"
                      value={form.titulo}
                      onChange={(e) => setForm(s => ({ ...s, titulo: e.target.value }))}
                      className="h-11"
                      placeholder="Título da proposta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposal-indication" className="text-sm font-semibold">Indicação</Label>
                    <Select
                      value={form.indicacao_id ? String(form.indicacao_id) : undefined}
                      onValueChange={(v) => setForm(s => ({ ...s, indicacao_id: v === 'none' ? undefined : Number(v) }))}
                    >
                      <SelectTrigger id="proposal-indication" className="h-11 w-full">
                        <SelectValue placeholder="Selecione uma indicação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem indicação</SelectItem>
                        {indicacoes.map(u => (<SelectItem key={u.id} value={String(u.id)}>{`${u.nome} ${u.sobrenome || ''}`.trim()}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposal-date" className="text-sm font-semibold">Data da Elaboração</Label>
                    <Input
                      id="proposal-date"
                      type="date"
                      value={form.data || ''}
                      onChange={(e) => setForm(s => ({ ...s, data: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposal-status" className="text-sm font-semibold">Status da Proposta</Label>
                    <Select value={form.status} onValueChange={(v) => setForm(s => ({ ...s, status: v }))}>
                      <SelectTrigger id="proposal-status" className="h-11 w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPOSAL_STATUSES.map(s => (<SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="proposal-obs" className="text-sm font-semibold">Observações</Label>
                    <Input
                      id="proposal-obs"
                      value={form.observacoes || ''}
                      onChange={(e) => setForm(s => ({ ...s, observacoes: e.target.value }))}
                      placeholder="Observações opcionais"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              {(programas.length > 0 || cursos.length > 0 || quimicos.length > 0 || produtos.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {programas.length > 0 && (
                    <Card className="bg-purple-50 dark:bg-purple-950/20 border-2">
                      <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{programas.length}</div>
                        <div className="text-xs text-muted-foreground">Programas</div>
                      </CardContent>
                    </Card>
                  )}
                  {cursos.length > 0 && (
                    <Card className="bg-gradient-to-r from-orange-500/5 to-orange-600/10 border-2">
                      <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{cursos.length}</div>
                        <div className="text-xs text-muted-foreground">Cursos</div>
                      </CardContent>
                    </Card>
                  )}
                  {quimicos.length > 0 && (
                    <Card className="bg-gradient-to-r from-teal-500/5 to-teal-600/10 border-2">
                      <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-teal-600 dark:text-teal-400">{quimicos.length}</div>
                        <div className="text-xs text-muted-foreground">Químicos</div>
                      </CardContent>
                    </Card>
                  )}
                  {produtos.length > 0 && (
                    <Card className="bg-gradient-to-r from-indigo-500/5 to-indigo-600/10 border">
                      <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{produtos.length}</div>
                        <div className="text-xs text-muted-foreground">Produtos</div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Total Geral */}
              {(programas.length > 0 || cursos.length > 0 || quimicos.length > 0 || produtos.length > 0) && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-2">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Valor Total da Proposta</span>
                      <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {fmtBRL(
                          programas.reduce((sum, p) => {
                            const unit = Number(p.valor_unitario || 0)
                            const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            return sum + Math.max(0, (unit - capped) * (p.quantidade || 1))
                          }, 0) +
                          cursos.reduce((sum, c) => {
                            const unit = Number(c.valor_unitario || 0)
                            const descontoPerUnit = c.descontoIsPercent ? (Number(c.desconto || 0) / 100) * unit : Number(c.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            return sum + Math.max(0, (unit - capped) * (c.quantidade || 1))
                          }, 0) +
                          quimicos.reduce((sum, q) => {
                            const unit = Number(q.valor_unitario || 0)
                            const descontoPerUnit = q.descontoIsPercent ? (Number(q.desconto || 0) / 100) * unit : Number(q.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            return sum + Math.max(0, (unit - capped) * (q.pontos || 1))
                          }, 0) +
                          produtos.reduce((sum, p) => {
                            const unit = Number(p.valor_unitario || 0)
                            const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                            const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                            return sum + Math.max(0, (unit - capped) * (p.quantidade || 1))
                          }, 0)
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator className="my-6" />

              <div className="flex gap-3 justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(6)}>
                  <IconChevronLeft size={20} />
                  Voltar
                </Button>
                <Button
                  size="lg"
                  className="min-w-[200px] shadow-lg hover:shadow-xl"
                  onClick={async () => {
                    try {
                      if (!company?.id) { toastError('Cadastre/Selecione a empresa antes'); return }
                      if (!unitId) { toastError('Selecione a unidade'); return }
                      const payload: CreateProposalPayload = {
                        titulo: form.titulo || undefined,
                        empresa_id: company.id,
                        unidade_id: unitId,
                        responsavel_id: user?.id,
                        indicacao_id: form.indicacao_id || undefined,
                        data: form.data || undefined,
                        status: form.status || 'pendente',
                        observacoes: form.observacoes || undefined,
                      }
                      const created = await createProposal(payload)
                      toastSuccess('Proposta criada')
                      // Add selected items to the created proposal
                      const pid = Number((created as any).id)

                      // Helper to convert percent discount to absolute value
                      const convertDiscount = async (item: any, unitPrice?: number) => {
                        if (!item.descontoIsPercent) return Number(item.desconto || 0)
                        const percent = Number(item.desconto || 0)
                        const price = typeof unitPrice === 'number' ? unitPrice : Number(item.valor_unitario || 0)
                        return Math.round((percent / 100) * price * 100) / 100
                      }

                      // Programs: fetch price per program when needed
                      const programPromises = programas.map(async (p: any) => {
                        let unit = 0
                        try {
                          const pr = await getProgramPrice(p.programa_id, p.quantidade)
                          unit = Number(pr.preco_unitario ?? pr.preco_unitario ?? 0)
                        } catch (err) {
                          unit = 0
                        }
                        const descontoVal = await convertDiscount(p, unit)
                        return addProgramToProposal(pid, { programa_id: p.programa_id, quantidade: p.quantidade, desconto: descontoVal, acrescimo_mensal: Math.max(0, Number(p.acrescimo_mensal || 0)) })
                      })

                      // Courses: use valor_unitario available on item
                      const coursePromises = cursos.map(async (c: any) => {
                        const descontoVal = await convertDiscount(c, c.valor_unitario)
                        return addCourseToProposal(pid, { curso_id: c.curso_id, quantidade: c.quantidade, valor_unitario: c.valor_unitario, desconto: descontoVal })
                      })

                      // Chemicals: use valor_unitario available on item
                      const chemicalPromises = quimicos.map(async (q: any) => {
                        const descontoVal = await convertDiscount(q, q.valor_unitario)
                        return addChemicalToProposal(pid, { grupo: q.grupo, pontos: q.pontos, valor_unitario: q.valor_unitario, desconto: descontoVal })
                      })

                      // Products: fetch price rule to determine unit price
                      const productPromises = produtos.map(async (p: any) => {
                        let unit = 0
                        try {
                          const rule = await getProductPrice(p.produto_id, p.quantidade)
                          unit = Number(rule.preco_unitario ?? 0)
                        } catch (err) {
                          unit = 0
                        }
                        const descontoVal = await convertDiscount(p, unit)
                        return addProductToProposal(pid, { produto_id: p.produto_id, quantidade: p.quantidade, desconto: descontoVal })
                      })

                      await Promise.all([...programPromises, ...coursePromises, ...chemicalPromises, ...productPromises])
                      navigate(`/comercial/proposta/${pid}`)
                    } catch (e: any) {
                      toastError(e?.message || 'Falha ao criar proposta')
                    }
                  }}
                >
                  <IconChecklist size={20} />
                  Finalizar Proposta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
