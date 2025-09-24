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
import { toastError, toastSuccess } from '@/lib/customToast'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { onlyDigits, formatCNPJ, validateCNPJ } from '@/lib/utils'

export default function EmpresaDetails() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [empresa, setEmpresa] = useState<Company | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [tecnicos, setTecnicos] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [proposals, setProposals] = useState<any[]>([])

  const [form, setForm] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    cidade: '',
    telefone: '',
    unidade_responsavel: null as number | null,
    tecnico_responsavel: null as number | null,
  })

  const cnpjDigits = useMemo(() => onlyDigits(form.cnpj), [form.cnpj])
  const cnpjIsValid = useMemo(() => (cnpjDigits.length === 0 || validateCNPJ(cnpjDigits)), [cnpjDigits])
  const canSave = useMemo(() => {
    return (form.nome_fantasia?.trim().length ?? 0) > 0 && cnpjIsValid
  }, [form.nome_fantasia, cnpjIsValid])

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
            cidade: (data as any).cidade || '',
            telefone: (data as any).telefone || '',
            unidade_responsavel: (data as any).unidade_id ?? (data as any).unidade_responsavel ?? null,
            tecnico_responsavel: (data as any).tecnico_responsavel ?? null,
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

  const handleSave = async () => {
    if (!id) return
    if (!canSave) {
      toastError('Preencha os campos obrigatórios e verifique o CNPJ')
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
      const updated = await updateCompany(Number(id), payload)
      setEmpresa(updated)
      toastSuccess('Empresa atualizada')
    } catch (e: any) {
      toastError(e?.message || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-main">
      <SiteHeader title={`Empresa #${id}`} />
      <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 mx-6">
        {loading && <div>Carregando...</div>}
        {!loading && (
          <>
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
                      setForm(f => ({ ...f, cnpj: masked }))
                    }}
                    placeholder="00.000.000/0000-00"
                    aria-invalid={!cnpjIsValid && !!form.cnpj}
                    className={!cnpjIsValid && !!form.cnpj ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {!cnpjIsValid && !!form.cnpj && (
                    <p className="text-destructive text-xs mt-1">CNPJ inválido</p>
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
                    cidade: (empresa as any).cidade || '',
                    telefone: (empresa as any).telefone || '',
                    unidade_responsavel: (empresa as any).unidade_id ?? (empresa as any).unidade_responsavel ?? null,
                    tecnico_responsavel: (empresa as any).tecnico_responsavel ?? null,
                  })
                }}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!canSave || saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
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
      </div>
    </div>
  )
}
