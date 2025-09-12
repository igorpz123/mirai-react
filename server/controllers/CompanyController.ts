import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2'
import pool from '../config/db'

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
      `SELECT id, nome_fantasia, razao_social, cnpj, cidade, contabilidade, telefone, tecnico_responsavel, unidade_id FROM empresas WHERE tecnico_responsavel = ? AND unidade_id = ? AND status = 'ativo'`,
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
      unidade_id: r.unidade_id,
    }))

    res.status(200).json({ companies, total: companies.length })
  } catch (error) {
    console.error('Erro ao buscar empresas por responsavel e unidade:', error)
    res.status(500).json({ message: 'Erro ao buscar empresas' })
  }
}
