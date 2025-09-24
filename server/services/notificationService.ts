import pool from '../config/db'
import { OkPacket, RowDataPacket } from 'mysql2'

// New shape aligned with the 'notifications' table
export interface NotificationRecord {
  id: number
  user_id: number
  actor_id: number | null
  type: string
  title: string | null
  body: string
  entity_type: string | null
  entity_id: number | null
  metadata: any | null
  delivered_at: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface NewNotificationInput {
  user_id: number
  actor_id?: number | null
  type: string
  title?: string | null
  body: string
  entity_type?: string | null
  entity_id?: number | null
  metadata?: any | null
}

// No ensureTable here – assume migration already ran.

export async function createNotification(input: NewNotificationInput): Promise<NotificationRecord> {
  const {
    user_id,
    actor_id = null,
    type,
    title = null,
    body,
    entity_type = null,
    entity_id = null,
    metadata = null,
  } = input

  const [result] = await pool.query<OkPacket>(
    `INSERT INTO notifications (user_id, actor_id, type, title, body, entity_type, entity_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      actor_id,
      type,
      title,
      body,
      entity_type,
      entity_id,
      metadata ? JSON.stringify(metadata) : null,
    ]
  )
  const id = (result as any).insertId
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM notifications WHERE id = ? LIMIT 1`, [id])
  return mapRow((rows as any[])[0])
}

export async function listNotifications(userId: number, limit = 30): Promise<NotificationRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )
  return (rows as any[]).map(mapRow)
}

export async function listUnread(userId: number, limit = 50): Promise<NotificationRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  )
  return (rows as any[]).map(mapRow)
}

export async function markNotificationRead(userId: number, id: number): Promise<boolean> {
  const [result] = await pool.query<OkPacket>(
    `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL`,
    [id, userId]
  )
  return (result as any).affectedRows > 0
}

export async function markAllRead(userId: number): Promise<number> {
  const [result] = await pool.query<OkPacket>(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
    [userId]
  )
  return (result as any).affectedRows || 0
}

export async function setDelivered(id: number): Promise<void> {
  try {
    await pool.query<OkPacket>(`UPDATE notifications SET delivered_at = NOW() WHERE id = ? AND delivered_at IS NULL`, [id])
  } catch {}
}

function mapRow(r: any): NotificationRecord {
  return {
    id: r.id,
    user_id: r.user_id,
    actor_id: r.actor_id ?? null,
    type: r.type,
    title: r.title ?? null,
    body: r.body,
    entity_type: r.entity_type ?? null,
    entity_id: r.entity_id != null ? Number(r.entity_id) : null,
    metadata: safeParse(r.metadata),
    delivered_at: r.delivered_at ? (r.delivered_at instanceof Date ? r.delivered_at.toISOString() : r.delivered_at) : null,
    read_at: r.read_at ? (r.read_at instanceof Date ? r.read_at.toISOString() : r.read_at) : null,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  }
}

function safeParse(v: any) {
  if (!v) return null
  try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return null }
}
