import { Request, Response } from 'express'
import pool from '../config/db'

interface TipoTarefaRecord {
  id: number
  tipo: string
  setor_responsavel_id?: number | null
}

export const getTipoTarefa = async (req: Request, res: Response): Promise<void> => {
  try {
    const setorId = req.query.setor_id
    let rows
    if (setorId) {
      // include rows where setor_responsavel_id matches OR is NULL (the 'Outro' option)
      const [r] = await pool.query(
        `SELECT id, tipo, setor_responsavel_id FROM tipo_tarefa WHERE setor_responsavel_id = ? OR setor_responsavel_id IS NULL ORDER BY tipo ASC`,
        [setorId]
      ) as [TipoTarefaRecord[], any]
      rows = r
    } else {
      const [r] = await pool.query(
        `SELECT id, tipo, setor_responsavel_id FROM tipo_tarefa ORDER BY tipo ASC`
      ) as [TipoTarefaRecord[], any]
      rows = r
    }

    res.status(200).json({ tipos: rows, total: rows.length })
  } catch (error) {
    console.error('Erro ao buscar tipos de tarefa:', error)
    res.status(500).json({ message: 'Erro ao buscar tipos de tarefa' })
  }
}

export default { getTipoTarefa }
