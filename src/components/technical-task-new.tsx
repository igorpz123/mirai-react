"use client";

import React, { useState } from "react";
import type { ChangeEvent } from "react";
import { createTask } from '@/services/tasks'
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUnit } from '@/contexts/UnitContext'
import { useAuth } from '@/hooks/use-auth'
import { getCompaniesByResponsible, type Company } from '@/services/companies'
import { getSetores, type Setor } from '@/services/setores'
import { getTipoTarefa, type TipoTarefa } from '@/services/tipoTarefa'
import { useUsers } from '@/contexts/UsersContext'
import { getUsersByDepartmentAndUnit } from '@/services/users'
// import { IconSearch } from '@tabler/icons-react'

interface FormData {
  unidade: string;
  empresa: string;
  setorResponsavel: string;
  usuarioResponsavel?: string;
  finalidade: string;
  prazo: string;
  prioridade: string;
  arquivos?: File[];
  observacoes: string;
}

interface SelectOption {
  value: string;
  label: string;
}

 
 // small combobox component for searching/selecting company
 function CompanyComboBox({ value, onChange }: { value: string; onChange: (val: string) => void }) {
   const { unitId } = useUnit()
   const { user } = useAuth()
   const [companies, setCompanies] = useState<Company[]>([])
   const [loading, setLoading] = useState(false)
   const [query, setQuery] = useState('')
   const [open, setOpen] = useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        let res
        if (unitId) {
          try {
            // try direct unit endpoint first
            // import getCompaniesByUnit dynamically to avoid circular issues
            const mod = await import('@/services/companies')
            if (mod.getCompaniesByUnit) {
              res = await mod.getCompaniesByUnit(unitId)
              console.debug('[CompanyComboBox] getCompaniesByUnit result', { unitId, count: res?.companies?.length })
            }
          } catch (e) {
            // ignore and fallback
            console.debug('[CompanyComboBox] getCompaniesByUnit failed', e)
          }
        }

        // If the unit endpoint returned nothing (empty list) we still try the fallback
        if (!res || !(res.companies && res.companies.length > 0)) {
          console.debug('[CompanyComboBox] falling back to getCompaniesByResponsible', { unitId, userId: user.id })
          res = await getCompaniesByResponsible(Number(user.id), unitId ?? undefined)
        }
        if (!mounted) return
        setCompanies(res.companies || [])
      } catch (err) {
        console.error('Erro ao carregar empresas:', err)
        if (!mounted) return
        setCompanies([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user, unitId])

   const filtered = React.useMemo(() => {
     const q = query.trim().toLowerCase()
     if (!q) return companies
     return companies.filter(c => (c.nome || '').toLowerCase().includes(q))
   }, [companies, query])

   const selected = companies.find(c => String(c.id) === value)

   return (
     <div className="relative">
       <Input
         placeholder={loading ? 'Carregando...' : 'Busque por empresa...'}
         value={selected ? selected.nome : query}
         onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
         onFocus={() => setOpen(true)}
           aria-autocomplete="list"
           aria-expanded={open}
         />
         {open && (
           <div className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-auto rounded border bg-popover">
             {filtered.length === 0 ? (
               <div className="p-2 text-sm text-muted-foreground">Nenhuma empresa</div>
             ) : (
               filtered.map((c) => (
                 <button
                   key={c.id}
                   type="button"
                   className="w-full text-left px-3 py-2 hover:bg-muted"
                   onClick={() => { onChange(String(c.id)); setOpen(false); setQuery('') }}
                 >
                   {c.nome}
                 </button>
               ))
             )}
           </div>
         )}
     </div>
   )
 }

// dynamic setores & usuarios loaded from server
const emptySetores: Setor[] = []
const emptyUsuarios: { id: number; nome: string; sobrenome?: string }[] = []

// finalidades loaded from tipo_tarefa table
const emptyFinalidades: TipoTarefa[] = []

const mockPrioridades: SelectOption[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export const NewTaskForm: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    unidade: "",
    empresa: "",
    setorResponsavel: "",
    usuarioResponsavel: "",
    finalidade: "",
    prazo: "",
    prioridade: "",
    observacoes: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [setores, setSetores] = useState<Setor[]>(emptySetores)
  const [usuariosOptions, setUsuariosOptions] = useState<{ id: number; nome: string; sobrenome?: string }[]>(emptyUsuarios)
  const [finalidades, setFinalidades] = useState<TipoTarefa[]>(emptyFinalidades)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const { unitId } = useUnit()
  const { user } = useAuth()
  const usersCtx = useUsers()

  const handleNext = () => {
    // Pode adicionar validação antes de avançar para a próxima step
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // load setores on mount
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await getSetores()
        if (!mounted) return
        setSetores(res.setores || [])
      } catch (err) {
        console.error('Erro ao carregar setores:', err)
        if (!mounted) return
        setSetores([])
      }
    })()
    return () => { mounted = false }
  }, [])

  // when setorResponsavel or unit changes, load users for that unit+setor
  React.useEffect(() => {
    let mounted = true
    const setorId = formData.setorResponsavel
    ;(async () => {
      if (!setorId) {
        setUsuariosOptions(emptyUsuarios)
        return
      }
      if (!unitId) {
        // no unit selected, cannot fetch users by unit+setor
        console.debug('[NewTaskForm] skip fetching users: no unitId', { setorId })
        setUsuariosOptions(emptyUsuarios)
        return
      }
      try {
        const sid = Number(setorId)
        const uid = Number(unitId)
        console.debug('[NewTaskForm] fetching users for unit/sector (via UsersContext)', { uid, sid })
        await usersCtx.ensureUsersForUnit(uid)
        const { users: fetched } = usersCtx.getFilteredUsersForTask({ setorId: sid, unidadeId: uid })
        // fallback: if context cache didn't return users (empty), try direct API call
        if ((!fetched || fetched.length === 0) && sid && uid) {
          try {
            console.debug('[NewTaskForm] UsersContext returned empty, falling back to API getUsersByDepartmentAndUnit', { uid, sid })
            const res = await getUsersByDepartmentAndUnit(sid, uid)
            if (!mounted) return
            const list = res?.users || []
            setUsuariosOptions(list.map(u => ({ id: u.id, nome: u.nome, sobrenome: (u as any).sobrenome || '' })))
            return
          } catch (apiErr) {
            console.warn('[NewTaskForm] fallback API call failed', apiErr)
            // continue to set from fetched (which may be empty)
          }
        }
        if (!mounted) return
        setUsuariosOptions((fetched || []).map(u => ({ id: u.id, nome: u.nome, sobrenome: (u as any).sobrenome || '' })))
      } catch (err) {
        console.error('Erro ao carregar usuarios por setor/unidade:', err)
        if (!mounted) return
        setUsuariosOptions([])
      }
    })()
    return () => { mounted = false }
    // NOTE: we intentionally exclude `usersCtx` from deps because the
    // UsersContext provider mutates its internal cache which changes the
    // context value identity on each update; including it here causes this
    // effect to re-run continuously. We only want to re-run when the
    // selected setor or unit change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.setorResponsavel, unitId])

  // load finalidades when setor changes
  React.useEffect(() => {
    let mounted = true
    const setorId = formData.setorResponsavel
    ;(async () => {
      try {
        const sid = setorId ? Number(setorId) : undefined
        const res = await getTipoTarefa(sid)
        if (!mounted) return
        setFinalidades(res.tipos || [])
      } catch (err) {
        console.error('Erro ao carregar finalidades:', err)
        if (!mounted) return
        setFinalidades([])
      }
    })()
    return () => { mounted = false }
  }, [formData.setorResponsavel])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    ;(async () => {
      setSubmitError(null)
      setSubmitSuccess(null)
      // basic validation
      if (!formData.empresa) {
        setSubmitError('Por favor selecione uma empresa')
        return
      }
      if (!formData.finalidade) {
        setSubmitError('Por favor selecione a finalidade')
        return
      }

      setSubmitting(true)
      try {
        // build payload matching server NewTaskBody
        const empresa_id = formData.empresa ? Number(formData.empresa) : undefined
        const finalidade_id = formData.finalidade && formData.finalidade !== 'outro' ? Number(formData.finalidade) : undefined
        const setor_id = formData.setorResponsavel ? Number(formData.setorResponsavel) : undefined
        const responsavel_id = formData.usuarioResponsavel ? Number(formData.usuarioResponsavel) : null
        const unidade_id = unitId ? Number(unitId) : (formData.unidade ? Number(formData.unidade) : undefined)

        if (!empresa_id) {
          throw new Error('empresa_id ausente')
        }
        if (!unidade_id) {
          throw new Error('unidade_id ausente')
        }

        const payloadServer = {
          empresa_id,
          finalidade: finalidade_id,
          prioridade: formData.prioridade || 'media',
          status: 'pendente',
          prazo: formData.prazo || null,
          setor_id: setor_id || null,
          responsavel_id: responsavel_id || null,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          created_by: user ? Number(user.id) : null,
          observacoes: formData.observacoes || null,
          unidade_id: Number(unidade_id),
        }

  await createTask(payloadServer as any)
        setSubmitSuccess('Tarefa criada com sucesso')
        // reset form
        setFormData({
          unidade: "",
          empresa: "",
          setorResponsavel: "",
          usuarioResponsavel: "",
          finalidade: "",
          prazo: "",
          prioridade: "",
          observacoes: "",
        })
        setSelectedFiles([])
        setStep(1)
            // createTask response available when needed
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setSubmitError(msg)
      } finally {
        setSubmitting(false)
      }
  })()
  };

  return (
    <div className="w-full">
      <SiteHeader title='Criar Nova Tarefa' />
      <div className="p-6 max-w-4xl mx-auto mt-4 bg-card rounded-lg shadow">
        {step === 1 && (
          <div className="space-y-4 grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="empresa" className="mb-2">Empresa</Label>
              <CompanyComboBox
                value={formData.empresa}
                onChange={(val) => handleSelectChange('empresa', val)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="setorResponsavel" className="mb-2">Setor</Label>
              <Select value={formData.setorResponsavel}
                onValueChange={(value) => handleSelectChange("setorResponsavel", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores
                    .filter((item) => item && item.id !== undefined && item.id !== null)
                    .map((item) => (
                      <SelectItem key={String(item.id)} value={String(item.id)}>
                        {item.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="usuarioResponsavel" className="mb-2">Responsável (opcional)</Label>
              <Select value={formData.usuarioResponsavel}
                onValueChange={(value) => handleSelectChange("usuarioResponsavel", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosOptions
                    .filter((item) => item && item.id !== undefined && item.id !== null && !Number.isNaN(Number(item.id)))
                    .map((item) => (
                      <SelectItem key={String(item.id)} value={String(item.id)}>
                        {item.nome} {item.sobrenome ? item.sobrenome : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label htmlFor="finalidade" className="mb-2">Finalidade</Label>
              <Select value={formData.finalidade}
                onValueChange={(value) => handleSelectChange("finalidade", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {finalidades && finalidades.length > 0 ? (
                    finalidades.map((f) => (
                      <SelectItem key={String(f.id)} value={String(f.id)}>
                        {f.tipo}
                      </SelectItem>
                    ))
                  ) : (
                    // fallback: show 'Outro' if nothing loaded
                    <SelectItem value="outro">Outro</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prazo" className="mb-2">Prazo</Label>
              <Input
                type="date"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
                className="w-auto"
              />
            </div>
            <div>
              <Label htmlFor="prioridade" className="mb-2">Prioridade</Label>
              <Select value={formData.prioridade}
                onValueChange={(value) => handleSelectChange("prioridade", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {mockPrioridades.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivos" className="mb-2">Upload de Arquivos</Label>
              <Input
                type="file"
                name="arquivos"
                multiple
                onChange={handleFileChange}
                className="w-full"
              />
              {selectedFiles.length > 0 ? (
                <div className="text-sm text-muted-foreground mt-2">{selectedFiles.length} arquivo(s) selecionado(s)</div>
              ) : null}
            </div>
            <div>
              <Label htmlFor="observacoes" className="mb-2">Observações</Label>
              <Textarea
                name="observacoes"
                placeholder="Digite suas observações..."
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {submitError ? <div className="text-destructive">{submitError}</div> : null}
          {submitSuccess ? <div className="text-success">{submitSuccess}</div> : null}
          <div className="flex justify-between mt-2">
            {step > 1 ? (
              <Button className="cursor-pointer" variant="outline" onClick={handleBack} disabled={submitting}>
                Voltar
              </Button>
            ) : <div /> }

            {step < 3 ? (
              <Button className="button-primary" onClick={handleNext} disabled={submitting}>Próximo</Button>
            ) : (
              <Button className="button-success" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar'}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTaskForm;