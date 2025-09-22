import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { getUserById, type User } from '@/services/users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { getSetores, type Setor } from '@/services/setores'
import { getUnidades, type Unidade } from '@/services/unidades'
import { updateUser as updateUserSvc, addUserSetores as addUserSetoresSvc, addUserUnidades as addUserUnidadesSvc, removeUserSetor as removeUserSetorSvc, removeUserUnidade as removeUserUnidadeSvc, getUserById as fetchUserById } from '@/services/users'
import { toastError, toastSuccess } from '@/lib/customToast'
import { IconLoader2 } from '@tabler/icons-react'

export default function AdminUsersDetails() {
	const { id } = useParams()
	const uid = id ? Number(id) : NaN
	const navigate = useNavigate()

	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [edit, setEdit] = useState({ nome: '', sobrenome: '', email: '', cargo_id: '' as any, foto_url: '' })
	const [saving, setSaving] = useState(false)
	const [setores, setSetores] = useState<Setor[]>([])
	const [unidades, setUnidades] = useState<Unidade[]>([])
	const [newSetorId, setNewSetorId] = useState<string>('')
	const [newUnidadeId, setNewUnidadeId] = useState<string>('')
	const [addingSetor, setAddingSetor] = useState(false)
	const [addingUnidade, setAddingUnidade] = useState(false)
	const [removingSetorNames, setRemovingSetorNames] = useState<Set<string>>(new Set())
	const [removingUnidadeNames, setRemovingUnidadeNames] = useState<Set<string>>(new Set())

	useEffect(() => {
		let mounted = true
		async function fetchUser() {
			setLoading(true)
			setError(null)
			try {
				if (!uid || Number.isNaN(uid)) throw new Error('ID inválido')
				const res = await getUserById(uid)
				const u = (res && (res as any).user) ? (res as any).user : (res as any)
				if (!mounted) return
				setUser(u as User)
				setEdit({
					nome: (u as any).nome || '',
					sobrenome: (u as any).sobrenome || '',
					email: (u as any).email || '',
					cargo_id: String((u as any).cargo_id ?? ''),
					foto_url: (u as any).foto_url || ''
				})
			} catch (err) {
				if (!mounted) return
				setError(err instanceof Error ? err.message : 'Erro ao carregar usuário')
			} finally {
				if (!mounted) return
				setLoading(false)
			}
		}
		fetchUser()
		return () => { mounted = false }
	}, [uid])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const [s, u] = await Promise.all([
					getSetores().catch(() => ({ setores: [], total: 0 })),
					getUnidades().catch(() => ({ unidades: [], total: 0 }))
				])
				if (!mounted) return
				setSetores(s.setores)
				setUnidades(u.unidades)
			} catch {}
		})()
		return () => { mounted = false }
	}, [])

	// Assigned ids from user CSV fields
	const assignedUnidadeIds = useMemo(() => {
		const csv = (user as any)?.unidades
		if (!csv) return new Set<number>()
		const ids = String(csv)
			.split(',')
			.map(v => Number(v.trim()))
			.filter(n => !isNaN(n))
		return new Set<number>(ids)
	}, [user])

	const assignedSetorIds = useMemo(() => {
		const csv = (user as any)?.setores
		if (!csv) return new Set<number>()
		const ids = String(csv)
			.split(',')
			.map(v => Number(v.trim()))
			.filter(n => !isNaN(n))
		return new Set<number>(ids)
	}, [user])

	const availableUnidades = useMemo(() => {
		return unidades.filter(u => !assignedUnidadeIds.has(u.id))
	}, [unidades, assignedUnidadeIds])

	const availableSetores = useMemo(() => {
		return setores.filter(s => !assignedSetorIds.has(s.id))
	}, [setores, assignedSetorIds])

	// Ensure selected value is valid considering filtered options
	useEffect(() => {
		if (newUnidadeId && !availableUnidades.some(u => String(u.id) === newUnidadeId)) {
			setNewUnidadeId('')
		}
	}, [availableUnidades])

	useEffect(() => {
		if (newSetorId && !availableSetores.some(s => String(s.id) === newSetorId)) {
			setNewSetorId('')
		}
	}, [availableSetores])

	async function saveBasic() {
		try {
			setSaving(true)
			await updateUserSvc(uid, {
				nome: edit.nome,
				email: edit.email,
				...(edit.sobrenome ? { sobrenome: edit.sobrenome } : {}),
				...(edit.cargo_id ? { cargoId: Number(edit.cargo_id) as any } : {}),
			}) as any
			// Atualiza UI local
			setUser(prev => prev ? ({ ...prev, nome: edit.nome, sobrenome: edit.sobrenome, email: edit.email, cargo_id: Number(edit.cargo_id) as any } as any) : prev)
			toastSuccess('Informações atualizadas')
		} finally {
			setSaving(false)
		}
	}

	async function addSetor() {
		if (!newSetorId) return
		try {
			setAddingSetor(true)
			await addUserSetoresSvc(uid, [Number(newSetorId)])
			const res = await fetchUserById(uid)
			const u = (res as any).user || (res as any)
			setUser(u as User)
			setNewSetorId('')
			toastSuccess('Setor adicionado')
		} catch (e: any) {
			toastError(e?.message || 'Erro ao adicionar setor')
		} finally {
			setAddingSetor(false)
		}
	}

	async function addUnidade() {
		if (!newUnidadeId) return
		try {
			setAddingUnidade(true)
			await addUserUnidadesSvc(uid, [Number(newUnidadeId)])
			const res = await fetchUserById(uid)
			const u = (res as any).user || (res as any)
			setUser(u as User)
			setNewUnidadeId('')
			toastSuccess('Unidade adicionada')
		} catch (e: any) {
			toastError(e?.message || 'Erro ao adicionar unidade')
		} finally {
			setAddingUnidade(false)
		}
	}

	async function removeSetor(setorNome: string) {
		const nome = String(setorNome).trim()
		const found = setores.find(s => s.nome === nome)
		if (!found) return
		try {
			setRemovingSetorNames(prev => new Set(prev).add(nome))
			await removeUserSetorSvc(uid, found.id)
			const res = await fetchUserById(uid)
			const u = (res as any).user || (res as any)
			setUser(u as User)
			toastSuccess('Setor removido')
		} catch (e: any) {
			toastError(e?.message || 'Erro ao remover setor')
		} finally {
			setRemovingSetorNames(prev => {
				const next = new Set(prev)
				next.delete(nome)
				return next
			})
		}
	}

	async function removeUnidade(unidadeNome: string) {
		const nome = String(unidadeNome).trim()
		const found = unidades.find(s => s.nome === nome)
		if (!found) return
		try {
			setRemovingUnidadeNames(prev => new Set(prev).add(nome))
			await removeUserUnidadeSvc(uid, found.id)
			const res = await fetchUserById(uid)
			const u = (res as any).user || (res as any)
			setUser(u as User)
			toastSuccess('Unidade removida')
		} catch (e: any) {
			toastError(e?.message || 'Erro ao remover unidade')
		} finally {
			setRemovingUnidadeNames(prev => {
				const next = new Set(prev)
				next.delete(nome)
				return next
			})
		}
	}

	return (
		<div className="w-full">
			<SiteHeader title={user?.nome ? `Usuário | ${user.nome}` : 'Usuário'} />

			<div className="flex flex-col gap-4 py-4 md:py-6 px-4 lg:px-6">
				<div>
					<Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
				</div>

				{loading ? (
					<div>Carregando...</div>
				) : error ? (
					<div className="text-destructive">{error}</div>
				) : user ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex items-center gap-4">
							<Avatar className="size-16">
								<AvatarImage src={(user as any).foto_url || (user as any).fotoUrl || undefined} alt={`${user.nome} ${user.sobrenome || ''}`} />
								<AvatarFallback className="text-lg">{(user.nome || 'U').charAt(0)}</AvatarFallback>
							</Avatar>
							<div>
								<div className="text-xl font-semibold">{user.nome} {user.sobrenome}</div>
								<div className="text-sm opacity-80">{user.email}</div>
							</div>
						</div>
						<div className="space-y-3">
							<div>
								<div className="text-sm opacity-70">Nome</div>
								<div className="flex gap-2">
									<Input value={edit.nome} onChange={(e) => setEdit(v => ({ ...v, nome: e.target.value }))} placeholder="Nome" className="max-w-xs" />
									<Input value={edit.sobrenome} onChange={(e) => setEdit(v => ({ ...v, sobrenome: e.target.value }))} placeholder="Sobrenome" className="max-w-xs" />
								</div>
							</div>
							<div>
								<div className="text-sm opacity-70">Email</div>
								<Input type="email" value={edit.email} onChange={(e) => setEdit(v => ({ ...v, email: e.target.value }))} placeholder="email@exemplo.com" className="max-w-md" />
							</div>
							<div>
								<div className="text-sm opacity-70">Cargo</div>
								<div className="flex items-center gap-2">
									<Select value={edit.cargo_id} onValueChange={(v) => setEdit(s => ({ ...s, cargo_id: v }))}>
										<SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="1">Administrador</SelectItem>
											<SelectItem value="2">Gestor</SelectItem>
											<SelectItem value="3">Coordenador</SelectItem>
											<SelectItem value="13">Comercial</SelectItem>
											<SelectItem value="99">Técnico</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div>
								<Button disabled={saving} onClick={saveBasic} className="button-primary flex items-center gap-2">
									{saving && <IconLoader2 className="size-4 animate-spin" />}
									<span>Salvar alterações</span>
								</Button>
							</div>
						</div>
						<div className="space-y-3">
							<div>
								<div className="text-sm opacity-70">Unidades</div>
								<div className="text-base break-words mb-2">
									{((user as any).unidade_nomes || '').split(',').filter(Boolean).map((n: string) => n.trim()).filter(Boolean).length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{((user as any).unidade_nomes || '').split(',').map((n: string) => n.trim()).filter(Boolean).map((n: string) => (
												<span key={n} className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs border">
													{n}
													<button disabled={removingUnidadeNames.has(n)} className="text-destructive disabled:opacity-50" onClick={() => removeUnidade(n)} aria-label={`Remover ${n}`}>
														{removingUnidadeNames.has(n) ? <IconLoader2 className="size-3 animate-spin" /> : '×'}
													</button>
												</span>
											))}
										</div>
									) : (
										(user as any).unidade_nomes || user.unidade || '-'
									)}
								</div>
								<div className="flex items-center gap-2">
									<Select value={newUnidadeId} onValueChange={setNewUnidadeId}>
										<SelectTrigger className="w-[260px]"><SelectValue placeholder="Adicionar unidade" /></SelectTrigger>
										<SelectContent>
											{availableUnidades.map(u => (
												<SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button onClick={addUnidade} disabled={!newUnidadeId || addingUnidade} className="button-primary flex items-center gap-2">
										{addingUnidade && <IconLoader2 className="size-4 animate-spin" />}
										<span>Adicionar</span>
									</Button>
								</div>
							</div>
							<div>
								<div className="text-sm opacity-70">Setores</div>
								<div className="text-base break-words mb-2">
									{((user as any).setor_nomes || '').split(',').filter(Boolean).map((n: string) => n.trim()).filter(Boolean).length > 0 ? (
										<div className="flex flex-wrap gap-2">
											{((user as any).setor_nomes || '').split(',').map((n: string) => n.trim()).filter(Boolean).map((n: string) => (
												<span key={n} className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs border">
													{n}
													<button disabled={removingSetorNames.has(n)} className="text-destructive disabled:opacity-50" onClick={() => removeSetor(n)} aria-label={`Remover ${n}`}>
														{removingSetorNames.has(n) ? <IconLoader2 className="size-3 animate-spin" /> : '×'}
													</button>
												</span>
											))}
										</div>
									) : (
										(user as any).setor_nomes || user.setor || '-'
									)}
								</div>
								<div className="flex items-center gap-2">
									<Select value={newSetorId} onValueChange={setNewSetorId}>
										<SelectTrigger className="w-[260px]"><SelectValue placeholder="Adicionar setor" /></SelectTrigger>
										<SelectContent>
											{availableSetores.map(s => (
												<SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button onClick={addSetor} disabled={!newSetorId || addingSetor} className="button-primary flex items-center gap-2">
										{addingSetor && <IconLoader2 className="size-4 animate-spin" />}
										<span>Adicionar</span>
									</Button>
								</div>
							</div>
							<div>
								<div className="text-sm opacity-70">Status</div>
								<div className="text-base">
									{(user as any).status ? (
										<Badge className={(user as any).status === 'ativo' ? 'button-success' : 'button-remove'}>{(user as any).status}</Badge>
									) : (
										<Badge className="button-success">Ativo</Badge>
									)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div>Nenhum usuário encontrado.</div>
				)}
			</div>
		</div>
	)
}

