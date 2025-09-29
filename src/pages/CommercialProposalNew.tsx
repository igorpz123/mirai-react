import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { toastError, toastWarning, toastSuccess } from '@/lib/customToast'
import { useAuth } from '@/hooks/use-auth'
import { useUnit } from '@/contexts/UnitContext'
import { getCompanyByCNPJ, createCompany, type Company } from '@/services/companies'
import { getProductsCatalog, getCoursesCatalog, getChemicalsCatalog, type Curso, type Produto, type Quimico, addCourseToProposal, addChemicalToProposal, addProductToProposal, createProposal, type CreateProposalPayload, PROPOSAL_STATUSES, getProgramsCatalog, type Programa, addProgramToProposal, getProgramPrice, getProductPrice } from '@/services/proposals'
import { getUsersByUnitId } from '@/services/users'
import { SiteHeader } from '@/components/layout/site-header'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { onlyDigits, formatCNPJ, validateCNPJ } from '@/lib/utils'

export default function CommercialProposalNew() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unitId } = useUnit()

  // step control
  const [step, setStep] = React.useState(1)

  // custom step labels for the progress component
  const stepLabels = [
    'Consulta',
    'Empresa',
    'Programas',
    'Cursos',
    'Químicos',
    'Produtos',
    'Proposta',
  ]

  // progress value (0-100) where step 1 = 0% and last step = 100%
  const progressValue = Math.round(((step - 1) / (stepLabels.length - 1)) * 100)

  // Step 1: CNPJ
  const [cnpj, setCnpj] = React.useState('')
  const cnpjDigits = React.useMemo(() => onlyDigits(cnpj), [cnpj])
  const cnpjIsValid = React.useMemo(() => validateCNPJ(cnpjDigits), [cnpjDigits])

  // Step 2: Company info
  const [company, setCompany] = React.useState<Company | null>(null)
  const [empresaForm, setEmpresaForm] = React.useState({ cnpj: '', razao_social: '', nome_fantasia: '', cidade: '' })

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

  return (
    <div className='container-main'>
      <SiteHeader title="Nova Proposta Comercial" />
      <div className="p-4 space-y-6 mx-4">

        {/* Step navigation */}
        <div className="space-y-3">
          <div className="relative mx-20">
            <Progress value={progressValue} indicatorClassName={progressValue > 0 ? 'bg-success/30' : undefined} />
            {/* interactive indicators positioned over the progress bar */}
            <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
              <div className="relative h-6">
                {stepLabels.map((label, idx) => {
                  const s = idx + 1
                  const pos = Math.round((idx / (stepLabels.length - 1)) * 100)
                  const isDone = s < step
                  return (
                    <button
                      key={`indicator-${s}`}
                      type="button"
                      onClick={() => setStep(s)}
                      title={label}
                      aria-current={step === s}
                      className="pointer-events-auto absolute top-0 transform -translate-x-1/2"
                      style={{ left: `${pos}%` }}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-600' : step === s ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}
                      />
                      <span className="sr-only">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {stepLabels.map((label, idx) => {
              const s = idx + 1
              const isDone = s < step
              return (
                <Button
                  key={`step-${s}`}
                  variant={step === s ? 'default' : 'outline'}
                  onClick={() => setStep(s)}
                  className={isDone ? 'button-success' : ''}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Parte 01 - Consulta da Empresa */}
        {step === 1 && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Consulta da Empresa</h2>
            <div className="max-w-md">
              <div className="text-sm mb-1">CNPJ</div>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                aria-invalid={cnpj.length > 0 && !cnpjIsValid}
                className={cnpj.length > 0 && !cnpjIsValid ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {cnpj.length > 0 && !cnpjIsValid && (
                <p className="text-destructive text-xs mt-1">CNPJ inválido</p>
              )}
            </div>
            <div>
              <Button disabled={!cnpjIsValid} onClick={async () => {
                try {
                  const cmp = await getCompanyByCNPJ(onlyDigits(cnpj))
                  if (cmp) {
                    setCompany(cmp)
                    setEmpresaForm({ cnpj: formatCNPJ(cmp.cnpj || cnpj), razao_social: cmp.razao_social || '', nome_fantasia: cmp.nome || '', cidade: cmp.cidade || '' })
                    setCnpj(formatCNPJ(cmp.cnpj || cnpj))
                    toastSuccess('Empresa localizada')
                  } else {
                    setCompany(null)
                    setEmpresaForm({ cnpj: formatCNPJ(cnpj), razao_social: '', nome_fantasia: '', cidade: '' })
                    toastWarning('Empresa não cadastrada, preencha os dados na próxima etapa')
                  }
                  setStep(2)
                } catch (e: any) {
                  toastError(e?.message || 'Falha na consulta do CNPJ')
                }
              }}>Consultar</Button>
            </div>
          </section>
        )}

        {/* Parte 02 - Informações da Empresa */}
        {step === 2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Informações da Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm mb-1">Razão Social</div>
                <Input value={empresaForm.razao_social} onChange={(e) => setEmpresaForm(s => ({ ...s, razao_social: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm mb-1">Nome Fantasia</div>
                <Input value={empresaForm.nome_fantasia} onChange={(e) => setEmpresaForm(s => ({ ...s, nome_fantasia: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm mb-1">Cidade</div>
                <Input value={empresaForm.cidade} onChange={(e) => setEmpresaForm(s => ({ ...s, cidade: e.target.value }))} />
              </div>
              
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={async () => {
                // if company not found, create
                if (!company) {
                  try {
                    const created = await createCompany({
                      cnpj: onlyDigits(empresaForm.cnpj || cnpj),
                      razao_social: empresaForm.razao_social,
                      nome_fantasia: empresaForm.nome_fantasia,
                      cidade: empresaForm.cidade,
                    })
                    setCompany({ ...created, nome: created.nome })
                    toastSuccess('Empresa cadastrada')
                  } catch (e: any) {
                    toastError(e?.message || 'Falha ao cadastrar empresa')
                    return
                  }
                }
                setStep(3)
              }}>Continuar</Button>
            </div>
          </section>
        )}

        {/* Parte 03 - Programas de Prevenção */}
        {step === 3 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Programas de Prevenção</h2>
            <div className="text-sm text-muted-foreground">Selecione programa, quantidade e desconto. (Opcional - pode pular)</div>
            <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
              <div>
                <div className="text-sm mb-1">Programa</div>
                <div className="md:col-span-2">
                  <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v) }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="text-sm mb-1">Quantidade</div>
                <Input type="number" min={1} value={programQuantity} onChange={(e) => setProgramQuantity(Number(e.target.value || 1))} className="w-full" />
              </div>
              <div>
                <div className="text-sm mb-1">Desconto (R$ ou %)</div>
                <Input type="text" value={programDiscount} onChange={(e) => setProgramDiscount(e.target.value)} className="w-full" />
              </div>
              <div>
                <div className="text-sm mb-1">Acréscimo Mensal (R$)</div>
                <Input type="text" value={programIncrement} onChange={(e) => setProgramIncrement(e.target.value)} className="w-full" />
              </div>
              <div className="flex items-end">
                <Button className='button-primary rounded-full' onClick={async () => {
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
                }}><IconPlus /></Button>
              </div>
            </div>
            {programas.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programa</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor Unit. (mês)</TableHead>
                      <TableHead>Desc (R$ ou %)</TableHead>
                      <TableHead>Acrésc. Mensal (R$)</TableHead>
                      <TableHead>Valor Total (anual)</TableHead>
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
                            <Button className='button-remove' onClick={() => setProgramas(prev => prev.filter((_, i) => i !== idx))}><IconTrash />Remover</Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-2">
                  <div className="text-sm font-medium">Total dos programas adicionados (anual): {fmtBRL(programas.reduce((sum, p) => {
                    const unit = Number(p.valor_unitario || 0)
                    const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                    const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                    const monthlyBase = Math.max(0, (unit - capped) * (p.quantidade || 1))
                    const inc = Math.max(0, Number(p.acrescimo_mensal || 0))
                    const monthly = Math.max(0, monthlyBase + inc)
                    return sum + (monthly * 12)
                  }, 0))}</div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={() => setStep(4)}>Pular</Button>
              <Button onClick={() => setStep(4)}>Continuar</Button>
            </div>
          </section>
        )}

        {/* Parte 04 - Cursos */}
        {step === 4 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Cursos</h2>
            <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="text-sm mb-1">Curso</div>
                <Select value={selectedCourseId} onValueChange={(v) => setSelectedCourseId(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (<SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Quantidade</div>
                <Input type="number" min={1} value={courseQuantity} onChange={(e) => setCourseQuantity(Number(e.target.value || 1))} className="w-full" />
              </div>
              <div>
                <div className="text-sm mb-1">Desconto (R$ ou %)</div>
                <Input type="text" value={courseDiscount} onChange={(e) => setCourseDiscount(e.target.value)} className="w-full" />
              </div>
              <div className="flex items-end">
                <Button className='button-primary rounded-full' onClick={() => {
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
            {cursos.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead className='text-left'>Valor Unit</TableHead>
                      <TableHead>Desc (R$ ou %)</TableHead>
                      <TableHead>Valor Total</TableHead>
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
                <div className="flex justify-end mt-2">
                  <div className="text-sm font-medium">Total dos cursos adicionados: {fmtBRL(cursos.reduce((sum, c) => {
                    const unit = Number(c.valor_unitario || 0)
                    const descontoPerUnit = c.descontoIsPercent ? (Number(c.desconto || 0) / 100) * unit : Number(c.desconto || 0)
                    const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                    const line = Math.max(0, (unit - capped) * (c.quantidade || 1))
                    return sum + line
                  }, 0))}</div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>Voltar</Button>
              <Button onClick={() => setStep(5)}>Pular</Button>
              <Button onClick={() => setStep(5)}>Continuar</Button>
            </div>
          </section>
        )}

        {/* Parte 05 - Químicos */}
        {step === 5 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Químicos</h2>
            <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="text-sm mb-1">Químico (grupo)</div>
                <Select value={selectedChemicalIdx} onValueChange={(v) => setSelectedChemicalIdx(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {chemicals.map((q, idx) => (<SelectItem key={`chem-${q.id ?? idx}`} value={String(idx)}>{q.descricao || q.grupo || `Químico ${q.id}`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Pontos</div>
                <Input type="number" min={1} value={chemicalPontos} onChange={(e) => setChemicalPontos(Number(e.target.value || 1))} className="w-full" />
              </div>
              <div>
                <div className="text-sm mb-1">Desconto (R$ ou %)</div>
                <Input type="text" value={chemicalDiscount} onChange={(e) => setChemicalDiscount(e.target.value)} className="w-full" />
              </div>
              <div className="flex items-end">
                <Button className='button-primary rounded-full' onClick={() => {
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
            {quimicos.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Valor Unit</TableHead>
                      <TableHead>Desc (R$ ou %)</TableHead>
                      <TableHead>Valor Total</TableHead>
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

                <div className="flex justify-end mt-2">
                  <div className="text-sm font-medium">Total dos químicos adicionados: {fmtBRL(quimicos.reduce((sum, q) => {
                    const unit = Number(q.valor_unitario || 0)
                    const descontoPerUnit = q.descontoIsPercent ? (Number(q.desconto || 0) / 100) * unit : Number(q.desconto || 0)
                    const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                    const line = Math.max(0, (unit - capped) * (q.pontos || 1))
                    return sum + line
                  }, 0))}</div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(4)}>Voltar</Button>
              <Button onClick={() => setStep(6)}>Pular</Button>
              <Button onClick={() => setStep(6)}>Continuar</Button>
            </div>
          </section>
        )}

        {/* Parte 06 - Produtos */}
        {step === 6 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Produtos</h2>
            <div className="grid gap-4 items-end grid-cols-1 md:grid-cols-5">
              <div className='md:col-span-2'>
                <div className="text-sm mb-1">Produto</div>
                <Select value={selectedProductId} onValueChange={(v) => setSelectedProductId(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Quantidade</div>
                <Input type="number" min={1} value={productQuantity} onChange={(e) => setProductQuantity(Number(e.target.value || 1))} className="w-full" />
              </div>
              <div>
                <div className="text-sm mb-1">Desconto (R$ ou %)</div>
                <Input type="text" value={productDiscount} onChange={(e) => setProductDiscount(e.target.value)} className="w-full" />
              </div>
              <div className="flex items-end">
                <Button className='rounded-full button-primary' onClick={async () => {
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
            {produtos.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Desc</TableHead>
                      <TableHead>Valor Total</TableHead>
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

                <div className="flex justify-end mt-2">
                  <div className="text-sm font-medium">Total dos produtos adicionados: {fmtBRL(produtos.reduce((sum, p) => {
                    const unit = Number(p.valor_unitario || 0)
                    const descontoPerUnit = p.descontoIsPercent ? (Number(p.desconto || 0) / 100) * unit : Number(p.desconto || 0)
                    const capped = Math.min(Math.max(0, descontoPerUnit), unit)
                    const line = Math.max(0, (unit - capped) * (p.quantidade || 1))
                    return sum + line
                  }, 0))}</div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(5)}>Voltar</Button>
              <Button onClick={() => setStep(7)}>Pular</Button>
              <Button onClick={() => setStep(7)}>Continuar</Button>
            </div>
          </section>
        )}

        {/* Parte 07 - Informações da Proposta */}
        {step === 7 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Informações da Proposta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
              <div>
                <div className="text-sm mb-1">Título</div>
                <Input value={form.titulo} onChange={(e) => setForm(s => ({ ...s, titulo: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm mb-1">Indicação</div>
                <Select
                  value={form.indicacao_id ? String(form.indicacao_id) : undefined}
                  onValueChange={(v) => setForm(s => ({ ...s, indicacao_id: v === 'none' ? undefined : Number(v) }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem indicação</SelectItem>
                    {indicacoes.map(u => (<SelectItem key={u.id} value={String(u.id)}>{`${u.nome} ${u.sobrenome || ''}`.trim()}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm mb-1">Data da Elaboração</div>
                <Input type="date" value={form.data || ''} onChange={(e) => setForm(s => ({ ...s, data: e.target.value }))} />
              </div>
              <div>
                <div className="text-sm mb-1">Status da Proposta</div>
                <Select value={form.status} onValueChange={(v) => setForm(s => ({ ...s, status: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_STATUSES.map(s => (<SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm mb-1">Observações</div>
                <Input value={form.observacoes || ''} onChange={(e) => setForm(s => ({ ...s, observacoes: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(6)}>Voltar</Button>
              <Button
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
              >Finalizar</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
