export interface Company {
  id: number
  nome: string
  endereco?: string
  cidade?: string
  telefone?: string
  tecnico_responsavel?: number | null
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
