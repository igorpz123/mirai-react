import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'
import { listNotifications, markNotificationRead, markAllRead } from '../services/notificationService'

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
    const userId = extractUserId(req)
    if (!userId) return res.status(401).json({ message: 'Não autenticado' })
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)))
    const items = await listNotifications(userId, limit)
    // Map new schema fields to legacy keys expected by frontend (message/entity/entity_id)
    const mapped = items.map(it => ({
      id: it.id,
      user_id: it.user_id,
      type: it.type,
      entity: it.entity_type,
      entity_id: it.entity_id,
      message: it.body, // legacy field name maintained
      metadata: it.metadata,
      created_at: it.created_at,
      read_at: it.read_at,
    }))
    res.json({ notifications: mapped })
  } catch (e) {
    console.error('Erro ao listar notificações:', e)
    res.status(500).json({ message: 'Erro ao listar notificações' })
  }
}

export async function markRead(req: Request<{ id: string }>, res: Response) {
  try {
    const userId = extractUserId(req)
    if (!userId) return res.status(401).json({ message: 'Não autenticado' })
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ message: 'ID inválido' })
    const ok = await markNotificationRead(userId, id)
    if (!ok) return res.status(404).json({ message: 'Notificação não encontrada' })
    res.json({ id, read: true })
  } catch (e) {
    console.error('Erro ao marcar notificação lida:', e)
    res.status(500).json({ message: 'Erro ao marcar notificação' })
  }
}

export async function markAll(req: Request, res: Response) {
  try {
    const userId = extractUserId(req)
    if (!userId) return res.status(401).json({ message: 'Não autenticado' })
    const affected = await markAllRead(userId)
    res.json({ updated: affected })
  } catch (e) {
    console.error('Erro ao marcar todas notificações:', e)
    res.status(500).json({ message: 'Erro ao marcar todas notificações' })
  }
}

export default { list, markRead, markAll }
