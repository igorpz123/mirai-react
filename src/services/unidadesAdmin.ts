const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Unidade { id: number; nome: string }
export interface UnidadesResponse { unidades: Unidade[]; total: number }

export async function listUnidades(): Promise<UnidadesResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao listar unidades')
  return res.json()
}

export async function getUnidade(id: number): Promise<Unidade> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades/${id}`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao buscar unidade')
  return res.json()
}

export async function createUnidade(data: { nome: string }): Promise<Unidade> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao criar unidade')
  return res.json()
}

export async function updateUnidade(id: number, data: { nome: string }): Promise<Unidade> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao atualizar unidade')
  return res.json()
}

export async function deleteUnidade(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/unidades/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao excluir unidade')
}

export default { listUnidades, getUnidade, createUnidade, updateUnidade, deleteUnidade }
