import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { useUnit } from '@/contexts/UnitContext'
import { getUsersByUnitId } from '@/services/users'
import { useUsers } from '@/contexts/UsersContext'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getCompaniesByResponsible } from '@/services/companies'
import type { Company } from '@/services/companies'

export default function TechnicalMap() {
	const { user } = useAuth()
	const { unitId, isLoading: unitLoading } = useUnit()

	const [techs, setTechs] = useState<any[]>([])
	const [techsLoading, setTechsLoading] = useState(true)
	const [techsError, setTechsError] = useState<string | null>(null)
	const usersCtx = useUsers()

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
				try {
					await usersCtx.ensureUsersForUnit(Number(unitId))
					const { users: all } = usersCtx.getFilteredUsersForTask({ unidadeId: Number(unitId) })
					if (!mounted) return
					setTechs((all || []).filter((u: any) => Number(u.cargo_id) === 4))
				} catch (e) {
					// fallback to empty list
					setTechs([])
				}
			} catch (err) {
				if (!mounted) return
				setTechsError(err instanceof Error ? err.message : String(err))
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
		<div className="w-full">
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
						<div>Nenhum técnico encontrado.</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{techs.map(t => (
								<Link key={t.id} to={`/technical/mapa/${t.id}`} className="block p-4 border rounded hover:shadow">
									<div className="font-semibold">{t.nome}</div>
									<div className="text-sm text-muted-foreground">{t.email}</div>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	)
}

