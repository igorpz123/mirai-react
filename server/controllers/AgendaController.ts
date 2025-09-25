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

export const updateAgendaEvent = async (
  req: Request<{ id: string }, any, { start?: string; end?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { start, end } = req.body || {}

    if (!id) {
      res.status(400).json({ message: 'ID do evento é obrigatório' })
      return
    }
    if (!start && !end) {
      res.status(400).json({ message: 'Forneça "start" e/ou "end" para atualizar' })
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
