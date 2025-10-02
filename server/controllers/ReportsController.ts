import { Request, Response } from 'express'
import pool from '../config/db'
import { RowDataPacket } from 'mysql2'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'

function isAdminCargo(cargoId: any): boolean {
  const cid = Number(cargoId)
  return [1, 2, 3].includes(cid)
}

function requireAdmin(req: Request, res: Response): { ok: true; userId: number } | { ok: false } {
  try {
    const authHeader = req.headers && (req.headers.authorization as string | undefined)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Não autenticado' })
      return { ok: false }
    }
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, authConfig.jwtSecret as string) as any
    const cargoId = payload?.cargoId
    if (!isAdminCargo(cargoId)) {
      res.status(403).json({ message: 'Acesso restrito a administradores' })
      return { ok: false }
    }
    const userId = Number(payload?.userId ?? payload?.id)
    return { ok: true, userId }
  } catch (e) {
    res.status(401).json({ message: 'Token inválido' })
    return { ok: false }
  }
}

// GET /api/relatorios/propostas-aprovadas?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
export async function getApprovedProposalsReport(
  req: Request<{}, {}, {}, { inicio?: string; fim?: string; userId?: string }>,
  res: Response
) {
  const auth = requireAdmin(req, res)
  if (!('ok' in auth) || !auth.ok) return

  try {
    const inicio = (req.query.inicio || '').trim()
    const fim = (req.query.fim || '').trim()
    const params: any[] = []
    const where: string[] = [
      "TRIM(LOWER(p.status)) LIKE 'aprovad%'",
    ]

    if (inicio) { where.push('p.data_alteracao >= ?'); params.push(`${inicio} 00:00:00`) }
    if (fim) { where.push('p.data_alteracao <= ?'); params.push(`${fim} 23:59:59`) }

    const userIdRaw = (req.query.userId || '').trim()
    const userId = userIdRaw && !Number.isNaN(Number(userIdRaw)) ? Number(userIdRaw) : null
    if (userId) { where.push('p.responsavel_id = ?'); params.push(userId) }

    const sql = `
      SELECT 
        p.id,
        p.titulo,
        p.responsavel_id,
        resp.nome AS responsavel_nome,
        resp.sobrenome AS responsavel_sobrenome,
        p.indicacao_id,
        ind.nome AS indicacao_nome,
        ind.sobrenome AS indicacao_sobrenome,
        (
          COALESCE((SELECT SUM(pc.valor_total) FROM propostas_cursos pc WHERE pc.proposta_id = p.id), 0)
          + COALESCE((SELECT SUM(pq.valor_total) FROM propostas_quimicos pq WHERE pq.proposta_id = p.id), 0)
          + COALESCE((SELECT SUM(pp.valor_total) FROM propostas_produtos pp WHERE pp.proposta_id = p.id), 0)
          + COALESCE((SELECT SUM(ppg.valor_total) FROM propostas_programas ppg WHERE ppg.proposta_id = p.id), 0)
        ) AS total_itens
      FROM propostas p
      LEFT JOIN usuarios resp ON resp.id = p.responsavel_id
      LEFT JOIN usuarios ind ON ind.id = p.indicacao_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.data_alteracao DESC, p.id DESC
    `

    const [rows] = await pool.query<RowDataPacket[]>(sql, params)

  const items = (rows || []).map((r: any) => {
      const valorTotalCalc = Number(r.total_itens ?? 0)
      const valorTotalHeader = r.valor_total_header != null ? Number(r.valor_total_header) : null
      const valor_total_num = (Number.isFinite(valorTotalHeader) && (valorTotalHeader as number) > 0)
        ? (valorTotalHeader as number)
        : valorTotalCalc
      // Comissão: 3% se houve indicação, 5% se não
      const hasInd = r.indicacao_id != null
  const comissao_vendedor = valor_total_num * (hasInd ? 0.03 : 0.05)
      // Comissão da indicação: 2% se houve indicação
  const comissao_indicacao = hasInd ? (valor_total_num * 0.02) : 0
      const indicacao_nome = [r.indicacao_nome, r.indicacao_sobrenome].filter(Boolean).join(' ').trim() || null
      const responsavel = [r.responsavel_nome, r.responsavel_sobrenome].filter(Boolean).join(' ').trim() || null
      return {
        id: Number(r.id),
        titulo: r.titulo || null,
  valor_total: valor_total_num,
        comissao_vendedor,
        indicacao_nome,
        comissao_indicacao,
        responsavel_id: r.responsavel_id != null ? Number(r.responsavel_id) : null,
        responsavel_nome: responsavel,
      }
    })

    res.status(200).json({
      inicio: inicio || null,
      fim: fim || null,
      total: items.length,
      proposals: items,
    })
  } catch (error) {
    console.error('Erro no relatório de propostas aprovadas:', error)
    res.status(500).json({ message: 'Erro ao gerar relatório de propostas aprovadas' })
  }
}

// GET /api/relatorios/ranking-notas?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
export async function getNotasRankingReport(
  req: Request<{}, {}, {}, { inicio?: string; fim?: string }>,
  res: Response
) {
  const auth = requireAdmin(req, res)
  if (!('ok' in auth) || !auth.ok) return

  try {
    const inicio = (req.query.inicio || '').trim()
    const fim = (req.query.fim || '').trim()
    const params: any[] = []
    const where: string[] = ["h.avaliacao_nota IS NOT NULL"]
    if (inicio) { where.push('h.avaliacao_data >= ?'); params.push(`${inicio} 00:00:00`) }
    if (fim) { where.push('h.avaliacao_data <= ?'); params.push(`${fim} 23:59:59`) }

    const sql = `
      SELECT 
        h.usuario_id AS user_id,
        u.nome,
        u.sobrenome,
        COUNT(*) AS qtd,
        AVG(h.avaliacao_nota) AS media
      FROM historico_alteracoes h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE ${where.join(' AND ')}
      GROUP BY h.usuario_id, u.nome, u.sobrenome
      HAVING qtd > 0
      ORDER BY media DESC, qtd DESC, u.nome ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(sql, params)
    const ranking = (rows || []).map((r: any, idx: number) => ({
      posicao: idx + 1,
      usuario_id: Number(r.user_id),
      nome: [r.nome, r.sobrenome].filter(Boolean).join(' ').trim() || String(r.user_id),
      quantidade: Number(r.qtd || 0),
      media: r.media != null ? Number(r.media) : null,
    }))

    res.status(200).json({
      inicio: inicio || null,
      fim: fim || null,
      total: ranking.length,
      ranking,
    })
  } catch (error) {
    console.error('Erro no relatório de ranking de notas:', error)
    res.status(500).json({ message: 'Erro ao gerar ranking de notas' })
  }
}

export default { getApprovedProposalsReport, getNotasRankingReport }
