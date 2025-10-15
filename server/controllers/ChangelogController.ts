import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'
import { createChangelog, isAdminUser, listChangelog } from '../services/changelogService'
import pool from '../config/db'
import { getIO } from '../realtime'

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

    // Broadcast notification to all users (persist + realtime)
    try {
      // Persist one notification per user efficiently
      const notifTitle = 'Atualização no sistema'
      const notifBody = `Changelog: ${title}`
      const metadata = JSON.stringify({ link: '/changelog', version: version || null, changelog_id: created.id })
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, body, entity_type, entity_id, metadata)
         SELECT u.id AS user_id, ? AS actor_id, 'changelog' AS type, ? AS title, ? AS body, 'changelog' AS entity_type, ? AS entity_id, ? AS metadata
         FROM usuarios u`,
        [userId, notifTitle, notifBody, created.id, metadata]
      )

      // Fetch the inserted notifications to emit per-user with ids
      const [rows] = await pool.query<any[]>(
        `SELECT id, user_id, type, title, body, entity_type, entity_id, metadata, created_at, read_at
         FROM notifications
         WHERE entity_type = 'changelog' AND entity_id = ?
         ORDER BY id DESC
         LIMIT 10000`,
        [created.id]
      )
      const io = getIO()
      for (const r of (rows || [])) {
        let meta: any = null
        try { meta = r.metadata ? JSON.parse(r.metadata) : null } catch {}
        const legacyPayload = {
          id: r.id,
          user_id: r.user_id,
          type: r.type,
          entity: r.entity_type,
          entity_id: r.entity_id,
          message: r.body,
          metadata: meta,
          created_at: r.created_at,
          read_at: r.read_at,
        }
        try { io.to(`user:${r.user_id}`).emit('notification:new', legacyPayload) } catch {}
      }
    } catch (e) {
      console.warn('Falha ao notificar changelog:', e)
    }

    res.status(201).json(created)
  } catch (e) {
    console.error('Erro ao criar changelog:', e)
    res.status(500).json({ message: 'Erro ao criar changelog' })
  }
}

export default { list, create }
