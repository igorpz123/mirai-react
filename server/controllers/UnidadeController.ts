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

export const getUnidadeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = (await pool.query(
      `SELECT id, nome FROM unidades WHERE id = ? LIMIT 1`,
      [id]
    )) as [UnidadeRecord[], any]

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: 'Unidade não encontrada' })
      return
    }
    res.status(200).json(rows[0])
  } catch (error) {
    console.error('Erro ao buscar unidade:', error)
    res.status(500).json({ message: 'Erro ao buscar unidade' })
  }
}

export const createUnidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome } = req.body as Partial<UnidadeRecord>
    if (!nome || String(nome).trim() === '') {
      res.status(400).json({ message: 'Nome é obrigatório' })
      return
    }
    const [result] = (await pool.query(
      `INSERT INTO unidades (nome) VALUES (?)`,
      [nome]
    )) as [any, any]
    const insertId = result?.insertId
    res.status(201).json({ id: insertId, nome })
  } catch (error: any) {
    console.error('Erro ao criar unidade:', error)
    res.status(500).json({ message: 'Erro ao criar unidade' })
  }
}

export const updateUnidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nome } = req.body as Partial<UnidadeRecord>
    if (!nome || String(nome).trim() === '') {
      res.status(400).json({ message: 'Nome é obrigatório' })
      return
    }
    const [result] = (await pool.query(
      `UPDATE unidades SET nome = ? WHERE id = ?`,
      [nome, id]
    )) as [any, any]
    if (result?.affectedRows === 0) {
      res.status(404).json({ message: 'Unidade não encontrada' })
      return
    }
    res.status(200).json({ id: Number(id), nome })
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error)
    res.status(500).json({ message: 'Erro ao atualizar unidade' })
  }
}

export const deleteUnidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [result] = (await pool.query(
      `DELETE FROM unidades WHERE id = ?`,
      [id]
    )) as [any, any]
    if (result?.affectedRows === 0) {
      res.status(404).json({ message: 'Unidade não encontrada' })
      return
    }
    res.status(204).send()
  } catch (error: any) {
    // Tratamento de erro comum para restrições de chave estrangeira
    if (error && (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2')) {
      res.status(409).json({ message: 'Não é possível excluir a unidade: está vinculada a outros registros.' })
      return
    }
    console.error('Erro ao excluir unidade:', error)
    res.status(500).json({ message: 'Erro ao excluir unidade' })
  }
}

export default { getUnidades, getUnidadeById, createUnidade, updateUnidade, deleteUnidade }
