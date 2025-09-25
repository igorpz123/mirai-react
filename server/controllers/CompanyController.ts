import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2'
import pool from '../config/db'
import { OkPacket } from 'mysql2'
import { generateAutomaticTasksForCompany, purgeAutomaticTasksForCompany } from '../services/autoTasksService'

type CompanyRow = RowDataPacket & {
  id: number
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  cidade?: string
  telefone?: string
  tecnico_responsavel?: number | null
  unidade_id?: number
}

// List all companies (admin)
export const getAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id,
              e.nome_fantasia,
              e.razao_social,
              e.cnpj,
              e.cidade,
              e.telefone,
              e.tecnico_responsavel,
              e.unidade_responsavel,
              u.nome AS tecnico_nome,
              u.sobrenome AS tecnico_sobrenome
         FROM empresas e
    LEFT JOIN usuarios u ON u.id = e.tecnico_responsavel
        WHERE e.status = 'ativo'
        ORDER BY e.nome_fantasia ASC`
    )

    const companies = (rows || []).map((r: any) => ({
      id: r.id,
      nome: r.nome_fantasia,
      razao_social: r.razao_social,
      cnpj: r.cnpj,
      cidade: r.cidade,
      telefone: r.telefone,
      tecnico_responsavel: r.tecnico_responsavel,
      tecnico_nome: [r.tecnico_nome, r.tecnico_sobrenome].filter(Boolean).join(' ').trim() || null,
      unidade_id: r.unidade_responsavel,
    }))

    res.status(200).json({ companies, total: companies.length })
  } catch (error) {
    console.error('Erro ao buscar todas as empresas:', error)
    res.status(500).json({ message: 'Erro ao buscar empresas' })
  }
}

// Get company by ID (admin)
export const getCompanyById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'id é obrigatório' })
      return
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id,
              e.nome_fantasia,
              e.razao_social,
              e.cnpj,
              e.cidade,
              e.telefone,
              e.tecnico_responsavel,
              e.unidade_responsavel AS unidade_id,
              e.periodicidade,
              e.data_renovacao,
              uu.nome AS unidade_nome,
              u.nome AS tecnico_nome,
              u.sobrenome AS tecnico_sobrenome
         FROM empresas e
    LEFT JOIN usuarios u ON u.id = e.tecnico_responsavel
    LEFT JOIN unidades uu ON uu.id = e.unidade_responsavel
        WHERE e.id = ?
        LIMIT 1`,
      [id]
    )

    if (!rows || rows.length === 0) {
      res.status(404).json({ message: 'Empresa não encontrada' })
      return
    }

    const r: any = rows[0]
    const empresa = {
      id: r.id,
      nome: r.nome_fantasia,
      razao_social: r.razao_social,
      cnpj: r.cnpj,
      cidade: r.cidade,
      telefone: r.telefone,
      tecnico_responsavel: r.tecnico_responsavel,
      tecnico_nome: [r.tecnico_nome, r.tecnico_sobrenome].filter(Boolean).join(' ').trim() || null,
      unidade_id: r.unidade_id,
      unidade_nome: r.unidade_nome,
      periodicidade: r.periodicidade ?? null,
      data_renovacao: r.data_renovacao ?? null,
    }

    res.status(200).json(empresa)
  } catch (error) {
    console.error('Erro ao buscar empresa por id:', error)
    res.status(500).json({ message: 'Erro ao buscar empresa' })
  }
}

export const getCompaniesByResponsavel = async (req: Request<{ responsavel_id: string }>, res: Response): Promise<void> => {
  try {
    const { responsavel_id } = req.params
    if (!responsavel_id) {
      res.status(400).json({ message: 'responsavel_id é obrigatório' })
      return
    }

    const [rows] = await pool.query<CompanyRow[]>(
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade, contabilidade, telefone, tecnico_responsavel, unidade_responsavel FROM empresas WHERE tecnico_responsavel = ? AND status = 'ativo'`,
      [responsavel_id]
    )

    // normalize to { companies, total }
    const companies = (rows || []).map(r => ({
      id: r.id,
      nome: r.nome_fantasia,
      razao_social: r.razao_social,
      cnpj: r.cnpj,
      cidade: r.cidade,
      contabilidade: r.contabilidade,
      telefone: r.telefone,
      tecnico_responsavel: r.tecnico_responsavel,
      unidade_id: r.unidade_responsavel,
    }))

    res.status(200).json({ companies, total: companies.length })
  } catch (error) {
    console.error('Erro ao buscar empresas por responsavel:', error)
    res.status(500).json({ message: 'Erro ao buscar empresas' })
  }
}

export const getCompaniesByResponsavelAndUnidade = async (req: Request<{ unidade_id: string; responsavel_id: string }>, res: Response): Promise<void> => {
  try {
    const { unidade_id, responsavel_id } = req.params
    if (!unidade_id || !responsavel_id) {
      res.status(400).json({ message: 'unidade_id e responsavel_id são obrigatórios' })
      return
    }

    const [rows] = await pool.query<CompanyRow[]>(
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade, contabilidade, telefone, tecnico_responsavel, unidade_responsavel FROM empresas WHERE tecnico_responsavel = ? AND unidade_responsavel = ? AND status = 'ativo'`,
      [responsavel_id, unidade_id]
    )

    const companies = (rows || []).map(r => ({
      id: r.id,
      nome: r.nome_fantasia,
      razao_social: r.razao_social,
      cnpj: r.cnpj,
      cidade: r.cidade,
      contabilidade: r.contabilidade,
      telefone: r.telefone,
      tecnico_responsavel: r.tecnico_responsavel,
      unidade_id: r.unidade_responsavel,
    }))

    res.status(200).json({ companies, total: companies.length })
  } catch (error) {
    console.error('Erro ao buscar empresas por responsavel e unidade:', error)
    res.status(500).json({ message: 'Erro ao buscar empresas' })
  }
}

export const getCompaniesByUnidade = async (req: Request<{ unidade_id: string }>, res: Response): Promise<void> => {
  try {
    const { unidade_id } = req.params
    if (!unidade_id) {
      res.status(400).json({ message: 'unidade_id é obrigatório' })
      return
    }

    const [rows] = await pool.query<CompanyRow[]>(
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade, contabilidade, telefone, tecnico_responsavel, unidade_responsavel FROM empresas WHERE unidade_responsavel = ? AND status = 'ativo'`,
      [unidade_id]
    )

    const companies = (rows || []).map(r => ({
      id: r.id,
      nome: r.nome_fantasia,
      razao_social: r.razao_social,
      cnpj: r.cnpj,
      cidade: r.cidade,
      contabilidade: r.contabilidade,
      telefone: r.telefone,
      tecnico_responsavel: r.tecnico_responsavel,
      unidade_id: r.unidade_responsavel,
    }))

    res.status(200).json({ companies, total: companies.length })
  } catch (error) {
    console.error('Erro ao buscar empresas por unidade:', error)
    res.status(500).json({ message: 'Erro ao buscar empresas' })
  }
}

// Lookup company by CNPJ
export const getCompanyByCNPJ = async (req: Request<{ cnpj: string }>, res: Response): Promise<void> => {
  try {
    const { cnpj } = req.params
    if (!cnpj) {
      res.status(400).json({ message: 'cnpj é obrigatório' })
      return
    }
    const clean = cnpj.replace(/\D/g, '')
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade FROM empresas WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = ? LIMIT 1`,
      [clean]
    )
    if (!rows || rows.length === 0) {
      res.status(404).json({ message: 'Empresa não encontrada' })
      return
    }
    const r: any = rows[0]
    res.status(200).json({ id: r.id, nome: r.nome_fantasia, razao_social: r.razao_social, cnpj: r.cnpj, cidade: r.cidade })
  } catch (error) {
    console.error('Erro ao buscar empresa por CNPJ:', error)
    res.status(500).json({ message: 'Erro ao buscar empresa por CNPJ' })
  }
}

// Create minimal company
export const createCompany = async (
  req: Request<{}, {}, { cnpj: string; razao_social: string; nome_fantasia: string; cidade?: string; periodicidade?: number | null; data_renovacao?: string | null; tecnico_responsavel?: number | null; unidade_responsavel?: number | null }>,
  res: Response
): Promise<void> => {
  try {
    const { cnpj, razao_social, nome_fantasia, cidade, periodicidade = null, data_renovacao = null, tecnico_responsavel = null, unidade_responsavel = null } = req.body || ({} as any)
    if (!cnpj || !razao_social || !nome_fantasia) {
      res.status(400).json({ message: 'cnpj, razao_social e nome_fantasia são obrigatórios' })
      return
    }
    const clean = cnpj.replace(/\D/g, '')
    // Check exists
    const [exists] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM empresas WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') = ? LIMIT 1`,
      [clean]
    )
    if (exists && exists.length) {
      res.status(409).json({ message: 'Empresa já cadastrada' })
      return
    }
    const [ins] = await pool.query<OkPacket>(
      `INSERT INTO empresas (cnpj, razao_social, nome_fantasia, cidade, periodicidade, data_renovacao, tecnico_responsavel, unidade_responsavel, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo')`,
      [clean, razao_social, nome_fantasia, cidade || null, periodicidade, data_renovacao || null, tecnico_responsavel, unidade_responsavel]
    )
    const id = (ins as any).insertId
    // Try to generate automatic tasks (will no-op if lacks dates/periodicity)
    try { await generateAutomaticTasksForCompany(Number(id)) } catch (e) { console.warn('autoTasks(createCompany) failed:', e) }
    res.status(201).json({ id, nome: nome_fantasia, razao_social, cnpj: clean, cidade: cidade || null, periodicidade, data_renovacao, tecnico_responsavel, unidade_responsavel })
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    res.status(500).json({ message: 'Erro ao criar empresa' })
  }
}

// Update company details (admin)
export const updateCompany = async (
  req: Request<{ id: string }, {}, Partial<{ nome_fantasia: string; razao_social: string; cnpj: string; cidade: string; telefone: string; tecnico_responsavel: number | null; unidade_responsavel: number | null; periodicidade: number | null; data_renovacao: string | null }>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'id é obrigatório' })
      return
    }

    const payload = req.body || {}
    const updates: string[] = []
    const values: any[] = []

    const fieldsMap: Record<string, string> = {
      nome_fantasia: 'nome_fantasia',
      razao_social: 'razao_social',
      cnpj: 'cnpj',
      cidade: 'cidade',
      telefone: 'telefone',
      tecnico_responsavel: 'tecnico_responsavel',
      unidade_responsavel: 'unidade_responsavel',
      periodicidade: 'periodicidade',
      data_renovacao: 'data_renovacao',
    }

    for (const key of Object.keys(fieldsMap)) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        updates.push(`${fieldsMap[key]} = ?`)
        // allow null for tecnico/unidade
        values.push((payload as any)[key])
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'Nenhum campo para atualizar' })
      return
    }

    const sql = `UPDATE empresas SET ${updates.join(', ')} WHERE id = ?`
    values.push(id)

    const [result] = await pool.query<OkPacket>(sql, values)
    if (!result.affectedRows) {
      res.status(404).json({ message: 'Empresa não encontrada' })
      return
    }

    // If periodicidade or data_renovacao changed, run generator
    const changedKeys = Object.keys(payload)
    if (
      changedKeys.includes('periodicidade') ||
      changedKeys.includes('data_renovacao') ||
      changedKeys.includes('tecnico_responsavel') ||
      changedKeys.includes('unidade_responsavel')
    ) {
      try {
        await purgeAutomaticTasksForCompany(Number(id))
        await generateAutomaticTasksForCompany(Number(id))
      } catch (e) { console.warn('autoTasks(updateCompany) failed:', e) }
    }

    // return fresh data
    await getCompanyById({ ...req, params: { id } } as any, res)
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    res.status(500).json({ message: 'Erro ao atualizar empresa' })
  }
}
