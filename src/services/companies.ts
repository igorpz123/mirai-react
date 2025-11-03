export interface Company {
  id: number
  nome: string
  endereco?: string
  cidade?: string
  telefone?: string
  tecnico_responsavel?: number | null
  tecnico_nome?: string | null
  unidade_id?: number | null
  unidade_nome?: string | null
  [key: string]: any
}

export interface CompaniesResponse {
  companies: Company[]
  total?: number
  message?: string
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Busca empresas em que um técnico é responsável.
 *
 * Implementação:
 * 1) Tenta consultar um endpoint explícito `/empresas/...` (se existir).
 * 2) Se não existir, busca tarefas do responsável (`/tarefas/responsavel/:id`) e extrai
 *    as empresas únicas a partir das tarefas (campos retornados pelo backend: empresa, empresa_cidade, etc.).
 */
export async function getCompaniesByResponsible(userId: number, unitId?: number): Promise<CompaniesResponse> {
  const token = localStorage.getItem('token')

  // primeira tentativa: endpoints de empresas (pode não existir no servidor)
  const empresaUrl = unitId
    ? `${API_URL}/empresas/unidade/${unitId}/responsavel/${userId}`
    : `${API_URL}/empresas/responsavel/${userId}`

  try {
    const res = await fetch(empresaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) return { companies: data as Company[], total: data.length }
      return data as CompaniesResponse
    }
  } catch (err) {
    // ignora e usa fallback
    console.debug('empresas endpoint não disponível, usando fallback por tarefas', err)
  }

  // fallback: buscar tarefas do responsável e extrair empresas únicas
  const tarefasUrl = `${API_URL}/tarefas/responsavel/${userId}`
  const tRes = await fetch(tarefasUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!tRes.ok) {
    const err = await tRes.json().catch(() => ({ message: 'Erro ao buscar tarefas para extrair empresas' }))
    throw new Error(err.message || 'Erro ao buscar empresas (fallback)')
  }

  const tData = await tRes.json()
  // tData can be { tasks: [...] } or an array; normalize
  const tasksArray = Array.isArray(tData) ? tData : (tData.tasks || tData)

  const unique: Record<string, Company> = {}
  for (const t of tasksArray as any[]) {
    // many task rows include fields like empresa, empresa_cidade, empresa_endereco, empresa_telefone
    const empresaId = t.empresa_id ?? t.empresaId ?? t.empresa_id_fk ?? t.empresa?.id
    const nome = t.empresa_nome || t.empresa || (t.empresa && t.empresa.nome) || ''
    const cidade = t.empresa_cidade || t.cidade || (t.empresa && t.empresa.cidade) || ''
    const endereco = t.empresa_endereco || t.endereco || (t.empresa && t.empresa.endereco) || ''
    const telefone = t.empresa_telefone || t.telefone || (t.empresa && t.empresa.telefone) || ''

    const key = String(empresaId || nome)
    if (!unique[key]) {
      unique[key] = {
        id: empresaId || Math.floor(Math.random() * 1000000),
        nome: nome || 'Empresa sem nome',
        cidade: cidade || undefined,
        endereco: endereco || undefined,
        telefone: telefone || undefined,
      }
    }
  }

  const companies = Object.values(unique)
  return { companies, total: companies.length }
}

export async function getCompaniesByUnit(unitId: number): Promise<CompaniesResponse> {
  const token = localStorage.getItem('token')
  const url = `${API_URL}/empresas/unidade/${unitId}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erro ao buscar empresas por unidade' }))
      throw new Error(err.message || 'Erro ao buscar empresas por unidade')
    }

    const data = await res.json()
    if (Array.isArray(data)) return { companies: data as Company[], total: data.length }
    return data as CompaniesResponse
  } catch (err) {
    // Re-throw to let caller fallback if desired
    throw err
  }
}

export async function getAllCompanies(): Promise<CompaniesResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/empresas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao buscar empresas' }))
    throw new Error(err.message || 'Erro ao buscar empresas')
  }
  return res.json()
}

export async function generateAutoTasksForUnit(
  unitId: number, 
  futureYears: number = 0
): Promise<{ 
  processed: number
  createdTotal: number
  details: Array<{ empresaId: number; created: number }>
  yearsProcessed: number
}> {
  const token = localStorage.getItem('token')
  
  // Construir URL com query string se necessário
  let url = `${API_URL}/empresas/unidade/${unitId}/auto-tarefas`
  if (futureYears > 0) {
    url += `?futureYears=${futureYears}`
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao gerar tarefas automáticas por unidade' }))
    throw new Error(err.message || 'Erro ao gerar tarefas automáticas por unidade')
  }
  return res.json()
}

export async function getCompanyById(id: number): Promise<Company> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/empresas/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao buscar empresa' }))
    throw new Error(err.message || 'Erro ao buscar empresa')
  }
  return res.json()
}

export async function getCompanyByCNPJ(cnpj: string): Promise<Company | null> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/empresas/cnpj/${cnpj}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao consultar CNPJ' }))
    throw new Error(err.message || 'Erro ao consultar CNPJ')
  }
  return res.json()
}

export async function createCompany(payload: { cnpj: string; razao_social: string; nome_fantasia: string; cidade?: string; telefone?: string; periodicidade?: number | null; data_renovacao?: string | null; tecnico_responsavel?: number | null; unidade_responsavel?: number | null }): Promise<Company> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/empresas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao criar empresa' }))
    throw new Error(err.message || 'Erro ao criar empresa')
  }
  return res.json()
}

export async function updateCompany(id: number, payload: Partial<{ nome_fantasia: string; razao_social: string; cnpj: string; cidade: string; telefone: string; tecnico_responsavel: number | null; unidade_responsavel: number | null; periodicidade: number | null; data_renovacao: string | null }>): Promise<Company> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/empresas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao atualizar empresa' }))
    throw new Error(err.message || 'Erro ao atualizar empresa')
  }
  return res.json()
}

export type CompanyProposalsResponse = { proposals: Array<{ id: number; titulo?: string; status: string; valor_total?: number; criadoEm?: string; dataAlteracao?: string; responsavel?: string }> }
export async function getProposalsByCompany(id: number): Promise<CompanyProposalsResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/propostas/empresa/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro ao buscar propostas da empresa' }))
    throw new Error(err.message || 'Erro ao buscar propostas da empresa')
  }
  return res.json()
}
