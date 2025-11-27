// src/controllers/UserController.ts
import { Request, Response } from 'express'
import pool from '../config/db'
import * as UserService from '../services/userService'
import path from 'path'
import { PUBLIC_UPLOADS_PREFIX, PUBLIC_UPLOADS_DIR } from '../middleware/upload'
import bcrypt from 'bcrypt'

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
    const { nome, sobrenome, email, cargo_id, foto_url, senha } = req.body as Partial<UserRecord> & { foto_url?: string; senha?: string }

    const fields: string[] = []
    const values: any[] = []
    if (typeof nome === 'string') { fields.push('nome = ?'); values.push(nome) }
    if (typeof sobrenome === 'string') { fields.push('sobrenome = ?'); values.push(sobrenome) }
    if (typeof email === 'string') { fields.push('email = ?'); values.push(email) }
    if (typeof cargo_id !== 'undefined') { fields.push('cargo_id = ?'); values.push(cargo_id) }
    if (typeof foto_url === 'string') { fields.push('foto_url = ?'); values.push(foto_url) }
    
    // Se senha foi fornecida, fazer hash antes de atualizar
    if (typeof senha === 'string' && senha.trim() !== '') {
      const saltRounds = 10
      const hash = await bcrypt.hash(senha, saltRounds)
      fields.push('senha = ?')
      values.push(hash)
    }

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
 * Upload de foto do usuário (multer middleware deve fornecer `req.file`)
 * Salva o arquivo em uploads/user-{id}/<filename> e atualiza foto_url no banco com caminho público
 */
export const uploadUserPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const file = (req as any).file
    if (!file) {
      res.status(400).json({ message: 'Arquivo não enviado' })
      return
    }
    // Public path should be /uploads/user-{id}/{filename}
    const folder = `user-${id}`
    const publicPath = path.posix.join('/uploads', folder, file.filename)

    // update db
    await pool.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', [publicPath, id])

    res.status(200).json({ foto_url: publicPath })
  } catch (error) {
    console.error('Erro ao fazer upload de foto do usuário:', error)
    res.status(500).json({ message: 'Erro ao fazer upload de foto do usuário' })
  }
}

/**
 * Criar um novo usuário
 * Body esperado: { nome, sobrenome, email, senha, cargoId?, unidadeIds?: number[], setorIds?: number[] }
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, sobrenome, email, senha, cargoId, unidadeIds, setorIds } = req.body as any
    if (!nome || !email || !senha) {
      res.status(400).json({ message: 'nome, email e senha são obrigatórios' })
      return
    }

    // check if email exists
    const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]) as [any[], any]
    if (exists && exists.length > 0) {
      res.status(409).json({ message: 'Email já cadastrado' })
      return
    }

    const saltRounds = 10
    const hash = await bcrypt.hash(String(senha), saltRounds)

    const cargo_id = cargoId ? Number(cargoId) : null

    const insertSql = `INSERT INTO usuarios (nome, sobrenome, email, senha, cargo_id, status) VALUES (?, ?, ?, ?, ?, 'ativo')`
    const [result] = await pool.query(insertSql, [nome, sobrenome, email, hash, cargo_id]) as any
    const newId = result.insertId

    // insert multiple setores and unidades if provided
    try {
      if (Array.isArray(setorIds) && setorIds.length > 0) {
        const setorValues = setorIds.map(sid => [newId, Number(sid)])
        await pool.query('INSERT IGNORE INTO usuario_setores (usuario_id, setor_id) VALUES ?', [setorValues])
      }
      if (Array.isArray(unidadeIds) && unidadeIds.length > 0) {
        const unidadeValues = unidadeIds.map(uid => [newId, Number(uid)])
        await pool.query('INSERT IGNORE INTO usuario_unidades (usuario_id, unidade_id) VALUES ?', [unidadeValues])
      }
    } catch (e) { 
      console.error('Erro ao vincular setores/unidades:', e)
      // continue anyway
    }

    // return created user minimal
    const [rows] = await pool.query('SELECT id, nome, sobrenome, email, cargo_id, foto_url FROM usuarios WHERE id = ? LIMIT 1', [newId]) as [any[], any]
    res.status(201).json({ user: rows[0] })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    res.status(500).json({ message: 'Erro ao criar usuário' })
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

/**
 * Coletar notas (avaliações) recebidas por um usuário com base no histórico de tarefas
 * Fonte: historico_alteracoes (colunas: avaliacao_nota, avaliacao_by, avaliacao_obs, avaliacao_data)
 * Retorna lista, média e contagem
 */
export const getUserNotas = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' })
      return
    }

    // Optional period filters (?inicio=YYYY-MM-DD&fim=YYYY-MM-DD)
    const inicio = typeof (req.query as any).inicio === 'string' && (req.query as any).inicio.trim() ? String((req.query as any).inicio).trim() : null
    const fim = typeof (req.query as any).fim === 'string' && (req.query as any).fim.trim() ? String((req.query as any).fim).trim() : null

    const params: any[] = [id]
    const where: string[] = [
      'h.usuario_id = ?',
      'h.avaliacao_nota IS NOT NULL'
    ]
    if (inicio) { where.push('h.avaliacao_data >= ?'); params.push(`${inicio} 00:00:00`) }
    if (fim) { where.push('h.avaliacao_data <= ?'); params.push(`${fim} 23:59:59`) }

    // Buscar avaliações feitas sobre ações deste usuário no histórico
    const [rows] = await pool.query(
      `
      SELECT
        h.id AS historico_id,
        h.tarefa_id,
        h.avaliacao_nota AS nota,
        h.avaliacao_obs AS obs,
        h.avaliacao_data AS data,
        h.avaliacao_by AS avaliador_id,
        u.nome AS avaliador_nome,
        u.sobrenome AS avaliador_sobrenome,
        u.foto_url AS avaliador_foto
      FROM historico_alteracoes h
      LEFT JOIN usuarios u ON u.id = h.avaliacao_by
      WHERE ${where.join(' AND ')}
      ORDER BY h.avaliacao_data DESC
      `,
      params
    ) as [Array<any>, any]

    const notas = (rows || []).map(r => ({
      historico_id: Number(r.historico_id),
      tarefa_id: Number(r.tarefa_id),
      nota: r.nota != null ? Number(r.nota) : null,
      data: r.data || null,
      obs: r.obs || null,
      by: r.avaliador_id ? {
        id: Number(r.avaliador_id),
        nome: r.avaliador_nome || undefined,
        sobrenome: r.avaliador_sobrenome || undefined,
        foto: r.avaliador_foto || undefined,
      } : null,
    }))

    const values = notas.map(n => Number(n.nota)).filter(v => Number.isFinite(v)) as number[]
    const count = values.length
    const average = count ? (values.reduce((a, b) => a + b, 0) / count) : null

    res.status(200).json({ notas, count, average })
  } catch (error) {
    console.error('Erro ao buscar notas do usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar notas do usuário' })
  }
}

/**
 * Resumo rápido das notas (count + average), com os mesmos filtros de período.
 * GET /api/usuarios/:id/notas/resumo?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
 */
export const getUserNotasResumo = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'ID do usuário é obrigatório' })
      return
    }

    const inicio = typeof (req.query as any).inicio === 'string' && (req.query as any).inicio.trim() ? String((req.query as any).inicio).trim() : null
    const fim = typeof (req.query as any).fim === 'string' && (req.query as any).fim.trim() ? String((req.query as any).fim).trim() : null

    const params: any[] = [id]
    const where: string[] = [
      'h.usuario_id = ?',
      'h.avaliacao_nota IS NOT NULL'
    ]
    if (inicio) { where.push('h.avaliacao_data >= ?'); params.push(`${inicio} 00:00:00`) }
    if (fim) { where.push('h.avaliacao_data <= ?'); params.push(`${fim} 23:59:59`) }

    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt, AVG(h.avaliacao_nota) AS avg_nota
       FROM historico_alteracoes h
       WHERE ${where.join(' AND ')}`,
      params
    ) as [Array<any>, any]

    const cnt = Number((rows as any[])[0]?.cnt || 0)
    const avgRaw = (rows as any[])[0]?.avg_nota
    const average = cnt ? (avgRaw != null ? Number(avgRaw) : null) : null
    res.status(200).json({ count: cnt, average })
  } catch (error) {
    console.error('Erro ao buscar resumo de notas do usuário:', error)
    res.status(500).json({ message: 'Erro ao buscar resumo de notas do usuário' })
  }
}