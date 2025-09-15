import { Request, Response } from 'express'
import pool from '../config/db'

interface SetorRecord {
  id: number
  nome: string
  descricao?: string
  status?: string
}

export const getSetores = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = (await pool.query(
      `SELECT id, nome FROM setor ORDER BY nome ASC`
    )) as [SetorRecord[], any]

    res.status(200).json({ setores: rows, total: rows.length })
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    res.status(500).json({ message: 'Erro ao buscar setores' })
  }
}

export default { getSetores }
