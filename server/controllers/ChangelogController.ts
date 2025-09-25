import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'
import { createChangelog, isAdminUser, listChangelog } from '../services/changelogService'

function extractUserId(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  const token = auth.replace('Bearer ', '')
  try {
    const payload: any = jwt.verify(token, authConfig.jwtSecret as string)
    return Number(payload?.userId || payload?.id) || null
  } catch {
    return null
  }
}

export async function list(req: Request, res: Response) {
  try {
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)))
    const items = await listChangelog(limit)
    res.json({ changelog: items })
  } catch (e) {
    console.error('Erro ao listar changelog:', e)
    res.status(500).json({ message: 'Erro ao listar changelog' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const userId = extractUserId(req)
    if (!userId) return res.status(401).json({ message: 'Não autenticado' })
    const admin = await isAdminUser(userId)
    if (!admin) return res.status(403).json({ message: 'Apenas administradores podem criar entradas de changelog' })

    const { title, body, version } = req.body || {}
    if (!title || !body) return res.status(400).json({ message: 'Campos obrigatórios: title, body' })
    const created = await createChangelog({ title, body, version, author_id: userId })
    res.status(201).json(created)
  } catch (e) {
    console.error('Erro ao criar changelog:', e)
    res.status(500).json({ message: 'Erro ao criar changelog' })
  }
}

export default { list, create }
