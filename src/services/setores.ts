const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Setor {
  id: number
  nome: string
  descricao?: string
  status?: string
}

export interface SetoresResponse {
  setores: Setor[]
  total: number
}

export async function getSetores(): Promise<SetoresResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Erro ao buscar setores')
  }

  return res.json()
}

export default { getSetores }
