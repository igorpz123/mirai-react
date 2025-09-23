import { Request, Response } from 'express'
import pool from '../config/db'

interface SetorRecord { id: number; nome: string }

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

export const getSetorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = (await pool.query(
      `SELECT id, nome FROM setor WHERE id = ? LIMIT 1`,
      [id]
    )) as [SetorRecord[], any]
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: 'Setor não encontrado' })
      return
    }
    res.status(200).json(rows[0])
  } catch (error) {
    console.error('Erro ao buscar setor:', error)
    res.status(500).json({ message: 'Erro ao buscar setor' })
  }
}

export const createSetor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome } = req.body as Partial<SetorRecord>
    if (!nome || String(nome).trim() === '') {
      res.status(400).json({ message: 'Nome é obrigatório' })
      return
    }
    const [result] = (await pool.query(
      `INSERT INTO setor (nome) VALUES (?)`,
      [nome]
    )) as [any, any]
    const insertId = result?.insertId
    res.status(201).json({ id: insertId, nome })
  } catch (error) {
    console.error('Erro ao criar setor:', error)
    res.status(500).json({ message: 'Erro ao criar setor' })
  }
}

export const updateSetor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { nome } = req.body as Partial<SetorRecord>
    if (!nome || String(nome).trim() === '') {
      res.status(400).json({ message: 'Nome é obrigatório' })
      return
    }
    const [result] = (await pool.query(
      `UPDATE setor SET nome = ? WHERE id = ?`,
      [nome, id]
    )) as [any, any]
    if (result?.affectedRows === 0) {
      res.status(404).json({ message: 'Setor não encontrado' })
      return
    }
    res.status(200).json({ id: Number(id), nome })
  } catch (error) {
    console.error('Erro ao atualizar setor:', error)
    res.status(500).json({ message: 'Erro ao atualizar setor' })
  }
}

export const deleteSetor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [result] = (await pool.query(
      `DELETE FROM setor WHERE id = ?`,
      [id]
    )) as [any, any]
    if (result?.affectedRows === 0) {
      res.status(404).json({ message: 'Setor não encontrado' })
      return
    }
    res.status(204).send()
  } catch (error: any) {
    if (error && (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2')) {
      res.status(409).json({ message: 'Não é possível excluir o setor: está vinculado a outros registros.' })
      return
    }
    console.error('Erro ao excluir setor:', error)
    res.status(500).json({ message: 'Erro ao excluir setor' })
  }
}

export default { getSetores, getSetorById, createSetor, updateSetor, deleteSetor }
