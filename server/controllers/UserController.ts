// src/controllers/UserController.ts
import { Request, Response } from 'express'
import pool from '../config/db'

// Estrutura básica de um usuário retornado pelas queries
interface UserRecord {
  id: number
  nome: string
  sobrenome: string
  email: string
  cargo_id: number
  foto_url: string
  cargo: string
  setores: string
  setor_nomes: string
  unidades: string
  unidade_nomes: string
}

/**
 * Listar todos os usuários ativos
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = (await pool.query(
      `SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE u.status = 'ativo'
        GROUP BY u.id
        ORDER BY u.nome ASC
      `
    )) as [UserRecord[], any]

    res.status(200).json(rows)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    res.status(500).json({ message: 'Erro ao buscar usuários' })
  }
}

/**
 * Buscar um usuário pelo ID
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = (await pool.query(
      `SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE u.id = ?
      `,
      [id]
    )) as [UserRecord[], any]

    if (rows.length > 0) {
      res.status(200).json(rows[0])
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' })
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar usuário' })
  }
}

/**
 * Buscar usuários por unidade (query: unidades_id=1,2,3)
 */
export const getUserByUnidade = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let unidades = req.query.unidades_id
    if (typeof unidades === 'string') {
      unidades = unidades.split(',')
    }
    const [rows] = (await pool.query(
      `
        SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE uu.unidade_id IN (?)
          AND u.status = 'ativo'
        GROUP BY u.id
        ORDER BY u.nome ASC
      `,
      [unidades]
    )) as [UserRecord[], any]

    res.status(200).json(rows)
  } catch (error) {
    console.error('Erro ao buscar usuários por unidade:', error)
    res.status(500).json({ message: 'Erro ao buscar usuários' })
  }
}

/**
 * Buscar usuários por setor (param: setor_id)
 */
export const getUserBySetor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { setor_id } = req.params
    const [rows] = (await pool.query(
      `
        SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE us.setor_id = ?
        GROUP BY u.id
        ORDER BY u.nome ASC
      `,
      [setor_id]
    )) as [UserRecord[], any]

    if (rows.length > 0) {
      res.status(200).json(rows)
    } else {
      res.status(404).json({ message: 'Nenhum usuário encontrado para o setor informado.' })
    }
  } catch (error) {
    console.error('Erro ao buscar usuário por setor:', error)
    res.status(500).json({ message: 'Erro ao buscar usuário' })
  }
}

/**
 * Buscar usuários por unidade e setor (query: unidades_id=1,2 & setor_id=2,3)
 */
export const getUserByUnidadeSetor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let unidades = req.query.unidades_id
    let setores = req.query.setor_id

    if (typeof unidades === 'string') unidades = unidades.split(',')
    if (typeof setores === 'string') setores = setores.split(',')

    const [rows] = (await pool.query(
      `
        SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE uu.unidade_id IN (?)
          AND us.setor_id IN (?)
          AND u.status = 'ativo'
        GROUP BY u.id
        ORDER BY u.nome ASC
      `,
      [unidades, setores]
    )) as [UserRecord[], any]

    if (rows.length > 0) {
      res.status(200).json(rows)
    } else {
      res.status(404).json({ message: 'Nenhum usuário encontrado com os parâmetros informados.' })
    }
  } catch (error) {
    console.error('Erro ao buscar usuários por unidade e setor:', error)
    res.status(500).json({ message: 'Erro ao buscar usuários' })
  }
}

/**
 * Buscar usuários por cargo (query: cargo_id)
 */
export const getUserByCargo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cargoId = req.query.cargo_id
    const [rows] = (await pool.query(
      `
        SELECT 
          u.id,
          u.nome,
          u.sobrenome,
          u.email,
          u.cargo_id,
          u.foto_url,
          uc.nome AS cargo,
          GROUP_CONCAT(DISTINCT us.setor_id) AS setores,
          GROUP_CONCAT(DISTINCT str.nome) AS setor_nomes,
          GROUP_CONCAT(DISTINCT uu.unidade_id) AS unidades,
          GROUP_CONCAT(DISTINCT und.nome) AS unidade_nomes
        FROM usuarios u
        JOIN cargos uc ON u.cargo_id = uc.id
        LEFT JOIN usuario_setores us ON us.usuario_id = u.id
        LEFT JOIN setor str ON us.setor_id = str.id
        LEFT JOIN usuario_unidades uu ON uu.usuario_id = u.id
        LEFT JOIN unidades und ON uu.unidade_id = und.id
        WHERE u.cargo_id = ?
        GROUP BY u.id
        ORDER BY u.nome ASC
      `,
      [cargoId]
    )) as [UserRecord[], any]

    if (rows.length > 0) {
      res.status(200).json(rows)
    } else {
      res.status(404).json({ message: 'Nenhum usuário encontrado para o cargo informado.' })
    }
  } catch (error) {
    console.error('Erro ao buscar usuário por cargo:', error)
    res.status(500).json({ message: 'Erro ao buscar usuário' })
  }
}