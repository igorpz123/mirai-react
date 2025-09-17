import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useUnit } from '@/contexts/UnitContext'
import { getCompanyByCNPJ, createCompany, type Company } from '@/services/companies'
import { getProductsCatalog, getCoursesCatalog, getChemicalsCatalog, type Curso, type Produto, type Quimico, addCourseToProposal, addChemicalToProposal, addProductToProposal, createProposal, type CreateProposalPayload, PROPOSAL_STATUSES, getProgramsCatalog, type Programa, addProgramToProposal } from '@/services/proposals'
import { getUsersByUnitId } from '@/services/users'

export default function CommercialProposalNew() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unitId } = useUnit()

  // step control
  const [step, setStep] = React.useState(1)

  // Step 1: CNPJ
  const [cnpj, setCnpj] = React.useState('')

  // Step 2: Company info
  const [company, setCompany] = React.useState<Company | null>(null)
  const [empresaForm, setEmpresaForm] = React.useState({ cnpj: '', razao_social: '', nome_fantasia: '', cidade: '' })

  // Items buffers (for display before creation)
  const [programas, setProgramas] = React.useState<{ programa_id: number; nome?: string; quantidade: number; desconto: number }[]>([])
  const [cursos, setCursos] = React.useState<{ curso_id: number; nome?: string; quantidade: number; valor_unitario: number; desconto: number }[]>([])
  const [quimicos, setQuimicos] = React.useState<{ grupo: string; pontos: number; valor_unitario: number; desconto: number }[]>([])
  const [produtos, setProdutos] = React.useState<{ produto_id: number; nome?: string; quantidade: number; desconto: number }[]>([])

  // Catalogs
  const [courses, setCourses] = React.useState<Curso[]>([])
  const [chemicals, setChemicals] = React.useState<Quimico[]>([])
  const [products, setProducts] = React.useState<Produto[]>([])
  const [programs, setPrograms] = React.useState<Programa[]>([])

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
    <div className="p-4 space-y-6 mx-4">
      <div className="flex items-center justify-between">
      </div>

      {/* Step navigation */}
      <div className="flex gap-2 flex-wrap">
        {[1,2,3,4,5,6,7].map(s => (
          <Button key={s} variant={step === s ? 'default' : 'outline'} onClick={() => setStep(s)}>{`Parte ${String(s).padStart(2,'0')}`}</Button>
        ))}
      </div>

      {/* Parte 01 - Consulta da Empresa */}
      {step === 1 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Consulta da Empresa</h2>
          <div className="max-w-md">
            <div className="text-sm mb-1">CNPJ</div>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <Button onClick={async () => {
              try {
                const cmp = await getCompanyByCNPJ(cnpj)
                if (cmp) {
                  setCompany(cmp)
                  setEmpresaForm({ cnpj: cmp.cnpj || cnpj, razao_social: cmp.razao_social || '', nome_fantasia: cmp.nome || '', cidade: cmp.cidade || '' })
                  toast.success('Empresa localizada')
                } else {
                  setCompany(null)
                  setEmpresaForm({ cnpj, razao_social: '', nome_fantasia: '', cidade: '' })
                  toast.message('Empresa não cadastrada, preencha os dados na próxima etapa')
                }
                setStep(2)
              } catch (e: any) {
                toast.error(e?.message || 'Falha na consulta do CNPJ')
              }
            }}>Consultar</Button>
          </div>
        </section>
      )}

      {/* Parte 02 - Informações da Empresa */}
      {step === 2 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Informações da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={async () => {
              // if company not found, create
              if (!company) {
                try {
                  const created = await createCompany({ cnpj: empresaForm.cnpj || cnpj, razao_social: empresaForm.razao_social, nome_fantasia: empresaForm.nome_fantasia, cidade: empresaForm.cidade })
                  setCompany({ ...created, nome: created.nome })
                  toast.success('Empresa cadastrada')
                } catch (e: any) {
                  toast.error(e?.message || 'Falha ao cadastrar empresa')
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
          <div className="flex gap-2 items-end">
            <div>
              <div className="text-sm mb-1">Programa</div>
              <Select onValueChange={(v) => {
                const p = programs.find(pp => pp.id === Number(v))
                if (!p) return
                setProgramas(prev => [...prev, { programa_id: p.id, nome: p.nome, quantidade: 1, desconto: 0 }])
              }}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {programas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programa</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programas.map((p, idx) => (
                  <TableRow key={`ppp-${idx}`}>
                    <TableCell>{p.nome || p.programa_id}</TableCell>
                    <TableCell className="text-right">{p.quantidade}</TableCell>
                    <TableCell className="text-right">{fmtBRL(p.desconto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="flex items-end gap-2">
            <div>
              <div className="text-sm mb-1">Curso</div>
              <Select onValueChange={(v) => {
                const c = courses.find(cc => cc.id === Number(v))
                if (!c) return
                setCursos(prev => [...prev, { curso_id: c.id, nome: c.nome, quantidade: 1, valor_unitario: Number(c.valor_unitario ?? c.preco_unitario ?? c.valor ?? c.preco ?? 0), desconto: 0 }])
              }}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => (<SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {cursos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Desc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cursos.map((c, idx) => (
                  <TableRow key={`cur-${idx}`}>
                    <TableCell>{c.nome || c.curso_id}</TableCell>
                    <TableCell className="text-right">{c.quantidade}</TableCell>
                    <TableCell className="text-right">{fmtBRL(c.valor_unitario)}</TableCell>
                    <TableCell className="text-right">{fmtBRL(c.desconto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="flex items-end gap-2">
            <div>
              <div className="text-sm mb-1">Químico (grupo)</div>
              <Select onValueChange={(v) => {
                const q = chemicals[Number(v)]
                if (!q) return
                setQuimicos(prev => [...prev, { grupo: q.grupo || 'Grupo', pontos: Number(q.pontos || 1), valor_unitario: Number(q.valor_unitario ?? q.preco_unitario ?? q.valor ?? q.preco ?? 0), desconto: 0 }])
              }}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {chemicals.map((q, idx) => (<SelectItem key={`chem-${q.id ?? idx}`} value={String(idx)}>{q.descricao || q.grupo || `Químico ${q.id}`}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {quimicos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Desc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quimicos.map((q, idx) => (
                  <TableRow key={`qui-${idx}`}>
                    <TableCell>{q.grupo}</TableCell>
                    <TableCell className="text-right">{q.pontos}</TableCell>
                    <TableCell className="text-right">{fmtBRL(q.valor_unitario)}</TableCell>
                    <TableCell className="text-right">{fmtBRL(q.desconto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="flex items-end gap-2">
            <div>
              <div className="text-sm mb-1">Produto</div>
              <Select onValueChange={(v) => {
                const p = products.find(pp => pp.id === Number(v))
                if (!p) return
                setProdutos(prev => [...prev, { produto_id: p.id, nome: p.nome, quantidade: 1, desconto: 0 }])
              }}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {produtos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Desc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p, idx) => (
                  <TableRow key={`pro-${idx}`}>
                    <TableCell>{p.nome || p.produto_id}</TableCell>
                    <TableCell className="text-right">{p.quantidade}</TableCell>
                    <TableCell className="text-right">{fmtBRL(p.desconto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  if (!company?.id) { toast.error('Cadastre/Selecione a empresa antes'); return }
                  if (!unitId) { toast.error('Selecione a unidade'); return }
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
                  toast.success('Proposta criada')
                  // Add selected items to the created proposal
                  const pid = Number((created as any).id)
                  await Promise.all([
                    ...programas.map(p => addProgramToProposal(pid, { programa_id: p.programa_id, quantidade: p.quantidade, desconto: p.desconto })),
                    ...cursos.map(c => addCourseToProposal(pid, { curso_id: c.curso_id, quantidade: c.quantidade, valor_unitario: c.valor_unitario, desconto: c.desconto })),
                    ...quimicos.map(q => addChemicalToProposal(pid, { grupo: q.grupo, pontos: q.pontos, valor_unitario: q.valor_unitario, desconto: q.desconto })),
                    ...produtos.map(p => addProductToProposal(pid, { produto_id: p.produto_id, quantidade: p.quantidade, desconto: p.desconto })),
                  ])
                  navigate(`/comercial/proposta/${pid}`)
                } catch (e: any) {
                  toast.error(e?.message || 'Falha ao criar proposta')
                }
              }}
            >Finalizar</Button>
          </div>
        </section>
      )}
    </div>
  )
}
