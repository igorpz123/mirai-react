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
                e.email AS empresa_email,
                (SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id) AS curso_total,
                (SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id) AS quimico_total,
                (SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id) AS produto_total,
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
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
            const updatedAt = r.data_alteracao ? (r.data_alteracao instanceof Date ? r.data_alteracao.toISOString() : String(r.data_alteracao)) : undefined
            const cursoTotal = Number(r.curso_total ?? 0)
            const quimicoTotal = Number(r.quimico_total ?? 0)
            const produtoTotal = Number(r.produto_total ?? 0)
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
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
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
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
            const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal))
            const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)
            return {
                id: r.id,
                cliente: empresaNome || '-',
                valor: r.valor ?? undefined,
                valor_total: valorTotal,
                status: r.status,
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

        // Approved total value (sum of cursos, quimicos, produtos) in current vs previous month
        const approvedValueSql = `
            SELECT period, SUM(total_valor) AS total
            FROM (
                SELECT 'current' AS period,
                    (
                        COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                      + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                      + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
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
                (
                  COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
                + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
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
        const totalItens = Number(r.total_itens ?? (cursoTotal + quimicoTotal + produtoTotal))
        const valorTotal = (r.valor_total != null ? Number(r.valor_total) : undefined) ?? (totalItens || undefined)

        const proposal = {
            id: r.id,
            cliente: empresaNome || '-',
            valor: r.valor ?? undefined,
            valor_total: valorTotal,
            status: r.status,
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
