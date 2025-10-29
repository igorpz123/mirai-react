import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { useUnit } from '@/contexts/UnitContext'
import { useAuth } from '@/hooks/use-auth'
import { getCompaniesByResponsible } from '@/services/companies'
import type { Company } from '@/services/companies'
import { getVisibleAgendaUsers, type AgendaUser } from '@/services/agendaUsers'
import { TechUserCard } from '@/components/technical-user-card'

export default function TechnicalMap() {
	const { user } = useAuth()
	const { unitId, isLoading: unitLoading } = useUnit()

	const [techs, setTechs] = useState<AgendaUser[]>([])
	const [techsLoading, setTechsLoading] = useState(true)
	const [techsError, setTechsError] = useState<string | null>(null)

	const [companies, setCompanies] = useState<Company[]>([])
	const [companiesLoading, setCompaniesLoading] = useState(true)
	const [companiesError, setCompaniesError] = useState<string | null>(null)

	// reference variables to avoid "declared but not used" TS warnings in some builds
	void companies
	void companiesLoading
	void companiesError

	useEffect(() => {
		let mounted = true
		async function fetchTechs() {
			setTechsLoading(true)
			setTechsError(null)
			try {
				if (!unitId) {
					setTechs([])
					return
				}
				// Busca usuários visíveis na agenda para a unidade selecionada
				const users = await getVisibleAgendaUsers(Number(unitId))
				if (!mounted) return
				setTechs(users)
			} catch (err) {
				if (!mounted) return
				console.error('Erro ao buscar usuários da agenda:', err)
				setTechsError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
			} finally {
				if (!mounted) return
				setTechsLoading(false)
			}
		}

		if (!unitLoading) fetchTechs()
		return () => { mounted = false }
	}, [unitId, unitLoading])

	useEffect(() => {
		let mounted = true
		async function fetchCompanies() {
			setCompaniesLoading(true)
			setCompaniesError(null)
			try {
				if (!user) {
					setCompanies([])
					return
				}
				const res = await getCompaniesByResponsible(Number(user.id), unitId ? Number(unitId) : undefined)
				if (!mounted) return
				setCompanies(res.companies || [])
			} catch (err) {
				if (!mounted) return
				setCompaniesError(err instanceof Error ? err.message : String(err))
			} finally {
				if (!mounted) return
				setCompaniesLoading(false)
			}
		}

		fetchCompanies()
		return () => { mounted = false }
	}, [user, unitId])

	return (
		<div className="container-main">
			<SiteHeader title="Mapa de Empresas" />
			<div className="p-4 space-y-6">
				<section>
					<h2 className="text-lg font-semibold mb-3">Técnicos da unidade</h2>
					{unitLoading ? (
						<div>Carregando unidade selecionada...</div>
					) : techsLoading ? (
						<div>Carregando técnicos...</div>
					) : techsError ? (
						<div className="text-destructive">{techsError}</div>
					) : techs.length === 0 ? (
						<div className="text-muted-foreground">
							Nenhum usuário configurado para esta unidade. 
							<br />
							Configure os usuários visíveis na página de Gerenciar Agenda.
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
							{techs.map(t => (
								<TechUserCard key={t.id} user={t} to={`/technical/mapa/${t.id}`} />
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	)
}

