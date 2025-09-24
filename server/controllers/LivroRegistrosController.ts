import { Request, Response } from 'express'
import { OkPacket, RowDataPacket } from 'mysql2'
import pool from '../config/db'

// Tipagem da linha
interface LivroRegistroRow extends RowDataPacket {
  id: number
  numero: string | null
  data_aquisicao: string | Date | null
  participante: string
  empresa_id: number
  curso_id: number
  instrutor: string | null
  carga_horaria: number
  data_conclusao: string | Date
  modalidade: string
  sesmo: number
  observacoes?: string | null
  criado_em?: string | Date
  atualizado_em?: string | Date
  empresa_nome?: string | null
  curso_nome?: string | null
}

// Listagem (com filtros simples opcionais)
export const listLivroRegistros = async (
  req: Request<{}, {}, {}, {
    empresa_id?: string; curso_id?: string; participante?: string; modalidade?: string; sesmo?: string;
    data_conclusao_inicio?: string; data_conclusao_fim?: string; limit?: string; offset?: string;
    sort?: string; order?: string
  }>,
  res: Response
): Promise<void> => {
  try {
    const { empresa_id, curso_id, participante, modalidade, sesmo, data_conclusao_inicio, data_conclusao_fim } = req.query
    const { limit = '25', offset = '0', sort = 'data_conclusao', order = 'DESC' } = req.query
    const where: string[] = []
    const values: any[] = []
    if (empresa_id) { where.push('lr.empresa_id = ?'); values.push(Number(empresa_id)) }
    if (curso_id) { where.push('lr.curso_id = ?'); values.push(Number(curso_id)) }
    if (participante) { where.push('lr.participante LIKE ?'); values.push(`%${participante}%`) }
    if (modalidade) { where.push('lr.modalidade LIKE ?'); values.push(`%${modalidade}%`) }
    if (sesmo === '1' || sesmo === '0') { where.push('lr.sesmo = ?'); values.push(Number(sesmo)) }
    if (data_conclusao_inicio) { where.push('lr.data_conclusao >= ?'); values.push(data_conclusao_inicio) }
    if (data_conclusao_fim) { where.push('lr.data_conclusao <= ?'); values.push(data_conclusao_fim) }

    const sortable = new Set(['data_conclusao','carga_horaria','id','participante','modalidade'])
    const sortCol = sortable.has(sort) ? sort : 'data_conclusao'
    const sortDir = (order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const lim = Math.min(Math.max(parseInt(limit,10)||25,1),100)
    const off = Math.max(parseInt(offset,10)||0,0)

    const baseFrom = `FROM livro_de_registros lr
                 JOIN empresas e ON e.id = lr.empresa_id
                 JOIN cursos c ON c.id = lr.curso_id`
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const sql = `SELECT lr.*, e.nome_fantasia AS empresa_nome, c.nome AS curso_nome ${baseFrom} ${whereSql}
                 ORDER BY lr.${sortCol} ${sortDir}, lr.id DESC
                 LIMIT ? OFFSET ?`

    const countSql = `SELECT COUNT(*) as total ${baseFrom} ${whereSql}`

    const [rows, countRows] = await Promise.all([
      pool.query<LivroRegistroRow[]>(sql, [...values, lim, off]).then(r=>r[0]),
      pool.query<RowDataPacket[]>(countSql, values).then(r=>r[0])
    ])
    const total = (countRows && countRows[0] && (countRows[0] as any).total) ? Number((countRows[0] as any).total) : 0

    const registros = (rows || []).map(r => ({
      id: r.id,
      numero: r.numero,
      data_aquisicao: r.data_aquisicao ? formatDate(r.data_aquisicao) : null,
      participante: r.participante,
      empresa_id: r.empresa_id,
      empresa_nome: r.empresa_nome,
      curso_id: r.curso_id,
      curso_nome: r.curso_nome,
      instrutor: r.instrutor,
      carga_horaria: Number(r.carga_horaria),
      data_conclusao: formatDate(r.data_conclusao),
      modalidade: r.modalidade,
      sesmo: !!r.sesmo,
      observacoes: r.observacoes || null,
      criado_em: r.criado_em ? new Date(r.criado_em).toISOString() : null,
      atualizado_em: r.atualizado_em ? new Date(r.atualizado_em).toISOString() : null,
    }))

    res.status(200).json({ registros, total, limit: lim, offset: off })
  } catch (error) {
    console.error('Erro ao listar livro_de_registros', error)
    res.status(500).json({ message: 'Erro ao listar registros' })
  }
}

// Obter por id
export const getLivroRegistroById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [rows] = await pool.query<LivroRegistroRow[]>(
      `SELECT lr.*, e.nome_fantasia AS empresa_nome, c.nome AS curso_nome
       FROM livro_de_registros lr
       JOIN empresas e ON e.id = lr.empresa_id
       JOIN cursos c ON c.id = lr.curso_id
       WHERE lr.id = ? LIMIT 1`,
      [id]
    )
    if (!rows.length) { res.status(404).json({ message: 'Registro não encontrado' }); return }
    const r = rows[0]
    res.status(200).json({
      id: r.id,
      numero: r.numero,
      data_aquisicao: r.data_aquisicao ? formatDate(r.data_aquisicao) : null,
      participante: r.participante,
      empresa_id: r.empresa_id,
      empresa_nome: r.empresa_nome,
      curso_id: r.curso_id,
      curso_nome: r.curso_nome,
      instrutor: r.instrutor,
      carga_horaria: Number(r.carga_horaria),
      data_conclusao: formatDate(r.data_conclusao),
      modalidade: r.modalidade,
      sesmo: !!r.sesmo,
      observacoes: r.observacoes || null,
      criado_em: r.criado_em ? new Date(r.criado_em).toISOString() : null,
      atualizado_em: r.atualizado_em ? new Date(r.atualizado_em).toISOString() : null,
    })
  } catch (error) {
    console.error('Erro ao buscar registro por id', error)
    res.status(500).json({ message: 'Erro ao buscar registro' })
  }
}

// Criar
export const createLivroRegistro = async (
  req: Request<{}, {}, { numero?: string | null; data_aquisicao?: string | null; participante: string; empresa_id: number; curso_id: number; instrutor?: string | null; carga_horaria: number; data_conclusao: string; modalidade: string; sesmo?: boolean; observacoes?: string | null }>,
  res: Response
): Promise<void> => {
  try {
    const { numero, data_aquisicao, participante, empresa_id, curso_id, instrutor, carga_horaria, data_conclusao, modalidade, sesmo, observacoes } = req.body || ({} as any)
    if (!participante || !empresa_id || !curso_id || !carga_horaria || !data_conclusao || !modalidade) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes' })
      return
    }
    if (Number(carga_horaria) <= 0) {
      res.status(400).json({ message: 'carga_horaria deve ser > 0' })
      return
    }
    if (data_aquisicao && data_conclusao && new Date(data_conclusao) < new Date(data_aquisicao)) {
      res.status(400).json({ message: 'data_conclusao não pode ser anterior à data_aquisicao' })
      return
    }

    const [result] = await pool.query<OkPacket>(
      `INSERT INTO livro_de_registros (numero, data_aquisicao, participante, empresa_id, curso_id, instrutor, carga_horaria, data_conclusao, modalidade, sesmo, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero || null, data_aquisicao || null, participante, empresa_id, curso_id, instrutor || null, carga_horaria, data_conclusao, modalidade, sesmo ? 1 : 0, observacoes || null]
    )

    const insertId = (result as any).insertId
    req.params = { id: String(insertId) }
    await getLivroRegistroById(req as any, res)
  } catch (error) {
    console.error('Erro ao criar registro', error)
    res.status(500).json({ message: 'Erro ao criar registro' })
  }
}

// Atualizar
export const updateLivroRegistro = async (
  req: Request<{ id: string }, {}, Partial<{ numero: string | null; data_aquisicao: string | null; participante: string; empresa_id: number; curso_id: number; instrutor: string | null; carga_horaria: number; data_conclusao: string; modalidade: string; sesmo: boolean; observacoes: string | null }>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const payload = req.body || {}
    if (!id) { res.status(400).json({ message: 'id é obrigatório' }); return }

    const fieldsMap: Record<string, string> = {
      numero: 'numero',
      data_aquisicao: 'data_aquisicao',
      participante: 'participante',
      empresa_id: 'empresa_id',
      curso_id: 'curso_id',
      instrutor: 'instrutor',
      carga_horaria: 'carga_horaria',
      data_conclusao: 'data_conclusao',
      modalidade: 'modalidade',
      sesmo: 'sesmo',
      observacoes: 'observacoes'
    }

    const sets: string[] = []
    const values: any[] = []
    for (const key of Object.keys(fieldsMap)) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (key === 'sesmo') {
          sets.push(`${fieldsMap[key]} = ?`)
          values.push((payload as any)[key] ? 1 : 0)
        } else {
          sets.push(`${fieldsMap[key]} = ?`)
          values.push((payload as any)[key])
        }
      }
    }

    // Validações pontuais
    if ((payload as any).carga_horaria != null && Number((payload as any).carga_horaria) <= 0) {
      res.status(400).json({ message: 'carga_horaria deve ser > 0' }); return
    }
    if ((payload as any).data_aquisicao && (payload as any).data_conclusao && new Date(String((payload as any).data_conclusao)) < new Date(String((payload as any).data_aquisicao))) {
      res.status(400).json({ message: 'data_conclusao não pode ser anterior à data_aquisicao' }); return
    }

    if (!sets.length) { res.status(400).json({ message: 'Nenhum campo para atualizar' }); return }

    const sql = `UPDATE livro_de_registros SET ${sets.join(', ')} WHERE id = ?`
    values.push(id)
    const [result] = await pool.query<OkPacket>(sql, values)
    if (!result.affectedRows) { res.status(404).json({ message: 'Registro não encontrado' }); return }

    await getLivroRegistroById(req as any, res)
  } catch (error) {
    console.error('Erro ao atualizar registro', error)
    res.status(500).json({ message: 'Erro ao atualizar registro' })
  }
}

// Deletar
export const deleteLivroRegistro = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const [result] = await pool.query<OkPacket>('DELETE FROM livro_de_registros WHERE id = ?', [id])
    if (!(result as any).affectedRows) { res.status(404).json({ message: 'Registro não encontrado' }); return }
    res.status(200).json({ message: 'Registro removido' })
  } catch (error) {
    console.error('Erro ao deletar registro', error)
    res.status(500).json({ message: 'Erro ao deletar registro' })
  }
}

function formatDate(d: string | Date | null): string | null {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}
