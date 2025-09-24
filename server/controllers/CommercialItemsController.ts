import { Request, Response } from 'express'
import { RowDataPacket } from 'mysql2'
import pool from '../config/db'

// Allowed item types and their queries
const QUERY_MAP: Record<string, { sql: string; nameFieldCandidates: string[] }> = {
  produtos: { sql: 'SELECT * FROM produtos ORDER BY nome ASC LIMIT 500', nameFieldCandidates: ['nome', 'descricao', 'titulo'] },
  cursos: { sql: 'SELECT * FROM cursos ORDER BY nome ASC LIMIT 500', nameFieldCandidates: ['nome', 'titulo'] }, // 'titulo' será filtrado se não existir
  quimicos: { sql: 'SELECT * FROM tabela_quimicos ORDER BY grupo ASC LIMIT 500', nameFieldCandidates: ['nome', 'grupo', 'descricao'] },
  programas: { sql: 'SELECT * FROM programas_prevencao ORDER BY nome ASC LIMIT 500', nameFieldCandidates: ['nome', 'descricao', 'titulo'] },
}

function pickName(row: any, candidates: string[]): string {
  for (const c of candidates) {
    if (row && row[c] != null && String(row[c]).trim().length) return String(row[c])
  }
  // fallback to first non-null value
  const vals = Object.values(row || {})
  const first = vals.find(v => v != null && String(v).trim().length)
  return first ? String(first) : '—'
}

export async function listCommercialItems(
  req: Request<{ tipo: string }, {}, {}, { q?: string }>,
  res: Response
): Promise<void> {
  try {
    const rawTipo = (req.params.tipo || '').toLowerCase().trim()
    const tipo = rawTipo
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]/g, '') // sanitize

    // map some singular vs plural variants
    const aliasMap: Record<string, string> = {
      produto: 'produtos',
      quimico: 'quimicos',
      curso: 'cursos',
      programa: 'programas',
    }
    const finalTipo = QUERY_MAP[tipo] ? tipo : aliasMap[tipo] || tipo
    const entry = QUERY_MAP[finalTipo]
    if (!entry) {
      res.status(400).json({ message: 'Tipo de item inválido', items: [] })
      return
    }
    const search = (req.query.q || '').toString().trim()
    let sql = entry.sql
    let dynamicCandidates = [...entry.nameFieldCandidates]
    const params: any[] = []

    if (search) {
      // Detect table name from the base SQL (simple regex; our sql strings are controlled constants)
      const tableMatch = /FROM\s+([a-zA-Z0-9_]+)/i.exec(entry.sql)
      if (tableMatch) {
        const tableName = tableMatch[1]
        try {
          const [cols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM ${tableName}`)
          const existing = new Set(cols.map(c => c.Field))
          dynamicCandidates = dynamicCandidates.filter(f => existing.has(f))
          if (dynamicCandidates.length === 0) {
            // fallback: prefer 'nome' if exists, else first 1-2 columns
            if (existing.has('nome')) dynamicCandidates = ['nome']
            else dynamicCandidates = Array.from(existing).slice(0, 2)
          }
        } catch (e) {
          // Se falhar o SHOW COLUMNS, seguimos com candidatos originais
          // (o erro original continuaria, mas evita quebrar silenciosamente)
          console.warn('Falha ao obter colunas para filtro dinâmico:', e)
        }
      }

      // Monta a query de busca apenas com colunas válidas
      const baseWithoutLimit = entry.sql.replace(/LIMIT 500/i, '')
      sql = `SELECT * FROM (${baseWithoutLimit}) base WHERE (${dynamicCandidates
        .map(f => `COALESCE(base.${f}, '') LIKE ?`)
        .join(' OR ')}) LIMIT 500`
      dynamicCandidates.forEach(() => params.push(`%${search}%`))
    }

    const [rows] = await pool.query<RowDataPacket[]>(sql, params)
    const items = (rows || []).map((r: any) => {
      const nome = pickName(r, dynamicCandidates)
      // Detect possible unit price field
      const priceFieldCandidates = [
        'valor_unitario','valor','preco_unitario','preco','preco_base','preco_mensal','price','unit_price'
      ]
      let valorUnitario: number | null = null
      for (const f of priceFieldCandidates) {
        if (Object.prototype.hasOwnProperty.call(r, f)) {
          const n = Number((r as any)[f])
          if (!Number.isNaN(n) && n >= 0) { valorUnitario = n; break }
        }
      }
      return {
        id: r.id ?? r.ID ?? undefined,
        nome,
        tipo: finalTipo.slice(0, -1), // singular approximation
        valor_unitario: valorUnitario,
        raw: r,
      }
    })
    res.status(200).json({ items, tipo: finalTipo })
  } catch (e) {
    console.error('Erro ao listar itens comerciais:', e)
    res.status(500).json({ message: 'Erro ao listar itens', items: [] })
  }
}

export default { listCommercialItems }