import { Request, Response } from 'express'
import pool from '../config/db'

export async function getCargos(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT id, nome FROM cargos ORDER BY nome ASC')
    const cargos = rows as Array<{ id: number; nome: string }>
    res.json({ cargos, total: cargos.length })
  } catch (error: any) {
    console.error('Erro ao buscar cargos:', error)
    res.status(500).json({ message: 'Erro ao buscar cargos' })
  }
}

export default { getCargos }
