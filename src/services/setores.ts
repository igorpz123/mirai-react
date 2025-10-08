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

// Simple in-memory cache (per tab) to reduce flood of identical /setores requests
let setoresCache: { data: SetoresResponse | null; fetchedAt: number; promise?: Promise<SetoresResponse> } = { data: null, fetchedAt: 0 }
const SETORES_TTL_MS = 60_000 // 1 minuto

export async function getSetores(force?: boolean): Promise<SetoresResponse> {
  const now = Date.now()
  // Serve from cache if fresh and not forcing
  if (!force && setoresCache.data && (now - setoresCache.fetchedAt) < SETORES_TTL_MS) {
    return setoresCache.data
  }
  // If there's an in-flight request, reuse it
  if (!force && setoresCache.promise) {
    return setoresCache.promise
  }
  const token = localStorage.getItem('token')
  const p = fetch(`${API_URL}/setores`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then(async res => {
    if (!res.ok) {
      let message = 'Erro ao buscar setores'
      try {
        const err = await res.json()
        message = err.message || message
      } catch {}
      throw new Error(message)
    }
    const json = await res.json()
    setoresCache = { data: json, fetchedAt: Date.now() }
    return json
  }).finally(() => {
    // Clean promise after resolve/reject
    setoresCache.promise = undefined
  })

  setoresCache.promise = p
  return p
}

export default { getSetores }
