const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Unidade { id: number; nome: string }

export interface UnidadesResponse { unidades: Unidade[]; total: number }

export async function getUnidades(): Promise<UnidadesResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erro ao buscar unidades')
  }
  const data = await res.json()
  // Ajuste: esse endpoint específico pode não retornar todas as unidades.
  // Caso exista um endpoint dedicado (ex: /unidades), substitua aqui.
  if (Array.isArray(data)) return { unidades: data as any[], total: data.length }
  return data as UnidadesResponse
}

export default { getUnidades }
