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

        res.status(200).json({
            period: 'month',
            totalByStatus,
            trendByStatus,
            created: { current: createdCurrent, previous: createdPrevious, diff: createdDiff, percent: createdPercent },
            approved: { current: approvedCurrent, previous: approvedPrevious, diff: approvedDiff, percent: approvedPercent },
        })
    } catch (error) {
        console.error('Erro ao calcular estatísticas de propostas:', error)
        res.status(500).json({ totalByStatus: {}, trendByStatus: {}, period: 'month', created: { current: 0, previous: 0, diff: 0, percent: 0 }, approved: { current: 0, previous: 0, diff: 0, percent: 0 } })
    }
}

export default { getProposalsByUser, getProposalsByUnidade, getProposalStats }
