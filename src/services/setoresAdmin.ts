const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Setor { id: number; nome: string }
export interface SetoresResponse { setores: Setor[]; total: number }

export async function listSetores(): Promise<SetoresResponse> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao listar setores')
  return res.json()
}

export async function getSetor(id: number): Promise<Setor> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores/${id}`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao buscar setor')
  return res.json()
}

export async function createSetor(data: { nome: string }): Promise<Setor> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao criar setor')
  return res.json()
}

export async function updateSetor(id: number, data: { nome: string }): Promise<Setor> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao atualizar setor')
  return res.json()
}

export async function deleteSetor(id: number): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_URL}/setores/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error((await res.json()).message || 'Erro ao excluir setor')
}

export default { listSetores, getSetor, createSetor, updateSetor, deleteSetor }
