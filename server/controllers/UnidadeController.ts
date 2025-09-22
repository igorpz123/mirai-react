import { Request, Response } from 'express'
import pool from '../config/db'

interface UnidadeRecord { id: number; nome: string }

export const getUnidades = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = (await pool.query(
      `SELECT id, nome FROM unidades ORDER BY nome ASC`
    )) as [UnidadeRecord[], any]
    res.status(200).json({ unidades: rows, total: rows.length })
  } catch (error) {
    console.error('Erro ao buscar unidades:', error)
    res.status(500).json({ message: 'Erro ao buscar unidades' })
  }
}

export default { getUnidades }
