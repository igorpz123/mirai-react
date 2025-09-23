const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Cargo { id: number; nome: string }
export interface CargosResponse { cargos: Cargo[]; total: number }

export async function getCargos(): Promise<CargosResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/cargos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erro ao buscar cargos')
  }
  return res.json()
}

export default { getCargos }
