import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2'
import pool from '../config/db'

type ProposalRow = RowDataPacket & {
    id: number
    cliente: string
    valor: number | null
    status: string
    comissao?: number | null
    criado_em?: string | Date | null
    unidade_id?: number | null
    titulo?: string | null
    responsavel_id?: number | null
    responsavel_nome?: string | null
}

export const getProposalsByUser = async (
    req: Request<{}, {}, {}, { userId?: string | null }>,
    res: Response
): Promise<void> => {
    try {
        const userId = req.query.userId ? Number(req.query.userId) : null
        if (!userId) {
            res.status(200).json({ proposals: [] })
            return
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                p.*, 
                usr_responsavel.nome AS responsavel_nome, 
                usr_responsavel.sobrenome AS responsavel_sobrenome, 
                usr_indicacao.nome AS indicacao_nome, 
                usr_indicacao.sobrenome AS indicacao_sobrenome, 
                e.razao_social AS empresa_razaoSocial,
                e.nome_fantasia AS empresa_nome,
                e.cnpj AS empresa_cnpj,
                e.cidade AS empresa_cidade,
                e.contabilidade AS empresa_contabilidade,
                e.telefone AS empresa_telefone,
                e.email AS empresa_email
            FROM 
                propostas p
            LEFT JOIN usuarios usr_responsavel ON p.responsavel_id = usr_responsavel.id
            LEFT JOIN usuarios usr_indicacao ON p.indicacao_id = usr_indicacao.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE p.responsavel_id = ?
            ORDER BY p.data ASC
            `,
            [userId]
        )

        const proposals = (rows || []).map((r: any) => {
            const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const indic = [r.indicacao_nome, r.indicacao_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const empresaNome = r.empresa_nome || r.empresa_razaoSocial || null
            // Datas: usar p.data como criadoEm e p.data_alteracao como dataAlteracao
            const createdAt = r.data ? (r.data instanceof Date ? r.data.toISOString() : String(r.data)) : undefined
            const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                status: r.status,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                titulo: r.titulo ?? undefined,
                responsavel: resp,
                indicacao: indic,
                empresa: {
                    nome: r.empresa_nome ?? undefined,
                    razaoSocial: r.empresa_razaoSocial ?? undefined,
                    cnpj: r.empresa_cnpj ?? undefined,
                    cidade: r.empresa_cidade ?? undefined,
                    contabilidade: r.empresa_contabilidade ?? undefined,
                    telefone: r.empresa_telefone ?? undefined,
                    email: r.empresa_email ?? undefined,
                }
            }
        })

        res.status(200).json({ proposals })
    } catch (error) {
        console.error('Erro ao buscar propostas por usuário:', error)
        res.status(500).json({ proposals: [] })
    }
}

export const getProposalsByUnidade = async (
    req: Request<{ unidade_id: string }>,
    res: Response
): Promise<void> => {
    try {
        const { unidade_id } = req.params
        if (!unidade_id) {
            res.status(400).json({ message: 'ID da unidade é obrigatório' })
            return
        }

    const [rows] = await pool.query<RowDataPacket[]>(
            `
      SELECT 
                p.*, 
                usr_responsavel.nome AS responsavel_nome, 
                usr_responsavel.sobrenome AS responsavel_sobrenome, 
                usr_indicacao.nome AS indicacao_nome, 
                usr_indicacao.sobrenome AS indicacao_sobrenome, 
                e.razao_social AS empresa_razaoSocial,
                e.nome_fantasia AS empresa_nome,
                e.cnpj AS empresa_cnpj,
                e.cidade AS empresa_cidade,
                e.contabilidade AS empresa_contabilidade,
                e.telefone AS empresa_telefone,
                e.email AS empresa_email
            FROM 
                propostas p
            LEFT JOIN usuarios usr_responsavel ON p.responsavel_id = usr_responsavel.id
            LEFT JOIN usuarios usr_indicacao ON p.indicacao_id = usr_indicacao.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE p.unidade_id = ?
            ORDER BY p.data ASC
      `,
            [unidade_id]
        )

        const proposals = (rows || []).map((r: any) => {
            const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const indic = [r.indicacao_nome, r.indicacao_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const empresaNome = r.empresa_nome || r.empresa_razaoSocial || null
            const createdAt = r.data ? (r.data instanceof Date ? r.data.toISOString() : String(r.data)) : undefined
            const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                status: r.status,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                titulo: r.titulo ?? undefined,
                responsavel: resp,
                indicacao: indic,
                empresa: {
                    nome: r.empresa_nome ?? undefined,
                    razaoSocial: r.empresa_razaoSocial ?? undefined,
                    cnpj: r.empresa_cnpj ?? undefined,
                    cidade: r.empresa_cidade ?? undefined,
                    contabilidade: r.empresa_contabilidade ?? undefined,
                    telefone: r.empresa_telefone ?? undefined,
                    email: r.empresa_email ?? undefined,
                }
            }
        })

        res.status(200).json({ proposals })
    } catch (error) {
        console.error('Erro ao buscar propostas por unidade:', error)
        res.status(500).json({ proposals: [] })
    }
}

export default { getProposalsByUser, getProposalsByUnidade }
