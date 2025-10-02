import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { RowDataPacket, OkPacket } from 'mysql2'
import pool from '../config/db'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'
import { createNotification } from '../services/notificationService'
import { getIO } from '../realtime'
import type { Request as ExpressRequest } from 'express'
import { PUBLIC_UPLOADS_DIR } from '../middleware/upload'
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

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
                e.email AS empresa_email,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                                (SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id) AS programa_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                ) AS total_itens
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
            const updatedAt = r.ultima_alteracao ? (r.ultima_alteracao instanceof Date ? r.ultima_alteracao.toISOString() : String(r.ultima_alteracao)) : (r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined)
            const cursoTotal = Number(r.curso_total ?? 0)
            const quimicoTotal = Number(r.quimico_total ?? 0)
            const produtoTotal = Number(r.produto_total ?? 0)
            const programaTotal = Number(r.programa_total ?? 0)
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal + programaTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
                payment_method: r.payment_method ?? undefined,
                payment_installments: r.payment_installments != null ? Number(r.payment_installments) : undefined,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                responsavel_id: r.responsavel_id ?? undefined,
                indicacao_id: r.indicacao_id ?? undefined,
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
                e.email AS empresa_email,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                                (SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id) AS programa_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                ) AS total_itens
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
            const cursoTotal = Number(r.curso_total ?? 0)
            const quimicoTotal = Number(r.quimico_total ?? 0)
            const produtoTotal = Number(r.produto_total ?? 0)
            const programaTotal = Number(r.programa_total ?? 0)
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal + programaTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
                payment_method: r.payment_method ?? undefined,
                payment_installments: r.payment_installments != null ? Number(r.payment_installments) : undefined,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                responsavel_id: r.responsavel_id ?? undefined,
                indicacao_id: r.indicacao_id ?? undefined,
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

// Helper to build date range for current month and previous month
function getMonthRanges() {
    const now = new Date()
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1)
    const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endPrev = startCurrent
    return { startCurrent, startNext, startPrev, endPrev }
}

function normalizeStatus(input: string): string {
    if (!input) return ''
    const s = input
        .toString()
        .toLowerCase()
        .normalize('NFD')
        // Remove diacritics
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    // Common synonyms/variants
    if (s.includes('analise')) return 'analise'
    if (s.includes('andamento') || s.includes('progresso')) return 'andamento'
    if (s.includes('pendente') || s.includes('aguardando')) return 'pendente'
    return s
}

export const getProposalStats = async (
    req: Request<{}, {}, {}, { userId?: string; unidadeId?: string }>,
    res: Response
): Promise<void> => {
    try {
        const { userId, unidadeId } = req.query
        const filters: string[] = []
        const params: any[] = []
        if (userId) { filters.push('p.responsavel_id = ?'); params.push(Number(userId)) }
        if (unidadeId) { filters.push('p.unidade_id = ?'); params.push(Number(unidadeId)) }

        const whereBase = filters.length ? `AND ${filters.join(' AND ')}` : ''
        const { startCurrent, startNext, startPrev, endPrev } = getMonthRanges()

        // We consider p.data as the proposal creation date based on existing queries
        const sql = `
            SELECT status, period, COUNT(*) as cnt FROM (
                SELECT p.status as status, 'current' as period
                FROM propostas p
                WHERE p.data >= ? AND p.data < ?
                ${whereBase}
                UNION ALL
                SELECT p.status as status, 'previous' as period
                FROM propostas p
                WHERE p.data >= ? AND p.data < ?
                ${whereBase}
            ) t
            GROUP BY status, period
        `

        const queryParams = [
            // current month first select
            startCurrent, startNext,
            ...params,
            // previous month second select
            startPrev, endPrev,
            ...params,
        ]

    const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams)

        // Aggregate counts
        const totalByStatus: Record<string, number> = {}
        const currentMap: Record<string, number> = {}
        const prevMap: Record<string, number> = {}

        for (const r of rows as any[]) {
            const s = normalizeStatus(r.status ?? '')
            const period = r.period
            const cnt = Number(r.cnt) || 0
            if (period === 'current') currentMap[s] = (currentMap[s] || 0) + cnt
            else if (period === 'previous') prevMap[s] = (prevMap[s] || 0) + cnt
        }

        // normalize keys that appear in UI
        const statuses = new Set<string>([...Object.keys(currentMap), ...Object.keys(prevMap)])
        const trendByStatus: Record<string, { current: number; previous: number; diff: number; percent: number }> = {}
        statuses.forEach((s) => {
            const current = currentMap[s] || 0
            const previous = prevMap[s] || 0
            totalByStatus[s] = current
            const diff = current - previous
            const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((diff / previous) * 100)
            trendByStatus[s] = { current, previous, diff, percent }
        })

        // Created proposals (by p.data): sum across statuses for each period
        const createdCurrent = Object.values(currentMap).reduce((a, b) => a + b, 0)
        const createdPrevious = Object.values(prevMap).reduce((a, b) => a + b, 0)
        const createdDiff = createdCurrent - createdPrevious
        const createdPercent = createdPrevious === 0 ? (createdCurrent > 0 ? 100 : 0) : Math.round((createdDiff / createdPrevious) * 100)

        // Approved proposals (by p.data_alteracao) and approved-like statuses
        const approvedSql = `
            SELECT 'current' AS period, COUNT(*) AS cnt
            FROM propostas p
            WHERE p.data_alteracao IS NOT NULL
              AND p.data_alteracao >= ? AND p.data_alteracao < ?
              ${whereBase}
              AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
            UNION ALL
            SELECT 'previous' AS period, COUNT(*) AS cnt
            FROM propostas p
            WHERE p.data_alteracao IS NOT NULL
              AND p.data_alteracao >= ? AND p.data_alteracao < ?
              ${whereBase}
              AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
        `
        const approvedParams = [
            // current window
            startCurrent, startNext,
            ...params,
            // previous window
            startPrev, endPrev,
            ...params,
        ]
        const [approvedRows] = await pool.query<RowDataPacket[]>(approvedSql, approvedParams)
        let approvedCurrent = 0, approvedPrevious = 0
        for (const r of approvedRows as any[]) {
            const cnt = Number(r.cnt) || 0
            if (r.period === 'current') approvedCurrent += cnt
            else if (r.period === 'previous') approvedPrevious += cnt
        }
        const approvedDiff = approvedCurrent - approvedPrevious
        const approvedPercent = approvedPrevious === 0 ? (approvedCurrent > 0 ? 100 : 0) : Math.round((approvedDiff / approvedPrevious) * 100)

                // Approved total value (sum of cursos, quimicos, produtos, programas) in current vs previous month
        const approvedValueSql = `
            SELECT period, SUM(total_valor) AS total
            FROM (
                SELECT 'current' AS period,
                    (
                        COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                      + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                            + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                            + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                    ) AS total_valor
                FROM propostas p
                WHERE p.data_alteracao IS NOT NULL
                  AND p.data_alteracao >= ? AND p.data_alteracao < ?
                  ${whereBase}
                  AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
                UNION ALL
                SELECT 'previous' AS period,
                    (
                        COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                      + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                            + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                            + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                    ) AS total_valor
                FROM propostas p
                WHERE p.data_alteracao IS NOT NULL
                  AND p.data_alteracao >= ? AND p.data_alteracao < ?
                  ${whereBase}
                  AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
            ) x
            GROUP BY period
        `
        const approvedValueParams = [
            startCurrent, startNext,
            ...params,
            startPrev, endPrev,
            ...params,
        ]
        const [approvedValueRows] = await pool.query<RowDataPacket[]>(approvedValueSql, approvedValueParams)
        let approvedValueCurrent = 0, approvedValuePrevious = 0
        for (const r of approvedValueRows as any[]) {
            const total = Number(r.total) || 0
            if (r.period === 'current') approvedValueCurrent += total
            else if (r.period === 'previous') approvedValuePrevious += total
        }
        const approvedValueDiff = approvedValueCurrent - approvedValuePrevious
        const approvedValuePercent = approvedValuePrevious === 0 ? (approvedValueCurrent > 0 ? 100 : 0) : Math.round((approvedValueDiff / approvedValuePrevious) * 100)

        // Commission (only if userId provided)
        let commissionCurrent = 0, commissionPrevious = 0
        if (userId) {
            const uid = Number(userId)
            const commissionSql = `
                SELECT period, SUM(val) AS total
                FROM (
                    SELECT 'current' AS period,
                        (
                            (
                                CASE WHEN p.responsavel_id = ? THEN 0.05 ELSE 0 END
                              + CASE WHEN p.indicacao_id = ? THEN 0.02 ELSE 0 END
                                                        ) * (
                                COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                              + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                                            + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                                            + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                            )
                        ) AS val
                    FROM propostas p
                    WHERE p.data_alteracao IS NOT NULL
                      AND p.data_alteracao >= ? AND p.data_alteracao < ?
                      AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
                      AND (p.responsavel_id = ? OR p.indicacao_id = ?)
                    UNION ALL
                    SELECT 'previous' AS period,
                        (
                            (
                                CASE WHEN p.responsavel_id = ? THEN 0.05 ELSE 0 END
                              + CASE WHEN p.indicacao_id = ? THEN 0.02 ELSE 0 END
                                                        ) * (
                                COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                              + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                                            + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                                            + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                            )
                        ) AS val
                    FROM propostas p
                    WHERE p.data_alteracao IS NOT NULL
                      AND p.data_alteracao >= ? AND p.data_alteracao < ?
                      AND TRIM(LOWER(p.status)) LIKE 'aprovad%'
                      AND (p.responsavel_id = ? OR p.indicacao_id = ?)
                ) c
                GROUP BY period
            `
            const commissionParams = [
                // current period
                uid, uid,
                startCurrent, startNext,
                uid, uid,
                // previous period
                uid, uid,
                startPrev, endPrev,
                uid, uid,
            ]
            const [commissionRows] = await pool.query<RowDataPacket[]>(commissionSql, commissionParams)
            for (const r of commissionRows as any[]) {
                const total = Number(r.total) || 0
                if (r.period === 'current') commissionCurrent += total
                else if (r.period === 'previous') commissionPrevious += total
            }
        }
        const commissionDiff = commissionCurrent - commissionPrevious
        const commissionPercent = commissionPrevious === 0 ? (commissionCurrent > 0 ? 100 : 0) : Math.round((commissionDiff / commissionPrevious) * 100)

        res.status(200).json({
            period: 'month',
            totalByStatus,
            trendByStatus,
            created: { current: createdCurrent, previous: createdPrevious, diff: createdDiff, percent: createdPercent },
            approved: { current: approvedCurrent, previous: approvedPrevious, diff: approvedDiff, percent: approvedPercent },
            approvedValue: { current: approvedValueCurrent, previous: approvedValuePrevious, diff: approvedValueDiff, percent: approvedValuePercent },
            commission: { current: commissionCurrent, previous: commissionPrevious, diff: commissionDiff, percent: commissionPercent },
        })
    } catch (error) {
        console.error('Erro ao calcular estatísticas de propostas:', error)
        res.status(500).json({ totalByStatus: {}, trendByStatus: {}, period: 'month', created: { current: 0, previous: 0, diff: 0, percent: 0 }, approved: { current: 0, previous: 0, diff: 0, percent: 0 }, approvedValue: { current: 0, previous: 0, diff: 0, percent: 0 }, commission: { current: 0, previous: 0, diff: 0, percent: 0 } })
    }
}

export default { getProposalsByUser, getProposalsByUnidade, getProposalStats }


// Named export default updated
export { }
// Proposals by company
export const getProposalsByEmpresa = async (
    req: Request<{ empresa_id: string }>,
    res: Response
): Promise<void> => {
    try {
        const { empresa_id } = req.params
        if (!empresa_id) {
            res.status(400).json({ message: 'ID da empresa é obrigatório' })
            return
        }
        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                p.*, 
                usr_responsavel.nome AS responsavel_nome, 
                usr_responsavel.sobrenome AS responsavel_sobrenome, 
                e.nome_fantasia AS empresa_nome,
                e.razao_social AS empresa_razaoSocial,
                e.cnpj AS empresa_cnpj,
                e.cidade AS empresa_cidade,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                (SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id) AS programa_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                ) AS total_itens
            FROM 
                propostas p
            LEFT JOIN usuarios usr_responsavel ON p.responsavel_id = usr_responsavel.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE p.empresa_id = ?
            ORDER BY p.data ASC
            `,
            [empresa_id]
        )

    const proposals = (rows || []).map((r: any) => {
            const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const empresaNome = r.empresa_nome || r.empresa_razaoSocial || null
            const createdAt = r.data ? (r.data instanceof Date ? r.data.toISOString() : String(r.data)) : undefined
            const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
            const cursoTotal = Number(r.curso_total ?? 0)
            const quimicoTotal = Number(r.quimico_total ?? 0)
            const produtoTotal = Number(r.produto_total ?? 0)
            const programaTotal = Number(r.programa_total ?? 0)
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal + programaTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
                payment_method: r.payment_method ?? undefined,
                payment_installments: r.payment_installments != null ? Number(r.payment_installments) : undefined,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                responsavel_id: r.responsavel_id ?? undefined,
                titulo: r.titulo ?? undefined,
                responsavel: resp,
            }
        })

        res.status(200).json({ proposals })
    } catch (error) {
        console.error('Erro ao buscar propostas por empresa:', error)
        res.status(500).json({ proposals: [] })
    }
}
// Export proposal to DOCX
export const exportProposalDocx = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        // Fetch proposal header details
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
            WHERE p.id = ?
            LIMIT 1
            `,
            [id]
        )

        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Proposta não encontrada' })
            return
        }
        const r: any = rows[0]

        // Fetch linked items
        const [[cursos], [quimicos], [produtos], [programas]] = await Promise.all([
            pool.query<RowDataPacket[]>(
                `SELECT pc.*, c.nome AS curso_nome FROM propostas_cursos pc JOIN cursos c ON pc.curso_id = c.id WHERE pc.proposta_id = ? ORDER BY pc.id ASC`,
                [id]
            ),
            pool.query<RowDataPacket[]>(
                `SELECT * FROM propostas_quimicos WHERE proposta_id = ? ORDER BY id ASC`,
                [id]
            ),
            pool.query<RowDataPacket[]>(
                `SELECT pp.*, p.nome AS produto_nome FROM propostas_produtos pp JOIN produtos p ON pp.produto_id = p.id WHERE pp.proposta_id = ? ORDER BY pp.id ASC`,
                [id]
            ),
            pool.query<RowDataPacket[]>(
                `SELECT pp.*, p.nome AS programa_nome FROM propostas_programas pp JOIN programas_prevencao p ON pp.programa_id = p.id WHERE pp.proposta_id = ? ORDER BY pp.id ASC`,
                [id]
            ),
        ])

        const fmtBRL = (n: number | null | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0))
        const formatCNPJ = (value: any) => {
            const digits = String(value || '').replace(/\D/g, '')
            if (digits.length !== 14) return String(value || '')
            return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        }
        const cliente = r.empresa_nome || r.empresa_razaoSocial || '-'
        const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim()
        const indic = [r.indicacao_nome, r.indicacao_sobrenome].filter(Boolean).join(' ').trim()
        const dataStr = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : ''
        const empresaData = {
            cnpj: r.empresa_cnpj || '',
            cnpj_fmt: formatCNPJ(r.empresa_cnpj || ''),
            cidade: r.empresa_cidade || '',
            razaoSocial: r.empresa_razaoSocial || '',
            razao_social: r.empresa_razaoSocial || '',
            nomeFantasia: r.empresa_nome || '',
            nome_fantasia: r.empresa_nome || '',
            // alias commonly used in templates
            nome: r.empresa_nome || r.empresa_razaoSocial || '',
            telefone: r.empresa_telefone || '',
            email: r.empresa_email || '',
            contabilidade: r.empresa_contabilidade || '',
        }

        const programasTpl = (programas as any[]).map(p => ({
            programa_nome: String(p.programa_nome || p.programa_id),
            quantidade: Number(p.quantidade ?? 0),
            valor_unitario: Number(p.valor_unitario || 0),
            valor_unitario_fmt: fmtBRL(p.valor_unitario),
            valor_total: Number(p.valor_total || 0),
            valor_total_fmt: fmtBRL(p.valor_total),
        }))
        const cursosTpl = (cursos as any[]).map(c => ({
            curso_nome: String(c.curso_nome || c.curso_id),
            quantidade: Number(c.quantidade ?? 0),
            valor_unitario: Number(c.valor_unitario || 0),
            valor_unitario_fmt: fmtBRL(c.valor_unitario),
            valor_total: Number(c.valor_total || 0),
            valor_total_fmt: fmtBRL(c.valor_total),
        }))
        const quimicosTpl = (quimicos as any[]).map(q => ({
            grupo: String(q.grupo || q.descricao || '—'),
            pontos: Number(q.pontos ?? 0),
            valor_unitario: Number(q.valor_unitario || 0),
            valor_unitario_fmt: fmtBRL(q.valor_unitario),
            valor_total: Number(q.valor_total || 0),
            valor_total_fmt: fmtBRL(q.valor_total),
        }))
        const produtosTpl = (produtos as any[]).map(p => ({
            produto_nome: String(p.produto_nome || p.produto_id),
            quantidade: Number(p.quantidade ?? 0),
            valor_unitario: Number(p.valor_unitario || 0),
            valor_unitario_fmt: fmtBRL(p.valor_unitario),
            valor_total: Number(p.valor_total || 0),
            valor_total_fmt: fmtBRL(p.valor_total),
        }))

        // Unified items array (programas + quimicos + produtos) with normalized fields for table rendering
        const itensTpl = [
            ...programasTpl.map(p => ({
                tipo: 'Programa',
                nome: p.programa_nome,
                qtd_ou_pontos: String(p.quantidade),
                valor_unitario_fmt: p.valor_unitario_fmt,
                valor_total_fmt: p.valor_total_fmt,
            })),
            ...quimicosTpl.map(q => ({
                tipo: 'Químico',
                nome: q.grupo,
                qtd_ou_pontos: String(q.pontos),
                valor_unitario_fmt: q.valor_unitario_fmt,
                valor_total_fmt: q.valor_total_fmt,
            })),
            ...produtosTpl.map(p => ({
                tipo: 'Produto',
                nome: p.produto_nome,
                qtd_ou_pontos: String(p.quantidade),
                valor_unitario_fmt: p.valor_unitario_fmt,
                valor_total_fmt: p.valor_total_fmt,
            })),
        ]

        const totalProgramas = programasTpl.reduce((a, b) => a + Number(b.valor_total || 0), 0)
        const totalCursos = cursosTpl.reduce((a, b) => a + Number(b.valor_total || 0), 0)
        const totalQuimicos = quimicosTpl.reduce((a, b) => a + Number(b.valor_total || 0), 0)
        const totalProdutos = produtosTpl.reduce((a, b) => a + Number(b.valor_total || 0), 0)
        const totalGeral = totalProgramas + totalCursos + totalQuimicos + totalProdutos

    // Conditional wrapper arrays to allow hiding whole sections (tables) without plugins
    const programasBlock = programasTpl.length > 0 ? [1] : []
    const cursosBlock = cursosTpl.length > 0 ? [1] : []
    const quimicosBlock = quimicosTpl.length > 0 ? [1] : []
    const produtosBlock = produtosTpl.length > 0 ? [1] : []

        // Try multiple template locations to support ts-node (src) and build (dist) runs
        const candidateTemplatePaths = [
            path.resolve(__dirname, '..', 'templates', 'proposal.docx'),
            path.resolve(__dirname, '../..', 'templates', 'proposal.docx'),
            path.resolve(process.cwd(), 'server', 'templates', 'proposal.docx'),
        ]
        let templateBuffer: Buffer | null = null
        for (const pth of candidateTemplatePaths) {
            try {
                if (fs.existsSync(pth)) {
                    templateBuffer = fs.readFileSync(pth)
                    break
                }
            } catch {}
        }

        if (templateBuffer) {
            const zip = new PizZip(templateBuffer)
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                // If a tag is missing, render it as empty string instead of 'undefined'
                nullGetter() { return '' },
            })
            const templateData = {
                proposta: {
                    id,
                    titulo: r.titulo || '',
                    cliente,
                    status: String(r.status || ''),
                    data: dataStr,
                    responsavel: resp || '—',
                    indicacao: indic || '—',
                },
                empresa: empresaData,
                itens: itensTpl,
                // Section wrapper arrays (render once when list has items, hide entirely when empty)
                programas_block: programasBlock,
                cursos_block: cursosBlock,
                quimicos_block: quimicosBlock,
                produtos_block: produtosBlock,
                // Flat aliases for convenience (allow using {cliente}, {data}, {empresa_cnpj}, ...)
                id,
                titulo: r.titulo || '',
                cliente,
                status: String(r.status || ''),
                data: dataStr,
                responsavel: resp || '—',
                indicacao: indic || '—',
                empresa_cnpj: empresaData.cnpj,
                empresa_cnpj_fmt: empresaData.cnpj_fmt,
                empresa_cidade: empresaData.cidade,
                empresa_razaoSocial: empresaData.razaoSocial,
                empresa_razao_social: empresaData.razao_social,
                empresa_nomeFantasia: empresaData.nomeFantasia,
                empresa_nome_fantasia: empresaData.nome_fantasia,
                empresa_nome: empresaData.nome,
                empresa_telefone: empresaData.telefone,
                empresa_email: empresaData.email,
                empresa_contabilidade: empresaData.contabilidade,
                programas: programasTpl,
                cursos: cursosTpl,
                quimicos: quimicosTpl,
                produtos: produtosTpl,
                totais: {
                    programas: totalProgramas,
                    programas_fmt: fmtBRL(totalProgramas),
                    cursos: totalCursos,
                    cursos_fmt: fmtBRL(totalCursos),
                    quimicos: totalQuimicos,
                    quimicos_fmt: fmtBRL(totalQuimicos),
                    produtos: totalProdutos,
                    produtos_fmt: fmtBRL(totalProdutos),
                    geral: totalGeral,
                    geral_fmt: fmtBRL(totalGeral),
                },
            }
            try {
                doc.render(templateData)
            } catch (e: any) {
                const details = e?.properties?.errors ? JSON.stringify(e.properties.errors, null, 2) : undefined
                console.error('Erro ao renderizar template DOCX:', e?.message || e)
                if (details) console.error('Detalhes do template DOCX:', details)
                res.status(500).json({ message: 'Erro ao processar template DOCX', error: e?.message, details })
                return
            }
            const out = doc.getZip().generate({ type: 'nodebuffer' })
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            res.setHeader('Content-Disposition', `attachment; filename=\"Proposta-${id}.docx\"`)
            res.status(200).send(out)
            return
        }

        // Fallback: minimal programmatic doc if template missing
        const headerLines: Paragraph[] = []
        headerLines.push(new Paragraph({ text: `Proposta #${r.id}`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }))
        headerLines.push(new Paragraph({ text: r.titulo ? String(r.titulo) : '', spacing: { after: 200 }, alignment: AlignmentType.CENTER }))
        const infoPairs: Array<[string, string]> = [
            ['Cliente', cliente],
            ['Razão Social', empresaData.razaoSocial || '—'],
            ['Nome Fantasia', empresaData.nomeFantasia || '—'],
            ['CNPJ', empresaData.cnpj_fmt || empresaData.cnpj || '—'],
            ['Cidade', empresaData.cidade || '—'],
            ['Status', String(r.status || '')],
            ['Data', dataStr],
            ['Responsável', resp || '—'],
            ['Indicação', indic || '—'],
        ]
        infoPairs.forEach(([k, v]) => { headerLines.push(new Paragraph({ children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun({ text: v || '—' })] })) })
        const makeTable = (headers: string[], rows: Array<string[]>): Table => {
            const headerRow = new TableRow({ children: headers.map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) })
            const bodyRows = rows.map((r) => new TableRow({ children: r.map((cell) => new TableCell({ children: [new Paragraph(String(cell))] })) }))
            return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] })
        }
        const content: (Paragraph | Table)[] = []
        if (programasTpl.length) {
            const rows = programasTpl.map(p => [p.programa_nome, String(p.quantidade), p.valor_unitario_fmt, p.valor_total_fmt])
            rows.push(['Total', '', '', fmtBRL(totalProgramas)])
            content.push(makeTable(['Nome', 'Qtd', 'Valor Unit. (mês)', 'Valor Total (anual)'], rows))
        }
        if (cursosTpl.length) {
            const rows = cursosTpl.map(c => [c.curso_nome, String(c.quantidade), c.valor_unitario_fmt, c.valor_total_fmt])
            rows.push(['Total', '', '', fmtBRL(totalCursos)])
            content.push(makeTable(['Nome', 'Qtd', 'Valor Unit.', 'Valor Total'], rows))
        }
        if (quimicosTpl.length) {
            const rows = quimicosTpl.map(q => [q.grupo, String(q.pontos), q.valor_unitario_fmt, q.valor_total_fmt])
            rows.push(['Total', '', '', fmtBRL(totalQuimicos)])
            content.push(makeTable(['Grupo', 'Pontos', 'Valor Unit.', 'Valor Total'], rows))
        }
        if (produtosTpl.length) {
            const rows = produtosTpl.map(p => [p.produto_nome, String(p.quantidade), p.valor_unitario_fmt, p.valor_total_fmt])
            rows.push(['Total', '', '', fmtBRL(totalProdutos)])
            content.push(makeTable(['Nome', 'Qtd', 'Valor Unit.', 'Valor Total'], rows))
        }
        content.push(new Paragraph({
            children: [new TextRun({ text: 'Valor Total da Proposta: ', bold: true }), new TextRun({ text: fmtBRL(totalGeral) })],
        }))
        const fallbackDoc = new Document({ sections: [{ properties: {}, children: [...headerLines, new Paragraph({ text: '' }), ...content] }] })
        const buffer = await Packer.toBuffer(fallbackDoc)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename=\"Proposta-${id}.docx\"`)
        res.status(200).send(buffer)
    } catch (error) {
        console.error('Erro ao exportar proposta para DOCX:', error)
        res.status(500).json({ message: 'Erro ao exportar proposta para DOCX' })
    }
}

// Create a new proposal
export const createProposal = async (
    req: Request<{}, {}, {
        titulo?: string
        empresa_id: number
        unidade_id: number
        responsavel_id?: number
        indicacao_id?: number | null
        data?: string | null
        status?: string | null
        observacoes?: string | null
    }>,
    res: Response
): Promise<void> => {
    try {
        // Extract actor
        let actorId: number | null = null
        const authHeader = req.headers && (req.headers.authorization as string | undefined)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            try {
                const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                actorId = payload?.userId ?? payload?.id ?? null
            } catch {}
        }
        if (!actorId) {
            res.status(401).json({ message: 'Não autenticado' })
            return
        }

        const { titulo, empresa_id, unidade_id, responsavel_id, indicacao_id, data, status, observacoes } = req.body || ({} as any)
        if (!empresa_id || !unidade_id) {
            res.status(400).json({ message: 'empresa_id e unidade_id são obrigatórios' })
            return
        }
        const normalizedStatus = normalizeIncomingStatus(status) || 'pendente'
        const respId = Number(responsavel_id || actorId)
        const dataElab = data ? new Date(data) : new Date()

        const conn = await pool.getConnection()
        let newId: number | null = null
        try {
            await conn.beginTransaction()
            const [ins] = await conn.query<OkPacket>(
                `INSERT INTO propostas (titulo, empresa_id, unidade_id, responsavel_id, indicacao_id, status, data)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [titulo || null, empresa_id, unidade_id, respId, (indicacao_id ?? null), normalizedStatus, dataElab]
            )
            newId = (ins as any).insertId

            // Insert history 'criar'
            try {
                const novo_valor = JSON.stringify({ status: normalizedStatus, titulo: titulo || null })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'criar', NULL, ?, ?, NOW())`,
                    [newId, actorId, novo_valor, observacoes || null]
                )
            } catch (histErr) {
                console.warn('Falha ao registrar histórico (criar):', histErr)
            }

            await conn.commit()
        } catch (err) {
            await conn.rollback()
            throw err
        } finally {
            conn.release()
        }

        if (!newId) {
            res.status(500).json({ message: 'Falha ao criar proposta' })
            return
        }

        // Return created proposal using getProposalById shape
        req.params = { id: String(newId) } as any
        await getProposalById(req as any, res)
    } catch (error) {
        console.error('Erro ao criar proposta:', error)
        res.status(500).json({ message: 'Erro ao criar proposta' })
    }
}

// Normalize and validate status updates
function normalizeIncomingStatus(input?: string | null): string | null {
    if (!input) return null
    const s = input
        .toString()
        .toLowerCase()
        .normalize('NFD')
        // Remove diacritics (safer than Unicode property escapes across runtimes)
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    if (s === 'progress') return 'andamento'
    if (s.startsWith('analise')) return 'analise'
    if (s.startsWith('aprovad')) return 'aprovada'
    if (s.startsWith('rejeit') || s.startsWith('recus')) return 'rejeitada'
    if (s.startsWith('pend')) return 'pendente'
    // fallback to raw (no diacritics)
    return s
}

export const updateProposalStatus = async (
    req: Request<{ id: string }, {}, { status?: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }
        // Extract actor from Authorization: Bearer <token>
        let actorId: number | null = null
        let actorCargoId: number | null = null
        const authHeader = req.headers && (req.headers.authorization as string | undefined)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            try {
                const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                actorId = payload?.userId ?? payload?.id ?? null
                actorCargoId = payload?.cargoId ?? null
            } catch (e) {
                console.warn('JWT inválido ao atualizar status da proposta:', e)
            }
        }
        if (!actorId) {
            res.status(401).json({ message: 'Não autenticado' })
            return
        }

        // Fetch current proposal to validate permission and build history
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, status, responsavel_id FROM propostas WHERE id = ? LIMIT 1`,
            [id]
        )
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Proposta não encontrada' })
            return
        }
        const current = rows[0] as any

        const statusRaw = req.body?.status ?? ''
        const status = normalizeIncomingStatus(statusRaw)
        const allowed = new Set(['pendente', 'andamento', 'analise', 'rejeitada', 'aprovada'])
        if (!status || !allowed.has(status)) {
            res.status(400).json({ message: 'Status inválido' })
            return
        }
        // Permission: only admins or the responsible can update
        const isAdmin = (cid: any) => [1, 2, 3].includes(Number(cid))
        const isResponsible = Number(current.responsavel_id) === Number(actorId)
        if (!(isAdmin(actorCargoId) || isResponsible)) {
            res.status(403).json({ message: 'Sem permissão para alterar status desta proposta' })
            return
        }

        const conn = await pool.getConnection()
        try {
            await conn.beginTransaction()
            await conn.query<OkPacket>(
                `UPDATE propostas SET status = ?, data_alteracao = NOW() WHERE id = ?`,
                [status, id]
            )

            // Try to insert history (if table exists)
            try {
                const acao = status === 'aprovada' ? 'aprovar' : status === 'rejeitada' ? 'rejeitar' : 'atualizar_status'
                const valor_anterior = JSON.stringify({ status: current.status })
                const novo_valor = JSON.stringify({ status })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, ?, ?, ?, NULL, NOW())`,
                    [id, actorId, acao, valor_anterior, novo_valor]
                )
            } catch (histErr) {
                console.warn('Falha ao registrar histórico de proposta (ignorado):', histErr)
            }

            await conn.commit()
        } catch (txErr) {
            await conn.rollback()
            throw txErr
        } finally {
            conn.release()
        }

        res.status(200).json({ id, status, dataAlteracao: new Date().toISOString() })

        // If approved, notify indication user (indicacao_id) if exists and not same as actor
        if (status === 'aprovada') {
            try {
                const [prRows] = await pool.query<RowDataPacket[]>(`SELECT indicacao_id FROM propostas WHERE id = ?`, [id])
                const indicId = (prRows as any[])[0]?.indicacao_id
                if (indicId && Number(indicId) !== Number(actorId)) {
                    const notif = await createNotification({
                        user_id: Number(indicId),
                        actor_id: actorId ? Number(actorId) : null,
                        type: 'proposal_approved',
                        body: 'Uma proposta indicada por você foi aprovada',
                        entity_type: 'proposal',
                        entity_id: id,
                        metadata: { proposta_id: id, link: `/comercial/proposta/${id}` },
                    })
                    const legacyPayload = {
                        id: notif.id,
                        user_id: notif.user_id,
                        type: notif.type,
                        entity: notif.entity_type,
                        entity_id: notif.entity_id,
                        message: notif.body,
                        metadata: notif.metadata,
                        created_at: notif.created_at,
                        read_at: notif.read_at,
                    }
                    try { getIO().to(`user:${indicId}`).emit('notification:new', legacyPayload) } catch {}
                }
            } catch (e) { console.warn('Falha ao notificar aprovação de proposta:', e) }
        }
    } catch (error) {
        console.error('Erro ao atualizar status da proposta:', error)
        res.status(500).json({ message: 'Erro ao atualizar status' })
    }
}

// Retorna histórico de mudanças da proposta
export const getProposalHistory = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }
        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT
                h.id,
                h.acao,
                h.observacoes,
                h.data_alteracao,
                u.id AS actor_id,
                u.nome AS actor_nome,
                u.sobrenome AS actor_sobrenome,
                u.foto_url AS actor_foto,
                JSON_UNQUOTE(JSON_EXTRACT(h.valor_anterior, '$.status')) AS anterior_status,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.status')) AS novo_status,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.tipo')) AS novo_tipo,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.curso_id')) AS novo_curso_id,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.curso_nome')) AS novo_curso_nome,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.grupo')) AS novo_grupo,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.produto_id')) AS novo_produto_id,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.produto_nome')) AS novo_produto_nome,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.programa_id')) AS novo_programa_id,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.programa_nome')) AS novo_programa_nome,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.quantidade')) AS novo_quantidade,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.pontos')) AS novo_pontos,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.valor_unitario')) AS novo_valor_unitario,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.desconto')) AS novo_desconto,
                JSON_UNQUOTE(JSON_EXTRACT(h.novo_valor, '$.valor_total')) AS novo_valor_total
            FROM historico_alteracoes h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.proposta_id = ?
            ORDER BY h.data_alteracao DESC
            `,
            [id]
        )
        const mapped = (rows as any[]).map(r => ({
            id: r.id,
            acao: r.acao,
            observacoes: r.observacoes,
            data_alteracao: r.data_alteracao,
            actor: r.actor_id ? { id: r.actor_id, nome: r.actor_nome, sobrenome: r.actor_sobrenome, foto: r.actor_foto } : null,
            anterior: { status: r.anterior_status || null },
            novo: {
                status: r.novo_status || null,
                tipo: r.novo_tipo || null,
                curso_id: r.novo_curso_id ? Number(r.novo_curso_id) : undefined,
                curso_nome: r.novo_curso_nome || undefined,
                grupo: r.novo_grupo || undefined,
                produto_id: r.novo_produto_id ? Number(r.novo_produto_id) : undefined,
                produto_nome: r.novo_produto_nome || undefined,
                programa_id: r.novo_programa_id ? Number(r.novo_programa_id) : undefined,
                programa_nome: r.novo_programa_nome || undefined,
                quantidade: r.novo_quantidade != null ? Number(r.novo_quantidade) : undefined,
                pontos: r.novo_pontos != null ? Number(r.novo_pontos) : undefined,
                valor_unitario: r.novo_valor_unitario != null ? Number(r.novo_valor_unitario) : undefined,
                desconto: r.novo_desconto != null ? Number(r.novo_desconto) : undefined,
                valor_total: r.novo_valor_total != null ? Number(r.novo_valor_total) : undefined,
            },
        }))
        res.status(200).json(mapped)
    } catch (error) {
        console.error('Erro ao buscar histórico de proposta:', error)
        res.status(500).json({ message: 'Erro ao buscar histórico' })
    }
}

// Adiciona uma observação ao histórico da proposta
export const addProposalObservation = async (
    req: Request<{ id: string }, {}, { usuario_id?: number; observacoes?: string }>,
    res: Response
): Promise<void> => {
    try {
        const propostaId = Number(req.params.id)
        if (!propostaId || Number.isNaN(propostaId)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        const { usuario_id, observacoes } = (req.body || {}) as any
        const note = typeof observacoes === 'string' ? observacoes.trim() : ''
        if (!note) {
            res.status(400).json({ message: 'observações são obrigatórias' })
            return
        }

        // Identificar o ator pelo token ou pelo usuario_id do corpo
        let actorId: number | null = null
        const authHeader = req.headers && (req.headers.authorization as string | undefined)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            try {
                const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                actorId = payload?.userId ?? payload?.id ?? null
            } catch (e) {
                // token inválido, tenta fallback
            }
        }
        if (!actorId && typeof usuario_id === 'number' && !Number.isNaN(usuario_id)) {
            actorId = Number(usuario_id)
        }
        if (!actorId) {
            res.status(401).json({ message: 'Usuário autenticado é obrigatório para registrar observação' })
            return
        }

        // Insere apenas uma entrada no histórico com acao 'adicionar_observacao'
        const insertSql = `
            INSERT INTO historico_alteracoes
              (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
            VALUES (?, ?, 'adicionar_observacao', NULL, NULL, ?, NOW())
        `
        const [result] = await pool.query<OkPacket>(insertSql, [propostaId, actorId, note])

        res.status(201).json({ message: 'Observação adicionada com sucesso', id: (result as any)?.insertId })
    } catch (error) {
        console.error('Erro ao adicionar observação à proposta:', error)
        res.status(500).json({ message: 'Erro ao adicionar observação' })
    }
}

export const deleteProposal = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }
        // Attempt to fetch and unlink files from disk before deleting DB rows
        try {
            const [fileRows] = await pool.query<RowDataPacket[]>(`SELECT caminho FROM arquivos WHERE proposta_id = ?`, [id])
            for (const r of (fileRows as any[])) {
                const publicPath = String(r.caminho || '')
                if (publicPath && publicPath.startsWith('/uploads/')) {
                    const fileAbs = path.join(PUBLIC_UPLOADS_DIR, publicPath.replace('/uploads/', ''))
                    const resolved = path.resolve(fileAbs)
                    if (resolved.startsWith(PUBLIC_UPLOADS_DIR)) {
                        try { fs.unlinkSync(resolved) } catch {}
                    }
                }
            }
        } catch {}
        await pool.query('DELETE FROM propostas_cursos WHERE proposta_id = ?', [id])
        await pool.query('DELETE FROM propostas_quimicos WHERE proposta_id = ?', [id])
        await pool.query('DELETE FROM propostas_produtos WHERE proposta_id = ?', [id])
    await pool.query('DELETE FROM propostas_programas WHERE proposta_id = ?', [id])
        await pool.query('DELETE FROM historico_alteracoes WHERE proposta_id = ?', [id])
        await pool.query('DELETE FROM arquivos WHERE proposta_id = ?', [id])
        await pool.query('DELETE FROM propostas WHERE id = ?', [id])
        res.status(200).json({ id, deleted: true })
    } catch (error) {
        console.error('Erro ao deletar proposta:', error)
        res.status(500).json({ message: 'Erro ao deletar proposta' })
    }
}

// Get a single proposal by ID with joined info and computed totals
export const getProposalById = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
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
                e.email AS empresa_email,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                                (SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id) AS programa_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                                + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                ) AS total_itens
            FROM 
                propostas p
            LEFT JOIN usuarios usr_responsavel ON p.responsavel_id = usr_responsavel.id
            LEFT JOIN usuarios usr_indicacao ON p.indicacao_id = usr_indicacao.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE p.id = ?
            LIMIT 1
            `,
            [id]
        )

        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Proposta não encontrada' })
            return
        }

        const r: any = rows[0]
        const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || undefined
        const indic = [r.indicacao_nome, r.indicacao_sobrenome].filter(Boolean).join(' ').trim() || undefined
        const empresaNome = r.empresa_nome || r.empresa_razaoSocial || null
        const createdAt = r.data ? (r.data instanceof Date ? r.data.toISOString() : String(r.data)) : undefined
        const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
        const cursoTotal = Number(r.curso_total ?? 0)
        const quimicoTotal = Number(r.quimico_total ?? 0)
    const produtoTotal = Number(r.produto_total ?? 0)
    const programaTotal = Number(r.programa_total ?? 0)
    const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal + programaTotal))
        const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)

        const proposal = {
            id: r.id,
            cliente: empresaNome || '-',
            valor: r.valor ?? undefined,
            valor_total: valorTotal,
            status: r.status,
            payment_method: r.payment_method ?? undefined,
            payment_installments: r.payment_installments != null ? Number(r.payment_installments) : undefined,
            comissao: r.comissao ?? undefined,
            criadoEm: createdAt,
            dataAlteracao: updatedAt,
            unidade_id: r.unidade_id ?? undefined,
            responsavel_id: r.responsavel_id ?? undefined,
            indicacao_id: r.indicacao_id ?? undefined,
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

        res.status(200).json(proposal)
    } catch (error) {
        console.error('Erro ao buscar proposta por ID:', error)
        res.status(500).json({ message: 'Erro ao buscar proposta' })
    }
}

// List cursos vinculados à proposta
export const getCursosByProposal = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                pc.*, 
                c.nome AS curso_nome,
                c.descricao AS curso_descricao
            FROM propostas_cursos pc
            JOIN cursos c ON pc.curso_id = c.id
            WHERE pc.proposta_id = ?
            `,
            [id]
        )

        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar cursos por proposta:', error)
        res.status(500).json([])
    }
}

// List químicos vinculados à proposta
export const getQuimicosByProposal = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT *
            FROM propostas_quimicos
            WHERE proposta_id = ?
            `,
            [id]
        )

        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar químicos por proposta:', error)
        res.status(500).json([])
    }
}

// List produtos vinculados à proposta
export const getProdutosByProposal = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                pp.*, 
                p.nome AS produto_nome
            FROM propostas_produtos pp
            JOIN produtos p ON pp.produto_id = p.id
            WHERE pp.proposta_id = ?
            `,
            [id]
        )

        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar produtos por proposta:', error)
        res.status(500).json([])
    }
}

// Catalog endpoints
export const getCoursesCatalog = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM cursos ORDER BY nome ASC'
        )
        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar cursos:', error)
        res.status(500).json([])
    }
}

export const getChemicalsCatalog = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM tabela_quimicos'
        )
        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar químicos:', error)
        res.status(500).json([])
    }
}

export const getProductsCatalog = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM produtos ORDER BY nome ASC'
        )
        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar produtos:', error)
        res.status(500).json([])
    }
}

// Programs (Programas de Prevenção) catalog
export const getProgramsCatalog = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM programas_prevencao ORDER BY nome ASC'
        )
        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar programas de prevenção:', error)
        res.status(500).json([])
    }
}

export const getProductPriceRule = async (
    req: Request<{ produtoId: string }, {}, {}, { quantidade?: string }>,
    res: Response
): Promise<void> => {
    try {
        const produtoId = Number(req.params.produtoId)
        const quantidade = Number(req.query.quantidade ?? '0')
        if (!produtoId || Number.isNaN(produtoId) || Number.isNaN(quantidade)) {
            res.status(400).json({ message: 'Parâmetros inválidos' })
            return
        }
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT preco_linear, min_quantidade, max_quantidade, preco_unitario, preco_adicional
             FROM regras_preco_produtos
             WHERE produto_id = ?
               AND ? BETWEEN min_quantidade AND max_quantidade
             LIMIT 1`,
            [produtoId, quantidade]
        )
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Regra de preço não encontrada para o produto.' })
            return
        }
        res.status(200).json(rows[0])
    } catch (error) {
        console.error('Erro ao coletar preco do produto:', error)
        res.status(500).json({ message: 'Erro ao coletar preco do produto' })
    }
}

export const getProgramPriceRule = async (
    req: Request<{ programaId: string }, {}, {}, { quantidade?: string }>,
    res: Response
): Promise<void> => {
    try {
        const programaId = Number(req.params.programaId)
        const quantidade = Number(req.query.quantidade ?? '0')
        if (!programaId || Number.isNaN(programaId) || Number.isNaN(quantidade)) {
            res.status(400).json({ message: 'Parâmetros inválidos' })
            return
        }
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT preco_linear, min_quantidade, max_quantidade, preco_unitario, preco_adicional
             FROM regras_preco_programas
             WHERE programa_id = ?
               AND ? BETWEEN min_quantidade AND max_quantidade
             LIMIT 1`,
            [programaId, quantidade]
        )
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Regra de preço não encontrada para o programa.' })
            return
        }
        res.status(200).json(rows[0])
    } catch (error) {
        console.error('Erro ao coletar preco do programa:', error)
        res.status(500).json({ message: 'Erro ao coletar preco do programa' })
    }
}

// Insert item endpoints
export const addCourseToProposal = async (
    req: Request<{ id: string }, {}, { curso_id: number; quantidade: number; valor_unitario: number; desconto: number }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const { curso_id, quantidade, valor_unitario, desconto } = req.body || ({} as any)
    if (!propostaId || Number.isNaN(propostaId) || !curso_id) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const qtd = Number(quantidade ?? 0)
    const unit = Number(valor_unitario ?? 0)
    const desc = Number(desconto ?? 0)
    const valor_total = Math.max(0, qtd * unit - desc)
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [result] = await conn.query(
            `INSERT INTO propostas_cursos (proposta_id, curso_id, quantidade, valor_unitario, desconto, valor_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [propostaId, curso_id, qtd, unit, desc, valor_total]
        )
        // Return joined row
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pc.*, c.nome AS curso_nome, c.descricao AS curso_descricao
             FROM propostas_cursos pc
             JOIN cursos c ON pc.curso_id = c.id
             WHERE pc.proposta_id = ?
             ORDER BY pc.id DESC
             LIMIT 1`,
            [propostaId]
        )
        // Register history of item addition (curso)
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try {
                    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                    actorId = payload?.userId ?? payload?.id ?? null
                } catch {}
            }
            if (actorId) {
                const itemRow: any = rows?.[0] || {}
                const novo_valor = JSON.stringify({
                    tipo: 'curso',
                    curso_id,
                    curso_nome: itemRow.curso_nome ?? null,
                    quantidade: qtd,
                    valor_unitario: unit,
                    desconto: desc,
                    valor_total,
                })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'adicionar_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch (histErr) {
            console.warn('Falha ao registrar histórico (curso):', histErr)
        }
        await conn.commit()
        res.status(201).json({ item: rows?.[0] || null })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao inserir curso na proposta:', error)
        res.status(500).json({ message: 'Erro ao inserir curso na proposta' })
    } finally {
        conn.release()
    }
}

export const addChemicalToProposal = async (
    req: Request<{ id: string }, {}, { grupo: string; pontos: number; valor_unitario: number; desconto: number }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const { grupo, pontos, valor_unitario, desconto } = req.body || ({} as any)
    if (!propostaId || Number.isNaN(propostaId) || !grupo) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const pts = Number(pontos ?? 0)
    const unit = Number(valor_unitario ?? 0)
    const desc = Number(desconto ?? 0)
    const valor_total = Math.max(0, pts * unit - desc)
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        await conn.query(
            `INSERT INTO propostas_quimicos (proposta_id, grupo, pontos, valor_unitario, desconto, valor_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [propostaId, grupo, pts, unit, desc, valor_total]
        )
        
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT * FROM propostas_quimicos WHERE proposta_id = ? ORDER BY id DESC LIMIT 1`,
            [propostaId]
        )
        // Register history of item addition (químico)
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try {
                    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                    actorId = payload?.userId ?? payload?.id ?? null
                } catch {}
            }
            if (actorId) {
                const novo_valor = JSON.stringify({
                    tipo: 'quimico',
                    grupo,
                    pontos: pts,
                    valor_unitario: unit,
                    desconto: desc,
                    valor_total,
                })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'adicionar_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch (histErr) {
            console.warn('Falha ao registrar histórico (químico):', histErr)
        }
        await conn.commit()
        res.status(201).json({ item: rows?.[0] || null })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao inserir químico na proposta:', error)
        res.status(500).json({ message: 'Erro ao inserir químico na proposta' })
    } finally {
        conn.release()
    }
}

export const addProductToProposal = async (
    req: Request<{ id: string }, {}, { produto_id: number; quantidade: number; desconto: number }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const { produto_id, quantidade, desconto } = req.body || ({} as any)
    if (!propostaId || Number.isNaN(propostaId) || !produto_id) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const qtd = Number(quantidade ?? 0)
    const desc = Number(desconto ?? 0)
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        // Fetch pricing rule
        const [rules] = await conn.query<RowDataPacket[]>(
            `SELECT preco_linear, min_quantidade, max_quantidade, preco_unitario, preco_adicional
             FROM regras_preco_produtos
             WHERE produto_id = ? AND ? BETWEEN min_quantidade AND max_quantidade
             LIMIT 1`,
            [produto_id, qtd]
        )
        if (!rules || rules.length === 0) {
            await conn.rollback()
            res.status(400).json({ message: 'Regra de preço não encontrada para o produto.' })
            return
        }
        const rule: any = rules[0]
        const precoUnitario = Number(rule.preco_unitario ?? 0)
        const minQuantidade = Number(rule.min_quantidade ?? 0)
        const precoAdicional = Number(rule.preco_adicional ?? 0)
        const adicionalFlag = Number(rule.preco_adicional ?? 0) // TINYINT(1) 1=true 0=false
        let valor_unitario = precoUnitario
        let valor_total: number
        if (!adicionalFlag) {
            // Non-linear: use only preco_unitario (or possibly multiply by quantity - business rule ambiguous)
            valor_total = precoUnitario // adhere to provided PHP note
        } else {
            const extra = Math.max(0, qtd - minQuantidade) * precoAdicional
            valor_total = Math.max(0, precoUnitario + extra - desc)
        }
        await conn.query(
            `INSERT INTO propostas_produtos (proposta_id, produto_id, quantidade, valor_unitario, desconto, valor_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [propostaId, produto_id, qtd, valor_unitario, desc, valor_total]
        )
        
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pp.*, p.nome AS produto_nome
             FROM propostas_produtos pp
             JOIN produtos p ON pp.produto_id = p.id
             WHERE pp.proposta_id = ?
             ORDER BY pp.id DESC
             LIMIT 1`,
            [propostaId]
        )
        // Register history of item addition (produto)
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try {
                    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                    actorId = payload?.userId ?? payload?.id ?? null
                } catch {}
            }
            if (actorId) {
                const itemRow: any = rows?.[0] || {}
                const novo_valor = JSON.stringify({
                    tipo: 'produto',
                    produto_id,
                    produto_nome: itemRow.produto_nome ?? null,
                    quantidade: qtd,
                    valor_unitario,
                    desconto: desc,
                    valor_total,
                })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'adicionar_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch (histErr) {
            console.warn('Falha ao registrar histórico (produto):', histErr)
        }
        await conn.commit()
        res.status(201).json({ item: rows?.[0] || null })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao inserir produto na proposta:', error)
        res.status(500).json({ message: 'Erro ao inserir produto na proposta' })
    } finally {
        conn.release()
    }
}

// List programas vinculados à proposta
export const getProgramasByProposal = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ message: 'ID da proposta inválido' })
            return
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
            SELECT 
                pp.*, 
                p.nome AS programa_nome
            FROM propostas_programas pp
            JOIN programas_prevencao p ON pp.programa_id = p.id
            WHERE pp.proposta_id = ?
            `,
            [id]
        )

        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao coletar programas por proposta:', error)
        res.status(500).json([])
    }
}

// Insert programa endpoint (similar to produto)
export const addProgramToProposal = async (
    req: Request<{ id: string }, {}, { programa_id: number; quantidade: number; desconto: number; acrescimo_mensal?: number }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const { programa_id, quantidade, desconto, acrescimo_mensal } = req.body || ({} as any)
    if (!propostaId || Number.isNaN(propostaId) || !programa_id) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const qtd = Number(quantidade ?? 0)
    const desc = Number(desconto ?? 0)
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        // Fetch pricing rule
        const [rules] = await conn.query<RowDataPacket[]>(
            `SELECT preco_linear, min_quantidade, max_quantidade, preco_unitario, preco_adicional
             FROM regras_preco_programas
             WHERE programa_id = ? AND ? BETWEEN min_quantidade AND max_quantidade
             LIMIT 1`,
            [programa_id, qtd]
        )
        if (!rules || rules.length === 0) {
            await conn.rollback()
            res.status(400).json({ message: 'Regra de preço não encontrada para o programa.' })
            return
        }
        const rule: any = rules[0]
        const precoUnitario = Number(rule.preco_unitario ?? 0)
        const minQuantidade = Number(rule.min_quantidade ?? 0)
        const precoAdicional = Number(rule.preco_adicional ?? 0)
        const adicionalFlag = Number(rule.preco_adicional ?? 0) // TINYINT(1) 1=true 0=false (seguindo produtos)
        let valor_unitario = precoUnitario
        let valor_total_mensal: number
        if (!adicionalFlag) {
            // total mensal (sem adicional) por regra existente
            valor_total_mensal = precoUnitario
        } else {
            const extra = Math.max(0, qtd - minQuantidade) * precoAdicional
            // total mensal (com adicional) por regra existente
            valor_total_mensal = Math.max(0, precoUnitario + extra - desc)
        }
        // Acrescimo mensal (flat por mês)
        const acres = Math.max(0, Number(acrescimo_mensal ?? 0))
        valor_total_mensal = Math.max(0, valor_total_mensal + acres)
        // Adaptacao: contrato anual — total anual = 12 x total mensal
        const valor_total = Math.max(0, valor_total_mensal * 12)
        await conn.query(
            `INSERT INTO propostas_programas (proposta_id, programa_id, quantidade, valor_unitario, desconto, valor_total)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [propostaId, programa_id, qtd, valor_unitario, desc, valor_total]
        )
        
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pp.*, p.nome AS programa_nome
             FROM propostas_programas pp
             JOIN programas_prevencao p ON pp.programa_id = p.id
             WHERE pp.proposta_id = ?
             ORDER BY pp.id DESC
             LIMIT 1`,
            [propostaId]
        )

        // Register history
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try {
                    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                    actorId = payload?.userId ?? payload?.id ?? null
                } catch {}
            }
            if (actorId) {
                const itemRow: any = rows?.[0] || {}
                const novo_valor = JSON.stringify({
                    tipo: 'programa',
                    programa_id,
                    programa_nome: itemRow.programa_nome ?? null,
                    quantidade: qtd,
                    valor_unitario,
                    desconto: desc,
                    acrescimo_mensal: acres,
                    valor_total,
                })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'adicionar_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch (histErr) {
            console.warn('Falha ao registrar histórico (programa):', histErr)
        }

        await conn.commit()
        res.status(201).json({ item: rows?.[0] || null })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao inserir programa na proposta:', error)
        res.status(500).json({ message: 'Erro ao inserir programa na proposta' })
    } finally {
        conn.release()
    }
}

// Delete item endpoints
export const deleteCourseFromProposal = async (
    req: Request<{ id: string; itemId: string }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    if (!propostaId || Number.isNaN(propostaId) || !itemId || Number.isNaN(itemId)) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pc.*, c.nome AS curso_nome FROM propostas_cursos pc JOIN cursos c ON pc.curso_id = c.id WHERE pc.id = ? AND pc.proposta_id = ? LIMIT 1`,
            [itemId, propostaId]
        )
        if (!rows || rows.length === 0) {
            await conn.rollback()
            res.status(404).json({ message: 'Item não encontrado' })
            return
        }
        const item: any = rows[0]
        await conn.query(`DELETE FROM propostas_cursos WHERE id = ? AND proposta_id = ?`, [itemId, propostaId])
        // history
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try { const payload = jwt.verify(token, authConfig.jwtSecret as string) as any; actorId = payload?.userId ?? payload?.id ?? null } catch {}
            }
            if (actorId) {
                const novo_valor = JSON.stringify({ tipo: 'curso', curso_id: item.curso_id, curso_nome: item.curso_nome ?? null, quantidade: item.quantidade, valor_unitario: item.valor_unitario, desconto: item.desconto, valor_total: item.valor_total, removed: true })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'remover_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch {}
        await conn.commit()
        res.status(200).json({ deleted: true })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao remover curso da proposta:', error)
        res.status(500).json({ message: 'Erro ao remover curso da proposta' })
    } finally {
        conn.release()
    }
}

export const deleteChemicalFromProposal = async (
    req: Request<{ id: string; itemId: string }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    if (!propostaId || Number.isNaN(propostaId) || !itemId || Number.isNaN(itemId)) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT * FROM propostas_quimicos WHERE id = ? AND proposta_id = ? LIMIT 1`,
            [itemId, propostaId]
        )
        if (!rows || rows.length === 0) {
            await conn.rollback()
            res.status(404).json({ message: 'Item não encontrado' })
            return
        }
        const item: any = rows[0]
        await conn.query(`DELETE FROM propostas_quimicos WHERE id = ? AND proposta_id = ?`, [itemId, propostaId])
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try { const payload = jwt.verify(token, authConfig.jwtSecret as string) as any; actorId = payload?.userId ?? payload?.id ?? null } catch {}
            }
            if (actorId) {
                const novo_valor = JSON.stringify({ tipo: 'quimico', grupo: item.grupo, pontos: item.pontos, valor_unitario: item.valor_unitario, desconto: item.desconto, valor_total: item.valor_total, removed: true })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'remover_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch {}
        await conn.commit()
        res.status(200).json({ deleted: true })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao remover químico da proposta:', error)
        res.status(500).json({ message: 'Erro ao remover químico da proposta' })
    } finally {
        conn.release()
    }
}

export const deleteProductFromProposal = async (
    req: Request<{ id: string; itemId: string }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    if (!propostaId || Number.isNaN(propostaId) || !itemId || Number.isNaN(itemId)) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pp.*, p.nome AS produto_nome FROM propostas_produtos pp JOIN produtos p ON pp.produto_id = p.id WHERE pp.id = ? AND pp.proposta_id = ? LIMIT 1`,
            [itemId, propostaId]
        )
        if (!rows || rows.length === 0) {
            await conn.rollback()
            res.status(404).json({ message: 'Item não encontrado' })
            return
        }
        const item: any = rows[0]
        await conn.query(`DELETE FROM propostas_produtos WHERE id = ? AND proposta_id = ?`, [itemId, propostaId])
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try { const payload = jwt.verify(token, authConfig.jwtSecret as string) as any; actorId = payload?.userId ?? payload?.id ?? null } catch {}
            }
            if (actorId) {
                const novo_valor = JSON.stringify({ tipo: 'produto', produto_id: item.produto_id, produto_nome: item.produto_nome ?? null, quantidade: item.quantidade, valor_unitario: item.valor_unitario, desconto: item.desconto, valor_total: item.valor_total, removed: true })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'remover_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch {}
        await conn.commit()
        res.status(200).json({ deleted: true })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao remover produto da proposta:', error)
        res.status(500).json({ message: 'Erro ao remover produto da proposta' })
    } finally {
        conn.release()
    }
}

export const deleteProgramFromProposal = async (
    req: Request<{ id: string; itemId: string }>,
    res: Response
): Promise<void> => {
    const propostaId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    if (!propostaId || Number.isNaN(propostaId) || !itemId || Number.isNaN(itemId)) {
        res.status(400).json({ message: 'Parâmetros inválidos' })
        return
    }
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT pp.*, p.nome AS programa_nome FROM propostas_programas pp JOIN programas_prevencao p ON pp.programa_id = p.id WHERE pp.id = ? AND pp.proposta_id = ? LIMIT 1`,
            [itemId, propostaId]
        )
        if (!rows || rows.length === 0) {
            await conn.rollback()
            res.status(404).json({ message: 'Item não encontrado' })
            return
        }
        const item: any = rows[0]
        await conn.query(`DELETE FROM propostas_programas WHERE id = ? AND proposta_id = ?`, [itemId, propostaId])
        try {
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            let actorId: number | null = null
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try { const payload = jwt.verify(token, authConfig.jwtSecret as string) as any; actorId = payload?.userId ?? payload?.id ?? null } catch {}
            }
            if (actorId) {
                const novo_valor = JSON.stringify({ tipo: 'programa', programa_id: item.programa_id, programa_nome: item.programa_nome ?? null, quantidade: item.quantidade, valor_unitario: item.valor_unitario, desconto: item.desconto, valor_total: item.valor_total, removed: true })
                await conn.query<OkPacket>(
                    `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                     VALUES (?, ?, 'remover_item', NULL, ?, NULL, NOW())`,
                    [propostaId, actorId, novo_valor]
                )
            }
        } catch {}
        await conn.commit()
        res.status(200).json({ deleted: true })
    } catch (error) {
        await conn.rollback()
        console.error('Erro ao remover programa da proposta:', error)
        res.status(500).json({ message: 'Erro ao remover programa da proposta' })
    } finally {
        conn.release()
    }
}

// Files (Arquivos) for proposals
export const getArquivosByProposta = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, nome_arquivo, caminho FROM arquivos WHERE proposta_id = ?`,
            [id]
        )
        res.status(200).json(rows || [])
    } catch (error) {
        console.error('Erro ao buscar arquivos da proposta:', error)
        res.status(500).json({ message: 'Erro ao buscar arquivos' })
    }
}

export const uploadArquivoProposta = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        const anyReq = req as unknown as ExpressRequest & { file?: any }
        const file = anyReq.file
        if (!file) {
            res.status(400).json({ message: 'Arquivo não enviado' })
            return
        }
        const nome = file.originalname
        const caminhoPublico = `/uploads/proposal-${id}/${file.filename}`
        const [result] = await pool.query<OkPacket>(
            `INSERT INTO arquivos (proposta_id, nome_arquivo, caminho, created_at) VALUES (?, ?, ?, NOW())`,
            [id, nome, caminhoPublico]
        )
        res.status(201).json({ id: (result as any).insertId, nome_arquivo: nome, caminho: caminhoPublico })
    } catch (error) {
        console.error('Erro ao fazer upload de arquivo da proposta:', error)
        res.status(500).json({ message: 'Erro ao fazer upload de arquivo' })
    }
}

export const deleteArquivoProposta = async (
    req: Request<{ id: string; arquivo_id: string }>,
    res: Response
): Promise<void> => {
    try {
        const id = Number(req.params.id)
        const arquivoId = Number(req.params.arquivo_id)
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, caminho FROM arquivos WHERE id = ? AND proposta_id = ? LIMIT 1`,
            [arquivoId, id]
        )
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: 'Arquivo não encontrado' })
            return
        }
        const fileRow: any = rows[0]
        await pool.query<OkPacket>(`DELETE FROM arquivos WHERE id = ?`, [arquivoId])
        // Safe unlink within uploads dir
        try {
            const publicPath = String(fileRow.caminho || '')
            if (publicPath.startsWith('/uploads/')) {
                const fileAbs = path.join(PUBLIC_UPLOADS_DIR, publicPath.replace('/uploads/', ''))
                const resolved = path.resolve(fileAbs)
                if (resolved.startsWith(PUBLIC_UPLOADS_DIR)) {
                    fs.unlink(resolved, () => { /* ignore */ })
                }
            }
        } catch {}
        res.status(200).json({ deleted: true, id: arquivoId })
    } catch (error) {
        console.error('Erro ao excluir arquivo da proposta:', error)
        res.status(500).json({ message: 'Erro ao excluir arquivo' })
    }
}

// Propostas recentemente alteradas por um usuário (com base no historico_alteracoes)
export const getRecentProposalsByUser = async (
    req: Request<{}, {}, {}, { userId?: string | null; limit?: string | null }>,
    res: Response
): Promise<void> => {
    try {
        const userId = req.query.userId ? Number(req.query.userId) : null
        const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 10)))
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
                e.nome_fantasia AS empresa_nome,
                e.razao_social AS empresa_razaoSocial,
                e.cnpj AS empresa_cnpj,
                e.cidade AS empresa_cidade,
                MAX(h.data_alteracao) AS ultima_alteracao,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                (SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id) AS programa_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
                ) AS total_itens
            FROM historico_alteracoes h
            JOIN propostas p ON p.id = h.proposta_id
            LEFT JOIN usuarios usr_responsavel ON p.responsavel_id = usr_responsavel.id
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE h.usuario_id = ?
            GROUP BY p.id
            ORDER BY ultima_alteracao DESC
            LIMIT ?
            `,
            [userId, limit]
        )

    const proposals = (rows || []).map((r: any) => {
            const resp = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || undefined
            const empresaNome = r.empresa_nome || r.empresa_razaoSocial || null
            const createdAt = r.data ? (r.data instanceof Date ? r.data.toISOString() : String(r.data)) : undefined
            const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
            const cursoTotal = Number(r.curso_total ?? 0)
            const quimicoTotal = Number(r.quimico_total ?? 0)
            const produtoTotal = Number(r.produto_total ?? 0)
            const programaTotal = Number(r.programa_total ?? 0)
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal + programaTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
                payment_method: r.payment_method ?? undefined,
                payment_installments: r.payment_installments != null ? Number(r.payment_installments) : undefined,
                comissao: r.comissao ?? undefined,
                criadoEm: createdAt,
                dataAlteracao: updatedAt,
                updatedAt,
                unidade_id: r.unidade_id ?? undefined,
                responsavel_id: r.responsavel_id ?? undefined,
                titulo: r.titulo ?? undefined,
                responsavel: resp,
            }
        })

        res.status(200).json({ proposals })
    } catch (error) {
        console.error('Erro ao buscar propostas recentes por usuário:', error)
        res.status(500).json({ proposals: [] })
    }
}

    // Atualiza informações de pagamento da proposta
    export const updateProposalPayment = async (
        req: Request<{ id: string }, {}, { payment_method?: string; payment_installments?: number }>,
        res: Response
    ): Promise<void> => {
        try {
            const id = Number(req.params.id)
            if (!id || Number.isNaN(id)) {
                res.status(400).json({ message: 'ID da proposta inválido' })
                return
            }

            // Extract actor and permission (admin or responsável)
            let actorId: number | null = null
            let actorCargoId: number | null = null
            const authHeader = req.headers && (req.headers.authorization as string | undefined)
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                try {
                    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
                    actorId = payload?.userId ?? payload?.id ?? null
                    actorCargoId = payload?.cargoId ?? null
                } catch {}
            }
            if (!actorId) {
                res.status(401).json({ message: 'Não autenticado' })
                return
            }

            const [curRows] = await pool.query<RowDataPacket[]>(`SELECT responsavel_id, payment_method, payment_installments FROM propostas WHERE id = ? LIMIT 1`, [id])
            if (!curRows || curRows.length === 0) {
                res.status(404).json({ message: 'Proposta não encontrada' })
                return
            }
            const current: any = curRows[0]
            const isAdmin = (cid: any) => [1, 2, 3].includes(Number(cid))
            const isResponsible = Number(current.responsavel_id) === Number(actorId)
            if (!(isAdmin(actorCargoId) || isResponsible)) {
                res.status(403).json({ message: 'Sem permissão para alterar pagamento desta proposta' })
                return
            }

            // Normalize inputs
            const rawMethod = (req.body?.payment_method ?? '').toString().trim().toLowerCase()
            let method: string | null = null
            if (rawMethod) {
                if (rawMethod.includes('pix')) method = 'pix_mp'
                else if (rawMethod.includes('mercado') || rawMethod.includes('mp')) method = rawMethod.includes('boleto') ? 'boleto_mp' : 'pix_mp'
                else if (rawMethod.includes('financeiro')) method = 'boleto_financeiro'
                else if (rawMethod.includes('boleto')) method = 'boleto_mp'
                else method = rawMethod
            }
            const installmentsNum = req.body?.payment_installments != null ? Number(req.body.payment_installments) : null
            if (installmentsNum != null && (Number.isNaN(installmentsNum) || installmentsNum < 1)) {
                res.status(400).json({ message: 'Número de parcelas inválido' })
                return
            }

            const conn = await pool.getConnection()
            try {
                await conn.beginTransaction()
                try {
                    await conn.query<OkPacket>(
                        `UPDATE propostas SET payment_method = ?, payment_installments = ?, data_alteracao = NOW() WHERE id = ?`,
                        [method, installmentsNum, id]
                    )
                } catch (e: any) {
                    // Column missing in DB
                    if (e?.code === 'ER_BAD_FIELD_ERROR') {
                        await conn.rollback()
                        res.status(400).json({ message: 'Colunas de pagamento ausentes na tabela propostas. Adicione payment_method VARCHAR(50) NULL e payment_installments INT NULL.' })
                        return
                    }
                    throw e
                }

                // History
                try {
                    const valor_anterior = JSON.stringify({ payment_method: current.payment_method ?? null, payment_installments: current.payment_installments ?? null })
                    const novo_valor = JSON.stringify({ payment_method: method, payment_installments: installmentsNum })
                    await conn.query<OkPacket>(
                        `INSERT INTO historico_alteracoes (proposta_id, usuario_id, acao, valor_anterior, novo_valor, observacoes, data_alteracao)
                         VALUES (?, ?, 'atualizar_pagamento', ?, ?, NULL, NOW())`,
                        [id, actorId, valor_anterior, novo_valor]
                    )
                } catch {}

                await conn.commit()
            } catch (err) {
                await conn.rollback()
                throw err
            } finally {
                conn.release()
            }

            res.status(200).json({ id, payment_method: method, payment_installments: installmentsNum, dataAlteracao: new Date().toISOString() })
        } catch (error) {
            console.error('Erro ao atualizar pagamento da proposta:', error)
            res.status(500).json({ message: 'Erro ao atualizar pagamento da proposta' })
        }
    }
