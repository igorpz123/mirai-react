import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/site-header'
import { getUserById, type User } from '@/services/users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { getSetores, type Setor } from '@/services/setores'
import { getUnidades, type Unidade } from '@/services/unidades'
import { getCargos, type Cargo } from '@/services/cargos'
import { updateUser as updateUserSvc, addUserSetores as addUserSetoresSvc, addUserUnidades as addUserUnidadesSvc, removeUserSetor as removeUserSetorSvc, removeUserUnidade as removeUserUnidadeSvc, getUserById as fetchUserById } from '@/services/users'
import { toastError, toastSuccess } from '@/lib/customToast'
import { IconLoader2 } from '@tabler/icons-react'
import { TechnicalTaskTable } from '@/components/technical-task-table'
import { getRecentTasksByUser, type Task } from '@/services/tasks'
import { CommercialProposalsTable } from '@/components/commercial-proposals-table'
import { getRecentProposalsByUser, type Proposal } from '@/services/proposals'
import { useAuth } from '@/hooks/use-auth'
import { getNotasResumoByUser } from '@/services/notas'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { User as UserIcon, Mail, Building2, Users, FileText, ShoppingCart, Lock, CalendarDays, Save, X, Camera } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

export default function AdminUsersDetails() {
	const { id } = useParams()
	const uid = id ? Number(id) : NaN
	const navigate = useNavigate()
	const { user: logged } = useAuth()
	const isAdmin = logged ? (logged.cargoId === 1 || logged.cargoId === 2 || logged.cargoId === 3) : false
	const canEditAdminFields = isAdmin // only admins can edit cargo/unidades/setores
 
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [edit, setEdit] = useState({ nome: '', sobrenome: '', email: '', cargo_id: '' as any, foto_url: '' })
	const [saving, setSaving] = useState(false)
	const [setores, setSetores] = useState<Setor[]>([])
	const [unidades, setUnidades] = useState<Unidade[]>([])
	const [cargos, setCargos] = useState<Cargo[]>([])
	const [newSetorId, setNewSetorId] = useState<string>('')
	const [newUnidadeId, setNewUnidadeId] = useState<string>('')
	const [addingSetor, setAddingSetor] = useState(false)
	const [addingUnidade, setAddingUnidade] = useState(false)
	const [removingSetorNames, setRemovingSetorNames] = useState<Set<string>>(new Set())
	const [removingUnidadeNames, setRemovingUnidadeNames] = useState<Set<string>>(new Set())
	const [recentTasks, setRecentTasks] = useState<Task[] | null>(null)
	const [recentProposals, setRecentProposals] = useState<Proposal[] | null>(null)
	const [loadingRecent, setLoadingRecent] = useState(false)
	const [avgNota, setAvgNota] = useState<number | null>(null)
	const [notaCount, setNotaCount] = useState<number>(0)
	const [loadingNotas, setLoadingNotas] = useState(false)
	const [filtroInicio, setFiltroInicio] = useState<string>('')
	const [filtroFim, setFiltroFim] = useState<string>('')
	
	// Estados para alteração de senha
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [changingPassword, setChangingPassword] = useState(false)
	
	// Estados para alteração de foto
	const [uploadingPhoto, setUploadingPhoto] = useState(false)
	const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)

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

	// Load recent tasks and proposals for this user
	useEffect(() => {
		let mounted = true
			; (async () => {
				if (!uid || Number.isNaN(uid)) return
				setLoadingRecent(true)
				try {
					const [tasksRes, propsRes] = await Promise.all([
						getRecentTasksByUser(uid, 15).catch(() => ({ tasks: [], total: 0 })),
						getRecentProposalsByUser(uid, 10).catch(() => ({ proposals: [] }))
					])
					if (!mounted) return
					setRecentTasks(tasksRes.tasks || [])
					setRecentProposals(propsRes.proposals || [])
				} finally {
					if (mounted) setLoadingRecent(false)
				}
			})()
		return () => { mounted = false }
	}, [uid])

	// Carrega resumo de notas do usuário (count + average)
	useEffect(() => {
		let mounted = true
			; (async () => {
				if (!uid || Number.isNaN(uid)) return
				setLoadingNotas(true)
				try {
					const res = await getNotasResumoByUser(uid, {
						inicio: filtroInicio || undefined,
						fim: filtroFim || undefined,
					}).catch(() => ({ count: 0, average: null }))
					if (!mounted) return
					setAvgNota(res.average)
					setNotaCount(res.count)
				} finally {
					if (mounted) setLoadingNotas(false)
				}
			})()
		return () => { mounted = false }
	}, [uid, filtroInicio, filtroFim])

	useEffect(() => {
		let mounted = true
			; (async () => {
				try {
					const [s, u, c] = await Promise.all([
						getSetores().catch(() => ({ setores: [], total: 0 })),
						getUnidades().catch(() => ({ unidades: [], total: 0 })),
						getCargos().catch(() => ({ cargos: [], total: 0 }))
					])
					if (!mounted) return
					setSetores(s.setores)
					setUnidades(u.unidades)
					setCargos(c.cargos)
				} catch { }
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
			// if not admin (self), do not send cargo change
			const payload: any = {
				nome: edit.nome,
				email: edit.email,
				...(edit.sobrenome ? { sobrenome: edit.sobrenome } : {}),
			}
			if (canEditAdminFields && edit.cargo_id) {
				payload.cargoId = Number(edit.cargo_id)
			}
			await updateUserSvc(uid, payload) as any
			// Atualiza UI local
			setUser(prev => prev ? ({
				...prev,
				nome: edit.nome,
				sobrenome: edit.sobrenome,
				email: edit.email,
				...(canEditAdminFields ? { cargo_id: Number(edit.cargo_id) as any } : {})
			} as any) : prev)
			toastSuccess('Informações atualizadas')
		} finally {
			setSaving(false)
		}
	}

	async function addSetor() {
		if (!canEditAdminFields) return
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
		if (!canEditAdminFields) return
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
		if (!canEditAdminFields) return
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
		if (!canEditAdminFields) return
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

	async function changePassword() {
		if (!newPassword || !confirmPassword) {
			toastError('Preencha ambos os campos de senha')
			return
		}
		if (newPassword !== confirmPassword) {
			toastError('As senhas não coincidem')
			return
		}
		if (newPassword.length < 6) {
			toastError('A senha deve ter no mínimo 6 caracteres')
			return
		}
		try {
			setChangingPassword(true)
			await updateUserSvc(uid, { senha: newPassword } as any)
			toastSuccess('Senha alterada com sucesso')
			setNewPassword('')
			setConfirmPassword('')
		} catch (e: any) {
			toastError(e?.message || 'Erro ao alterar senha')
		} finally {
			setChangingPassword(false)
		}
	}

  async function updatePhoto() {
    if (!selectedPhotoFile) {
      toastError('Por favor, selecione uma foto')
      return
    }
    
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedPhotoFile)
      
      const res = await fetch(`/api/usuarios/${uid}/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Erro ao atualizar foto' }))
        throw new Error(error.message || 'Erro ao atualizar foto')
      }

      const data = await res.json()
      const updatedFotoUrl = data.foto_url
      
      toastSuccess('Foto atualizada com sucesso')
      
      // Atualiza a foto do usuário em todos os lugares
      setUser(prev => prev ? { ...prev, fotoUrl: updatedFotoUrl, foto_url: updatedFotoUrl } : prev)
      setEdit(prev => ({ ...prev, foto_url: updatedFotoUrl }))
      setSelectedPhotoFile(null)
      
    } catch (error: any) {
      toastError(error?.message || 'Erro ao atualizar foto')
    } finally {
      setUploadingPhoto(false)
    }
  }	return (
		<div className="container-main">
			<SiteHeader title={user?.nome ? `Usuário | ${user.nome}` : 'Usuário'} />

			<div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
				<div>
					<Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
						<X className="h-4 w-4" />
						Voltar
					</Button>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="flex flex-col items-center gap-3">
							<IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							<p className="text-sm text-muted-foreground">Carregando informações do usuário...</p>
						</div>
					</div>
				) : error ? (
					<Card className="border-destructive">
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-destructive">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
								<span className="font-medium">{error}</span>
							</div>
						</CardContent>
					</Card>
				) : user ? (
					<>
						{/* User Profile Card */}
						<Card className="border-2 shadow-sm">
							<CardHeader className="pb-3">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									<div className="flex items-center gap-4">
										<Avatar className="h-20 w-20 border-2 border-primary/10">
											<AvatarImage src={(user as any).foto_url || (user as any).fotoUrl || undefined} alt={`${user.nome} ${user.sobrenome || ''}`} />
											<AvatarFallback className="text-2xl font-semibold bg-primary/10">
												{(user.nome || 'U').charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<div className="flex items-center gap-2 mb-1">
												<CardTitle className="text-2xl">{user.nome} {user.sobrenome}</CardTitle>
												{(user as any).status ? (
													<Badge variant={(user as any).status === 'ativo' ? 'default' : 'destructive'}>
														{(user as any).status}
													</Badge>
												) : (
													<Badge variant="default">Ativo</Badge>
												)}
											</div>
											<CardDescription className="flex items-center gap-2">
												<Mail className="h-4 w-4" />
												{user.email}
											</CardDescription>
											{loadingNotas ? (
												<div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
													<IconLoader2 className="size-3 animate-spin" />
													<span>Carregando avaliações...</span>
												</div>
											) : (
												<div className="flex items-center gap-2 mt-2">
													<div className="flex items-center gap-1">
														{Array.from({ length: 5 }).map((_, i) => {
															const avg5 = (avgNota ?? 0) / 2
															const filled = i < Math.floor(avg5)
															return filled ? (
																<IconStarFilled key={i} className="size-4 text-yellow-500" />
															) : (
																<IconStar key={i} className="size-4 text-yellow-500 opacity-40" />
															)
														})}
													</div>
													<span className="text-xs font-semibold">{avgNota != null ? avgNota.toFixed(2) : '-'}</span>
													<span className="text-xs text-muted-foreground">({notaCount} avaliações)</span>
												</div>
											)}
										</div>
									</div>
									
									{/* Date Range Filters for Ratings */}
									<div className="flex items-center gap-2">
										<CalendarDays className="h-4 w-4 text-muted-foreground" />
										<Input 
											type="date" 
											value={filtroInicio} 
											onChange={(e) => setFiltroInicio(e.target.value)} 
											className="h-8 w-[140px]" 
											placeholder="Início"
										/>
										<span className="text-xs text-muted-foreground">até</span>
										<Input 
											type="date" 
											value={filtroFim} 
											onChange={(e) => setFiltroFim(e.target.value)} 
											className="h-8 w-[140px]"
											placeholder="Fim"
										/>
									</div>
								</div>
							</CardHeader>
						</Card>

						<Separator />

						{/* Tabs Section */}
						<Tabs defaultValue="info" className="w-full">
							<TabsList className="grid w-full grid-cols-4 max-w-[600px]">
								<TabsTrigger value="info" className="gap-2">
									<UserIcon className="h-4 w-4" />
									<span className="hidden sm:inline">Informações</span>
									<span className="sm:hidden">Info</span>
								</TabsTrigger>
								<TabsTrigger value="access" className="gap-2">
									<Lock className="h-4 w-4" />
									<span className="hidden sm:inline">Acesso</span>
									<span className="sm:hidden">Senha</span>
								</TabsTrigger>
								<TabsTrigger value="tasks" className="gap-2">
									<FileText className="h-4 w-4" />
									<span className="hidden sm:inline">Tarefas</span>
									<Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
										{recentTasks?.length || 0}
									</Badge>
								</TabsTrigger>
								<TabsTrigger value="proposals" className="gap-2">
									<ShoppingCart className="h-4 w-4" />
									<span className="hidden sm:inline">Propostas</span>
									<Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-flex">
										{recentProposals?.length || 0}
									</Badge>
								</TabsTrigger>
							</TabsList>

							{/* Tab: Informações */}
							<TabsContent value="info" className="mt-4">
								<Card className="shadow-md border-2">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<UserIcon className="h-5 w-5 text-primary" />
											Informações Pessoais
										</CardTitle>
										<CardDescription>Edite as informações básicas do usuário</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										{/* Profile Photo Section */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<Camera className="h-5 w-5 text-primary" />
												<h3 className="text-sm font-semibold">Foto de Perfil</h3>
											</div>
											<div className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg bg-muted/30">
												<ImageUpload
													variant="avatar"
													value={selectedPhotoFile || (user as any).foto_url || (user as any).fotoUrl}
													onChange={(file) => setSelectedPhotoFile(file)}
													disabled={uploadingPhoto}
													maxSize={5}
												/>
												<div className="flex-1 space-y-3">
													<p className="text-sm text-muted-foreground">
														Selecione uma nova foto de perfil clicando ou arrastando a imagem. Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
													</p>
													{selectedPhotoFile && (
														<Button 
															onClick={updatePhoto}
															disabled={uploadingPhoto}
															size="sm"
															className="button-primary gap-2"
														>
															{uploadingPhoto ? (
																<>
																	<IconLoader2 className="h-4 w-4 animate-spin" />
																	Enviando...
																</>
															) : (
																<>
																	<Camera className="h-4 w-4" />
																	Salvar nova foto
																</>
															)}
														</Button>
													)}
												</div>
											</div>
										</div>

										<Separator />

										{/* Basic Info */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<label className="text-sm font-medium">Nome</label>
												<Input 
													value={edit.nome} 
													onChange={(e) => setEdit(v => ({ ...v, nome: e.target.value }))} 
													placeholder="Nome"
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Sobrenome</label>
												<Input 
													value={edit.sobrenome} 
													onChange={(e) => setEdit(v => ({ ...v, sobrenome: e.target.value }))} 
													placeholder="Sobrenome"
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Email</label>
												<Input 
													type="email" 
													value={edit.email} 
													onChange={(e) => setEdit(v => ({ ...v, email: e.target.value }))} 
													placeholder="email@exemplo.com"
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Cargo</label>
												<Select 
													value={edit.cargo_id} 
													onValueChange={(v) => setEdit(s => ({ ...s, cargo_id: v }))} 
													disabled={!canEditAdminFields}
												>
													<SelectTrigger disabled={!canEditAdminFields}>
														<SelectValue placeholder="Selecione o cargo" />
													</SelectTrigger>
													<SelectContent>
														{cargos.map(c => (
															<SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										<Separator />

										{/* Unidades */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<Building2 className="h-5 w-5 text-primary" />
												<h3 className="text-sm font-semibold">Unidades</h3>
											</div>
											<div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/30">
												{((user as any).unidade_nomes || '').split(',').filter(Boolean).map((n: string) => n.trim()).filter(Boolean).length > 0 ? (
													((user as any).unidade_nomes || '').split(',').map((n: string) => n.trim()).filter(Boolean).map((n: string) => (
														<Badge key={n} variant="secondary" className="gap-2">
															{n}
															<button 
																disabled={removingUnidadeNames.has(n)} 
																className="text-destructive disabled:opacity-50 hover:bg-destructive/20 rounded-full p-0.5" 
																onClick={() => removeUnidade(n)} 
																aria-label={`Remover ${n}`}
															>
																{removingUnidadeNames.has(n) ? <IconLoader2 className="size-3 animate-spin" /> : <X className="h-3 w-3" />}
															</button>
														</Badge>
													))
												) : (
													<span className="text-sm text-muted-foreground">Nenhuma unidade atribuída</span>
												)}
											</div>
											<div className="flex items-center gap-2">
												<Select value={newUnidadeId} onValueChange={setNewUnidadeId} disabled={!canEditAdminFields}>
													<SelectTrigger className="flex-1" disabled={!canEditAdminFields}>
														<SelectValue placeholder="Selecione uma unidade" />
													</SelectTrigger>
													<SelectContent>
														{availableUnidades.map(u => (
															<SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Button 
													onClick={addUnidade} 
													disabled={!canEditAdminFields || !newUnidadeId || addingUnidade} 
													size="sm"
													className="gap-2"
												>
													{addingUnidade && <IconLoader2 className="size-4 animate-spin" />}
													Adicionar
												</Button>
											</div>
										</div>

										<Separator />

										{/* Setores */}
										<div className="space-y-3">
											<div className="flex items-center gap-2">
												<Users className="h-5 w-5 text-primary" />
												<h3 className="text-sm font-semibold">Setores</h3>
											</div>
											<div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/30">
												{((user as any).setor_nomes || '').split(',').filter(Boolean).map((n: string) => n.trim()).filter(Boolean).length > 0 ? (
													((user as any).setor_nomes || '').split(',').map((n: string) => n.trim()).filter(Boolean).map((n: string) => (
														<Badge key={n} variant="secondary" className="gap-2">
															{n}
															<button 
																disabled={removingSetorNames.has(n)} 
																className="text-destructive disabled:opacity-50 hover:bg-destructive/20 rounded-full p-0.5" 
																onClick={() => removeSetor(n)} 
																aria-label={`Remover ${n}`}
															>
																{removingSetorNames.has(n) ? <IconLoader2 className="size-3 animate-spin" /> : <X className="h-3 w-3" />}
															</button>
														</Badge>
													))
												) : (
													<span className="text-sm text-muted-foreground">Nenhum setor atribuído</span>
												)}
											</div>
											<div className="flex items-center gap-2">
												<Select value={newSetorId} onValueChange={setNewSetorId} disabled={!canEditAdminFields}>
													<SelectTrigger className="flex-1" disabled={!canEditAdminFields}>
														<SelectValue placeholder="Selecione um setor" />
													</SelectTrigger>
													<SelectContent>
														{availableSetores.map(s => (
															<SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Button 
													onClick={addSetor} 
													disabled={!canEditAdminFields || !newSetorId || addingSetor} 
													size="sm"
													className="gap-2"
												>
													{addingSetor && <IconLoader2 className="size-4 animate-spin" />}
													Adicionar
												</Button>
											</div>
										</div>

										<Separator />

										<div className="flex justify-end">
											<Button 
												disabled={saving} 
												onClick={saveBasic} 
												className="gap-2"
												size="lg"
											>
												{saving && <IconLoader2 className="size-4 animate-spin" />}
												<Save className="h-4 w-4" />
												Salvar Alterações
											</Button>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* Tab: Acesso/Senha */}
							<TabsContent value="access" className="mt-4">
								<Card className="shadow-md border-2">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Lock className="h-5 w-5 text-primary" />
											Alterar Senha
										</CardTitle>
										<CardDescription>Defina uma nova senha para o usuário</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<label className="text-sm font-medium">Nova Senha</label>
												<Input 
													type="password" 
													value={newPassword} 
													onChange={(e) => setNewPassword(e.target.value)} 
													placeholder="Mínimo 6 caracteres"
													minLength={6}
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-medium">Confirmar Senha</label>
												<Input 
													type="password" 
													value={confirmPassword} 
													onChange={(e) => setConfirmPassword(e.target.value)} 
													placeholder="Repita a senha"
													minLength={6}
												/>
											</div>
										</div>

										<div className="bg-muted/50 border border-dashed rounded-md p-4">
											<p className="text-sm text-muted-foreground">
												<strong className="text-foreground">Atenção:</strong> A senha deve ter no mínimo 6 caracteres. 
												Após a alteração, o usuário deverá usar a nova senha no próximo login.
											</p>
										</div>

										<div className="flex justify-end">
											<Button 
												disabled={changingPassword || !newPassword || !confirmPassword} 
												onClick={changePassword} 
												className="gap-2"
												size="lg"
											>
												{changingPassword && <IconLoader2 className="size-4 animate-spin" />}
												<Lock className="h-4 w-4" />
												Alterar Senha
											</Button>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* Tab: Tarefas */}
							<TabsContent value="tasks" className="mt-4">
								<Card className="shadow-md border-2">
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													<FileText className="h-5 w-5 text-primary" />
													Tarefas Recentes
												</CardTitle>
												<CardDescription>Últimas 15 tarefas atribuídas a este usuário</CardDescription>
											</div>
											<Badge variant="outline" className="text-sm font-semibold">
												{recentTasks?.length || 0} tarefas
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										{loadingRecent && !recentTasks ? (
											<div className="flex items-center justify-center py-8">
												<IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
											</div>
										) : (
											<TechnicalTaskTable tasks={(recentTasks ?? []) as Task[]} />
										)}
									</CardContent>
								</Card>
							</TabsContent>

							{/* Tab: Propostas */}
							<TabsContent value="proposals" className="mt-4">
								<Card className="shadow-md border-2">
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													<ShoppingCart className="h-5 w-5 text-primary" />
													Propostas Recentes
												</CardTitle>
												<CardDescription>Últimas 10 propostas comerciais deste usuário</CardDescription>
											</div>
											<Badge variant="outline" className="text-sm font-semibold">
												{recentProposals?.length || 0} propostas
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										{loadingRecent && !recentProposals ? (
											<div className="flex items-center justify-center py-8">
												<IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
											</div>
										) : (
											<CommercialProposalsTable proposals={(recentProposals ?? []) as Proposal[]} />
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</>
				) : (
					<Card>
						<CardContent className="pt-6">
							<p className="text-center text-muted-foreground">Nenhum usuário encontrado.</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}

