import { Request, Response } from 'express'
import pool from '../config/db'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'
import { RowDataPacket, OkPacket } from 'mysql2'

export const getEventsByResponsavel = async (req: Request<{ responsavel_id: string }, any, any, { from?: string; to?: string }>, res: Response): Promise<void> => {
  try {
    const { responsavel_id } = req.params
    const { from, to } = req.query || {}
    if (!responsavel_id) {
      res.status(400).json({ message: 'responsavel_id é obrigatório' });
      return;
    }

    const where: string[] = ['ae.usuario_id = ?']
    const params: any[] = [responsavel_id]
    if (from) { where.push('ae.start >= ?'); params.push(from) }
    if (to) { where.push('ae.end <= ?'); params.push(to) }

    const [rows] = await pool.query(
      `SELECT 
         ae.id, 
         ae.tarefa_id, 
         ae.start AS start_date, 
         ae.end AS end_date, 
         ae.title, 
         ae.description,
         ae.color,
         tsk.finalidade_id AS tipo_tarefa_id
       FROM agenda_events ae
       LEFT JOIN tarefas tsk ON tsk.id = ae.tarefa_id
       WHERE ${where.join(' AND ')}
       ORDER BY ae.start ASC`,
      params
    )

    res.status(200).json({ events: rows || [] })
  } catch (err) {
    console.error('Erro ao buscar eventos da agenda:', err)
    res.status(500).json({ message: 'Erro ao buscar eventos da agenda' })
  }
}

export const createAgendaEvent = async (
  req: Request<{}, any, { title?: string; description?: string; color?: string; start?: string; end?: string; tarefa_id?: number | null; usuario_id?: number }>,
  res: Response
): Promise<void> => {
  try {
    const { title, description, color, start, end, tarefa_id, usuario_id } = req.body || {}

    // Basic validation
    const missing: string[] = []
    if (!title || !String(title).trim()) missing.push('title')
    if (!start || !String(start).trim()) missing.push('start')
    if (!usuario_id || isNaN(Number(usuario_id))) missing.push('usuario_id')
    if (missing.length) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes', missing })
      return
    }

    // Parse start/end to ensure ordering if both provided
    const startMs = Date.parse(start as string)
    const endMs = end ? Date.parse(end as string) : NaN
    if (isNaN(startMs)) {
      res.status(400).json({ message: 'start inválido' })
      return
    }
    if (end && isNaN(endMs)) {
      res.status(400).json({ message: 'end inválido' })
      return
    }
    if (!isNaN(endMs) && endMs <= startMs) {
      res.status(400).json({ message: 'end deve ser maior que start' })
      return
    }

    // Extract actor from JWT for permission checks
    let actorId: number | null = null
    const authHeader = req.headers && (req.headers.authorization as string | undefined)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
        actorId = payload?.userId ?? payload?.id ?? null
      } catch {}
    }
    if (!actorId) {
      res.status(401).json({ message: 'Não autorizado' })
      return
    }

    // Only owner or admin can create events for a user
    let isAdmin = false
    try {
      const [rowsUser] = await pool.query<RowDataPacket[]>(`SELECT cargo_id FROM usuarios WHERE id = ? LIMIT 1`, [actorId])
      const cargoId = Number((rowsUser as any[])[0]?.cargo_id || 0)
      isAdmin = cargoId === 1
    } catch {}
    if (!isAdmin && Number(actorId) !== Number(usuario_id)) {
      res.status(403).json({ message: 'Sem permissão para criar evento para este usuário' })
      return
    }

    // Normalize values
    const titulo = String(title).trim()
    const desc = (description != null && String(description).trim() !== '') ? String(description).trim() : ''
    const colorStr = (color != null && String(color).trim() !== '') ? String(color).trim() : null
    const tarefaIdVal = (tarefa_id == null || tarefa_id === '' as any) ? null : Number(tarefa_id)

    const [ins] = await pool.query<OkPacket>(
      `INSERT INTO agenda_events (title, description, color, start, end, tarefa_id, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, desc, colorStr, start, end || null, tarefaIdVal, Number(usuario_id)]
    )
    const newId = (ins as OkPacket).insertId

    // Return created row similar to listing shape (including finalidade_id as tipo_tarefa_id)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         ae.id,
         ae.tarefa_id,
         ae.start AS start_date,
         ae.end AS end_date,
         ae.title,
         ae.description,
         ae.color,
         tsk.finalidade_id AS tipo_tarefa_id
       FROM agenda_events ae
       LEFT JOIN tarefas tsk ON tsk.id = ae.tarefa_id
       WHERE ae.id = ?
       LIMIT 1`,
      [newId]
    )
    const event = (rows as any[])[0] || {
      id: newId,
      tarefa_id: tarefaIdVal,
      start_date: start,
      end_date: end || null,
      title: titulo,
      description: desc,
      color: colorStr,
      tipo_tarefa_id: null,
    }
    res.status(201).json({ message: 'Evento criado', event })
  } catch (err) {
    console.error('Erro ao criar evento da agenda:', err)
    res.status(500).json({ message: 'Erro ao criar evento' })
  }
}

export const updateAgendaEvent = async (
  req: Request<{ id: string }, any, { start?: string; end?: string; title?: string; description?: string | null }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { start, end, title, description } = req.body || {}

    if (!id) {
      res.status(400).json({ message: 'ID do evento é obrigatório' })
      return
    }
    if (!start && !end && typeof title !== 'string' && typeof description === 'undefined') {
      res.status(400).json({ message: 'Forneça campos para atualizar (start, end, title, description)' })
      return
    }

    // Extract actor from JWT (if present)
    let actorId: number | null = null
    const authHeader = req.headers && (req.headers.authorization as string | undefined)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
        actorId = payload?.userId ?? payload?.id ?? null
      } catch (e) {
        // ignore, will handle as unauthorized below
      }
    }

    if (!actorId) {
      res.status(401).json({ message: 'Não autorizado' })
      return
    }

    // Load event owner
    const [rowsEvt] = await pool.query<RowDataPacket[]>(
      `SELECT id, usuario_id FROM agenda_events WHERE id = ? LIMIT 1`,
      [id]
    )
    if (!(rowsEvt as any[]).length) {
      res.status(404).json({ message: 'Evento não encontrado' })
      return
    }
    const ownerId = Number((rowsEvt as any[])[0].usuario_id)

    // Check if actor is owner or admin (cargo_id = 1)
    let isAdmin = false
    try {
      const [rowsUser] = await pool.query<RowDataPacket[]>(`SELECT cargo_id FROM usuarios WHERE id = ? LIMIT 1`, [actorId])
      const cargoId = Number((rowsUser as any[])[0]?.cargo_id || 0)
      isAdmin = cargoId === 1
    } catch {}
    if (!isAdmin && Number(actorId) !== ownerId) {
      res.status(403).json({ message: 'Sem permissão para alterar este evento' })
      return
    }

    const updates: string[] = []
    const params: any[] = []
    if (typeof start === 'string' && start.trim()) { updates.push('start = ?'); params.push(start.trim()) }
    if (typeof end === 'string' && end.trim()) { updates.push('end = ?'); params.push(end.trim()) }
    if (typeof title === 'string') {
      const t = title.trim()
      if (!t) {
        res.status(400).json({ message: 'title não pode ser vazio' })
        return
      }
      updates.push('title = ?'); params.push(t)
    }
    if (typeof description !== 'undefined') {
      const d = (description == null) ? null : String(description)
      updates.push('description = ?'); params.push(d)
    }
    if (!updates.length) {
      res.status(400).json({ message: 'Valores inválidos' })
      return
    }
    const sql = `UPDATE agenda_events SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)
    const [result] = await pool.query<OkPacket>(sql, params)
    if (!result.affectedRows) {
      res.status(404).json({ message: 'Evento não encontrado' })
      return
    }
    res.status(200).json({ message: 'Evento atualizado' })
  } catch (err) {
    console.error('Erro ao atualizar evento da agenda:', err)
    res.status(500).json({ message: 'Erro ao atualizar evento' })
  }
}

export const deleteAgendaEvent = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'ID do evento é obrigatório' })
      return
    }

    // Extract actor from JWT
    let actorId: number | null = null
    const authHeader = req.headers && (req.headers.authorization as string | undefined)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
        actorId = payload?.userId ?? payload?.id ?? null
      } catch (e) {
        // ignore
      }
    }

    if (!actorId) {
      res.status(401).json({ message: 'Não autorizado' })
      return
    }

    // Load event owner
    const [rowsEvt] = await pool.query<RowDataPacket[]>(
      `SELECT id, usuario_id FROM agenda_events WHERE id = ? LIMIT 1`,
      [id]
    )
    if (!(rowsEvt as any[]).length) {
      res.status(404).json({ message: 'Evento não encontrado' })
      return
    }
    const ownerId = Number((rowsEvt as any[])[0].usuario_id)

    // Check if actor is owner or admin (cargo_id = 1)
    let isAdmin = false
    try {
      const [rowsUser] = await pool.query<RowDataPacket[]>(`SELECT cargo_id FROM usuarios WHERE id = ? LIMIT 1`, [actorId])
      const cargoId = Number((rowsUser as any[])[0]?.cargo_id || 0)
      isAdmin = cargoId === 1
    } catch {}
    if (!isAdmin && Number(actorId) !== ownerId) {
      res.status(403).json({ message: 'Sem permissão para deletar este evento' })
      return
    }

    const [result] = await pool.query<OkPacket>(
      `DELETE FROM agenda_events WHERE id = ?`,
      [id]
    )
    if (!result.affectedRows) {
      res.status(404).json({ message: 'Evento não encontrado' })
      return
    }

    res.status(200).json({ message: 'Evento deletado com sucesso' })
  } catch (err) {
    console.error('Erro ao deletar evento da agenda:', err)
    res.status(500).json({ message: 'Erro ao deletar evento' })
  }
}
