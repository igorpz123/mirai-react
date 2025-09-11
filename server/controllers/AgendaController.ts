import { Request, Response } from 'express'
import pool from '../config/db'

export const getEventsByResponsavel = async (req: Request<{ responsavel_id: string }>, res: Response): Promise<void> => {
  try {
    const { responsavel_id } = req.params
    if (!responsavel_id) {
      res.status(400).json({ message: 'responsavel_id é obrigatório' });
      return;
    }

    const [rows] = await pool.query(
      `SELECT ae.id, ae.tarefa_id, ae.start, ae.end, ae.title, ae.description
       FROM agenda_events ae
       WHERE ae.usuario_id = ?
       ORDER BY ae.start ASC`,
      [responsavel_id]
    )

    res.status(200).json({ events: rows || [] })
  } catch (err) {
    console.error('Erro ao buscar eventos da agenda:', err)
    res.status(500).json({ message: 'Erro ao buscar eventos da agenda' })
  }
}
