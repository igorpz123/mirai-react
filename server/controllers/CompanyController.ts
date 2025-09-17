import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2'
import pool from '../config/db'
import { OkPacket } from 'mysql2'

type CompanyRow = RowDataPacket & {
  id: number
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  cidade?: string
  endereco?: string
  telefone?: string
  tecnico_responsavel?: number | null
  unidade_id?: number
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
  req: Request<{}, {}, { cnpj: string; razao_social: string; nome_fantasia: string; cidade?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { cnpj, razao_social, nome_fantasia, cidade } = req.body || ({} as any)
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
      `INSERT INTO empresas (cnpj, razao_social, nome_fantasia, cidade, status)
       VALUES (?, ?, ?, ?, 'ativo')`,
      [clean, razao_social, nome_fantasia, cidade || null]
    )
    const id = (ins as any).insertId
    res.status(201).json({ id, nome: nome_fantasia, razao_social, cnpj: clean, cidade: cidade || null })
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    res.status(500).json({ message: 'Erro ao criar empresa' })
  }
}
