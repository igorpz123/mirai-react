// src/controllers/UserController.ts
import { Request, Response } from 'express'
import pool from '../config/db'
import * as UserService from '../services/userService'

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
    // aceitar tanto params quanto query (rota definida como /unidade/:unidade_id)
    let unidades: any = req.params.unidade_id || req.query.unidades_id
    if (typeof unidades === 'string' && unidades.includes(',')) {
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

export const getUsersByDepartmentAndUnit = async (req: Request, res: Response) => {
  try {
    // aceitar parâmetros via rota (/unidade/:unidade_id/setor/:setor_id) ou query
    const departmentId = req.params.setor_id || req.query.departmentId
    const unitId = req.params.unidade_id || req.query.unitId

    const users = await UserService.getUsersByDepartmentAndUnit(
      Number(departmentId),
      Number(unitId)
    );

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

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

/**
 * Inativar um usuário (status = 'inativo')
 */
export const inactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    // Verifica se usuário existe
    const [exists] = await pool.query(
      'SELECT id, status FROM usuarios WHERE id = ? LIMIT 1',
      [id]
    ) as [Array<{ id: number; status: string }>, any]

    if (!exists || exists.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado' })
      return
    }

    if (exists[0].status === 'inativo') {
      res.status(200).json({ message: 'Usuário já está inativo' })
      return
    }

    await pool.query(
      "UPDATE usuarios SET status = 'inativo' WHERE id = ?",
      [id]
    )

    res.status(200).json({ message: 'Usuário inativado com sucesso' })
  } catch (error) {
    console.error('Erro ao inativar usuário:', error)
    res.status(500).json({ message: 'Erro ao inativar usuário' })
  }
}

/**
 * Atualizar dados básicos do usuário
 */
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { nome, sobrenome, email, cargo_id, foto_url } = req.body as Partial<UserRecord> & { foto_url?: string }

    const fields: string[] = []
    const values: any[] = []
    if (typeof nome === 'string') { fields.push('nome = ?'); values.push(nome) }
    if (typeof sobrenome === 'string') { fields.push('sobrenome = ?'); values.push(sobrenome) }
    if (typeof email === 'string') { fields.push('email = ?'); values.push(email) }
    if (typeof cargo_id !== 'undefined') { fields.push('cargo_id = ?'); values.push(cargo_id) }
    if (typeof foto_url === 'string') { fields.push('foto_url = ?'); values.push(foto_url) }

    if (fields.length === 0) {
      res.status(400).json({ message: 'Nenhum campo para atualizar' })
      return
    }

    values.push(id)
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values)
    res.status(200).json({ message: 'Usuário atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({ message: 'Erro ao atualizar usuário' })
  }
}

/**
 * Adicionar setores ao usuário (não remove os existentes)
 * Body: { setorIds: number[] }
 */
export const addUserSetores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { setorIds } = req.body as { setorIds?: number[] }
    if (!Array.isArray(setorIds) || setorIds.length === 0) {
      res.status(400).json({ message: 'setorIds inválido' })
      return
    }

    // inserir ignorando duplicatas
    const values = setorIds.map(sid => [id, sid])
    await pool.query(
      'INSERT IGNORE INTO usuario_setores (usuario_id, setor_id) VALUES ?',
      [values]
    )
    res.status(200).json({ message: 'Setores adicionados ao usuário' })
  } catch (error) {
    console.error('Erro ao adicionar setores ao usuário:', error)
    res.status(500).json({ message: 'Erro ao adicionar setores' })
  }
}

/**
 * Adicionar unidades ao usuário (não remove as existentes)
 * Body: { unidadeIds: number[] }
 */
export const addUserUnidades = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { unidadeIds } = req.body as { unidadeIds?: number[] }
    if (!Array.isArray(unidadeIds) || unidadeIds.length === 0) {
      res.status(400).json({ message: 'unidadeIds inválido' })
      return
    }

    const values = unidadeIds.map(uid => [id, uid])
    await pool.query(
      'INSERT IGNORE INTO usuario_unidades (usuario_id, unidade_id) VALUES ?',
      [values]
    )
    res.status(200).json({ message: 'Unidades adicionadas ao usuário' })
  } catch (error) {
    console.error('Erro ao adicionar unidades ao usuário:', error)
    res.status(500).json({ message: 'Erro ao adicionar unidades' })
  }
}

/**
 * Remover vínculo de setor do usuário
 */
export const removeUserSetor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, setorId } = req.params
    await pool.query('DELETE FROM usuario_setores WHERE usuario_id = ? AND setor_id = ?', [id, setorId])
    res.status(200).json({ message: 'Setor removido do usuário' })
  } catch (error) {
    console.error('Erro ao remover setor do usuário:', error)
    res.status(500).json({ message: 'Erro ao remover setor' })
  }
}

/**
 * Remover vínculo de unidade do usuário
 */
export const removeUserUnidade = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, unidadeId } = req.params
    await pool.query('DELETE FROM usuario_unidades WHERE usuario_id = ? AND unidade_id = ?', [id, unidadeId])
    res.status(200).json({ message: 'Unidade removida do usuário' })
  } catch (error) {
    console.error('Erro ao remover unidade do usuário:', error)
    res.status(500).json({ message: 'Erro ao remover unidade' })
  }
}