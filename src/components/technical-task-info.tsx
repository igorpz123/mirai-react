import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/contexts/UsersContext"
import { updateTask } from "@/services/tasks"
import { getSetores } from "@/services/setores"
import { getUsersByDepartmentAndUnit } from "@/services/users"
import { useUnit } from "@/contexts/UnitContext"
import { toast } from 'sonner'
import type { Task } from '@/services/tasks'

export function TaskInfo({
    open,
    onOpenChange,
    id,
    unidade,
    empresa,
    finalidade,
    prazo,
    status,
    prioridade,
    setor,
    responsavel,
    responsavelId,
    onRefresh,
    onTaskUpdate,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    id: string
    unidade: string
    empresa?: string
    finalidade?: string
    prazo?: string
    status?: string
    prioridade?: string
    setor?: string
    responsavel?: string
    responsavelId?: number | null
    onRefresh?: () => void
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}) {
    const { user } = useAuth()
    const usersCtx = useUsers()
    const { unitId } = useUnit()
    const [transfering, setTransfering] = React.useState(false)
    const [selectedSetorId, setSelectedSetorId] = React.useState<number | null>(null)
    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

    // determine permissions
    // determine if current user is responsible: prefer numeric id when available,
    // but also accept matches by name or email if backend only provides a string
    let isResponsible = false
    if (user) {
        if (responsavelId != null) {
            isResponsible = Number(user.id) === Number(responsavelId)
        }
        if (!isResponsible && responsavel) {
            const respStr = String(responsavel).toLowerCase()
            const userIdStr = String(user.id)
            const userName = ((user as any).nome || '').toString().toLowerCase()
            const userFullName = `${(user as any).nome || ''} ${(user as any).sobrenome || ''}`.toLowerCase().trim()
            const userEmail = ((user as any).email || '').toString().toLowerCase()

            // matches: exact id, contains name, contains full name, or contains email
            if (userIdStr === respStr) isResponsible = true
            if (!isResponsible && userFullName && respStr.includes(userFullName)) isResponsible = true
            if (!isResponsible && userName && respStr.includes(userName)) isResponsible = true
            if (!isResponsible && userEmail && respStr.includes(userEmail)) isResponsible = true
        }
    }
    const canTransferAny = user && [1, 2, 3].includes(Number(user.cargoId))

    // normalize and be permissive: accept substrings like 'pend' and 'andament' or 'progress'
    const normalizedStatus = (status || '').toString().toLowerCase()
    const isPending = normalizedStatus.includes('pend') || normalizedStatus.includes('pending')
    const isProgress = normalizedStatus.includes('progress') || normalizedStatus.includes('andament') || normalizedStatus.includes('prog')
    const showStart = isPending && isResponsible
    const showProgressActions = isProgress && (isResponsible || canTransferAny)

    // setores reais
    const [setores, setSetores] = React.useState<{ id: number; nome: string }[]>([])
    const [setoresLoading, setSetoresLoading] = React.useState(false)
    const [setoresError, setSetoresError] = React.useState<string | null>(null)

    // users filtered by selected setor (load from service when setor selected)
    const [usersForSetor, setUsersForSetor] = React.useState<any[] | null>(null)
    const [usersForSetorLoading, setUsersForSetorLoading] = React.useState(false)

    const filtered = usersForSetor ? { users: usersForSetor, loading: usersForSetorLoading, error: null } : usersCtx.getFilteredUsersForTask({ setorId: selectedSetorId ?? undefined, unidadeId: unitId ?? undefined })

    async function handleStart() {
        if (!id) return
        try {
            setLoading(true)
            setErrorMsg(null)
            await updateTask(Number(id), { status: 'progress' })
            // show toast and update parent/list
            try { toast.success('Tarefa iniciada com sucesso') } catch (e) { /* ignore */ }
            if (onTaskUpdate) {
                try { await onTaskUpdate(String(id), { status: 'progress' }) } catch (e) { /* ignore */ }
            }
            if (onRefresh) {
                try { await onRefresh() } catch (e) { /* ignore */ }
            }
            // close sheet
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            setErrorMsg(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleComplete() {
        if (!id) return
        try {
            setLoading(true)
            setErrorMsg(null)
            await updateTask(Number(id), { status: 'concluída' })
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            setErrorMsg(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleArchive() {
        if (!id) return
        try {
            setLoading(true)
            setErrorMsg(null)
            await updateTask(Number(id), { status: 'archived' })
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            setErrorMsg(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleTransfer() {
        if (!id) return
        try {
            setLoading(true)
            setErrorMsg(null)
            const payload: any = {}
            if (selectedSetorId) payload.setorId = selectedSetorId
            if (selectedUserId) payload.usuarioId = selectedUserId
            await updateTask(Number(id), payload)
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            setErrorMsg(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }

    // load setores on mount
    React.useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                setSetoresLoading(true)
                const res = await getSetores()
                if (!mounted) return
                setSetores(res.setores || [])
            } catch (e) {
                setSetoresError(e instanceof Error ? e.message : String(e))
            } finally {
                setSetoresLoading(false)
            }
        })()
        return () => { mounted = false }
    }, [])

    // when setor changes, try load users for that setor+unit from API
    React.useEffect(() => {
        let mounted = true
        if (!selectedSetorId) {
            setUsersForSetor(null)
            return
        }
        ;(async () => {
            try {
                setUsersForSetorLoading(true)
                const uId = unitId ?? undefined
                if (!uId) {
                    setUsersForSetor([])
                    return
                }
                const res = await getUsersByDepartmentAndUnit(Number(selectedSetorId), Number(uId))
                if (!mounted) return
                setUsersForSetor(res.users || [])
            } catch (e) {
                console.error('Erro ao carregar usuários do setor', e)
                setUsersForSetor([])
            } finally {
                setUsersForSetorLoading(false)
            }
        })()
        return () => { mounted = false }
    }, [selectedSetorId, unitId])
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* tor­namos o children o gatilho do sheet */}
            <SheetContent className="md:w-1/2 sm:w-full" side="right">
                <SheetHeader>
                    <SheetTitle>Tarefa {id} | Unidade {unidade} </SheetTitle>
                    <SheetDescription>
                        Visualize os detalhes da tarefa.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-empresa">Empresa</Label>
                            <Input disabled id="task-info-empresa" defaultValue={empresa} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-finalidade">Finalidade</Label>
                            <Input disabled id="task-info-finalidade" defaultValue={finalidade} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prazo">Prazo</Label>
                            <span className="font-light">{prazo}</span>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-status">Status</Label>
                            <Input disabled id="task-info-status" defaultValue={status} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-prioridade">Prioridade</Label>
                            <Input disabled id="task-info-prioridade" defaultValue={prioridade} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-setor">Setor</Label>
                            <Input disabled id="task-info-setor" defaultValue={setor} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="task-info-usuario">Responsável</Label>
                            <Input disabled id="task-info-usuario" defaultValue={responsavel} />
                        </div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="task-info-arquivos">Arquivos</Label>
                        <div id="task-info-arquivos" className="flex flex-col gap-1"></div>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="task-info-historico">Histórico</Label>
                        <div id="task-info-historico" className="flex flex-col gap-1"></div>
                    </div>
                </div>
                <div className="px-4 space-y-3">
                    {errorMsg ? (
                        <div className="text-sm text-destructive px-2">Erro: {errorMsg}</div>
                    ) : null}
                    {showStart && (
                        <Button onClick={handleStart} disabled={loading} className="w-full">Iniciar Tarefa</Button>
                    )}

                    {showProgressActions && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleComplete} disabled={loading}>Concluir</Button>
                                <Button variant="ghost" onClick={() => setTransfering(v => !v)}>Transferir</Button>
                                <Button variant="destructive" onClick={handleArchive} disabled={loading}>Arquivar</Button>
                            </div>

                            {transfering && (
                                <div className="grid gap-2">
                                    <Label htmlFor="transfer-setor">Setor (opcional)</Label>
                                    <select id="transfer-setor" className="input" value={selectedSetorId ?? ''} onChange={(e) => setSelectedSetorId(e.target.value ? Number(e.target.value) : null)}>
                                        <option value="">-- Selecionar setor --</option>
                                        {setoresLoading && <option value="">Carregando setores...</option>}
                                        {!setoresLoading && setores && setores.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome}</option>
                                        ))}
                                    </select>
                                    {setoresError ? <div className="text-destructive text-sm">Erro ao carregar setores: {setoresError}</div> : null}

                                    <Label htmlFor="transfer-user">Usuário (opcional)</Label>
                                    <select id="transfer-user" className="input" value={selectedUserId ?? ''} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}>
                                        <option value="">-- Selecionar usuário --</option>
                                        {filtered.users && filtered.users.map(u => (
                                            // @ts-ignore users may have id and nome
                                            <option key={u.id} value={u.id}>{(u.nome || u.nome_completo || `${u.email}`)}</option>
                                        ))}
                                    </select>

                                    <div className="flex justify-end">
                                        <Button onClick={handleTransfer} disabled={loading}>Confirmar Transferência</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline" className="cursor-pointer">Fechar</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}