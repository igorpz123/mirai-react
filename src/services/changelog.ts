import api from './api'

export type ChangelogItem = {
  id: number
  title: string
  body: string
  version?: string | null
  created_at: string
  author_id?: number | null
  author_name?: string | null
}

export async function listChangelog(limit = 50) {
  const res = await api.get('/changelog', { params: { limit } })
  return (res.data?.changelog || []) as ChangelogItem[]
}

export async function createChangelog(payload: { title: string; body: string; version?: string | null }) {
  const res = await api.post('/changelog', payload)
  return res.data as ChangelogItem
}
