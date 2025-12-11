// server/services/searchService.ts
import pool from '../config/db'
import { RowDataPacket } from 'mysql2'

export interface SearchResult {
  id: number | string
  type: 'task' | 'proposal' | 'company' | 'user'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  relevance: number
  url: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  categories: {
    tasks: number
    proposals: number
    companies: number
    users: number
  }
}

/**
 * Busca global em múltiplas entidades
 * @param query Termo de busca
 * @param userId ID do usuário fazendo a busca (para filtrar por permissões)
 * @param options Opções de busca
 */
export async function globalSearch(
  query: string,
  userId: number,
  options: {
    limit?: number
    offset?: number
    types?: Array<'task' | 'proposal' | 'company' | 'user'>
    unitId?: number
  } = {}
): Promise<SearchResponse> {
  const { limit = 20, offset = 0, types, unitId } = options
  
  // Sanitizar query
  const sanitizedQuery = query.trim()
  if (sanitizedQuery.length < 2) {
    return {
      results: [],
      total: 0,
      query: sanitizedQuery,
      categories: { tasks: 0, proposals: 0, companies: 0, users: 0 }
    }
  }

  // Buscar em paralelo em todas as tabelas
  const searchTypes = types || ['task', 'proposal', 'company', 'user']
  const results: SearchResult[] = []
  let counts = { tasks: 0, proposals: 0, companies: 0, users: 0 }

  try {
    // Buscar usuário para verificar permissões
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT cargo_id FROM usuarios WHERE id = ?',
      [userId]
    )
    const userCargoId = userRows[0]?.cargo_id || 0

    // Buscar tarefas
    if (searchTypes.includes('task')) {
      const taskResults = await searchTasks(sanitizedQuery, userId, userCargoId, unitId)
      results.push(...taskResults)
      counts.tasks = taskResults.length
    }

    // Buscar propostas
    if (searchTypes.includes('proposal')) {
      const proposalResults = await searchProposals(sanitizedQuery, userId, userCargoId, unitId)
      results.push(...proposalResults)
      counts.proposals = proposalResults.length
    }

    // Buscar empresas
    if (searchTypes.includes('company')) {
      const companyResults = await searchCompanies(sanitizedQuery, userId, unitId)
      results.push(...companyResults)
      counts.companies = companyResults.length
    }

    // Buscar usuários
    if (searchTypes.includes('user')) {
      const userResults = await searchUsers(sanitizedQuery, userId, userCargoId)
      results.push(...userResults)
      counts.users = userResults.length
    }

    // Ordenar por relevância
    results.sort((a, b) => b.relevance - a.relevance)

    // Aplicar paginação
    const paginatedResults = results.slice(offset, offset + limit)

    return {
      results: paginatedResults,
      total: results.length,
      query: sanitizedQuery,
      categories: counts
    }
  } catch (error) {
    console.error('[searchService] Erro na busca global:', error)
    throw error
  }
}

/**
 * Busca em tarefas
 */
async function searchTasks(query: string, userId: number, userCargoId: number, unitId?: number): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`
  
  try {
    // Verificar se a query é um número (ID da tarefa)
    const isNumericSearch = /^\d+$/.test(query.trim())
    
    // Query base
    let sql = `SELECT 
        t.id,
        t.status,
        t.prioridade,
        t.prazo,
        e.nome_fantasia AS empresa_nome,
        e.cnpj,
        e.caepf,
        u.nome AS responsavel_nome,
        tt.tipo AS tipo_nome
      FROM tarefas t
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios u ON t.responsavel_id = u.id
      LEFT JOIN tipo_tarefa tt ON t.finalidade_id = tt.id
      WHERE (`
    
    const params: any[] = []
    
    // Se for uma busca numérica, priorizar busca por ID
    if (isNumericSearch) {
      sql += `t.id = ?`
      params.push(parseInt(query.trim()))
    } else {
      sql += `e.nome_fantasia LIKE ? OR
        e.cnpj LIKE ? OR
        e.caepf LIKE ? OR
        tt.tipo LIKE ?`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    sql += `) AND t.status != 'Automático'`
    
    // Adicionar filtro de unidade se fornecido
    if (unitId) {
      sql += ` AND e.unidade_responsavel = ?`
      params.push(unitId)
    }
    
    sql += ` ORDER BY t.created_at DESC LIMIT 50`
    
    const [rows] = await pool.query<RowDataPacket[]>(sql, params)

    return rows.map(row => {
      // Calcular relevância baseada em onde o termo foi encontrado
      let relevance = 0
      const lowerQuery = query.toLowerCase()
      const empresa = (row.empresa_nome || '').toLowerCase()
      const tipo = (row.tipo_nome || '').toLowerCase()

      // Relevância máxima para busca por ID exato
      if (isNumericSearch && row.id === parseInt(query.trim())) {
        relevance += 1000
      } else {
        if (empresa.includes(lowerQuery)) relevance += 100
        if (empresa.startsWith(lowerQuery)) relevance += 50
        if (tipo.includes(lowerQuery)) relevance += 80
        if (row.cnpj && row.cnpj.includes(query)) relevance += 90
        if (row.caepf && row.caepf.includes(query)) relevance += 90
      }

      // Boost para tarefas pendentes
      if (row.status === 'Pendente') relevance += 10

      return {
        id: row.id,
        type: 'task' as const,
        title: `${row.tipo_nome || 'Sem finalidade'} #${row.id}`,
        subtitle: row.empresa_nome || 'Sem empresa',
        description: undefined, // Status agora aparece apenas no badge
        metadata: {
          status: row.status,
          prioridade: row.prioridade,
          prazo: row.prazo,
          responsavel: row.responsavel_nome,
          tipo: row.tipo_nome
        },
        relevance,
        url: `/technical/tarefa/${row.id}`
      }
    })
  } catch (error) {
    console.error('[searchService] Erro ao buscar tarefas:', error)
    return []
  }
}

/**
 * Busca em propostas comerciais
 */
async function searchProposals(query: string, userId: number, userCargoId: number, unitId?: number): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`
  
  try {
    // Verificar se a query é um número (ID da proposta)
    const isNumericSearch = /^\d+$/.test(query.trim())
    
    let sql = `SELECT 
        p.id,
        p.numero_referencia,
        p.titulo,
        e.nome_fantasia AS nome_cliente,
        e.cnpj,
        e.caepf,
        p.status,
        u.nome AS responsavel_nome,
        p.data_alteracao
      FROM propostas p
      LEFT JOIN usuarios u ON p.responsavel_id = u.id
      LEFT JOIN empresas e ON p.empresa_id = e.id
      WHERE (`
    
    const params: any[] = []
    
    // Se for uma busca numérica, priorizar busca por ID
    if (isNumericSearch) {
      sql += `p.id = ?`
      params.push(parseInt(query.trim()))
    } else {
      sql += `e.nome_fantasia LIKE ? OR
        e.cnpj LIKE ? OR
        e.caepf LIKE ? OR
        p.titulo LIKE ? OR
        p.numero_referencia LIKE ?`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    sql += `)`
    
    // Adicionar filtro de unidade se fornecido
    if (unitId) {
      sql += ` AND e.unidade_responsavel = ?`
      params.push(unitId)
    }
    
    sql += ` ORDER BY p.data_alteracao DESC LIMIT 50`
    
    const [rows] = await pool.query<RowDataPacket[]>(sql, params)

    return rows.map(row => {
      let relevance = 0
      const lowerQuery = query.toLowerCase()
      const cliente = (row.nome_cliente || '').toLowerCase()
      const titulo = (row.titulo || '').toLowerCase()
      const numeroRef = (row.numero_referencia || '').toLowerCase()

      // Relevância máxima para busca por ID exato ou número de referência
      if (isNumericSearch && row.id === parseInt(query.trim())) {
        relevance += 1000
      } else {
        if (numeroRef.includes(lowerQuery)) relevance += 150
        if (numeroRef === lowerQuery) relevance += 200
        if (cliente.includes(lowerQuery)) relevance += 100
        if (cliente.startsWith(lowerQuery)) relevance += 50
        if (titulo.includes(lowerQuery)) relevance += 80
        if (row.cnpj && row.cnpj.includes(query)) relevance += 90
        if (row.caepf && row.caepf.includes(query)) relevance += 90
      }

      // Boost para propostas pendentes
      if (row.status && row.status.toLowerCase().includes('pendent')) relevance += 15

      return {
        id: row.id,
        type: 'proposal' as const,
        title: row.nome_cliente || 'Sem nome',
        subtitle: row.numero_referencia ? `${row.numero_referencia}${row.titulo ? ' • ' + row.titulo : ''}` : (row.titulo || `Proposta #${row.id}`),
        description: row.cnpj || undefined,
        metadata: {
          status: row.status,
          responsavel: row.responsavel_nome
        },
        relevance,
        url: `/comercial/proposta/${row.id}`
      }
    })
  } catch (error) {
    console.error('[searchService] Erro ao buscar propostas:', error)
    return []
  }
}

/**
 * Busca em empresas
 */
async function searchCompanies(query: string, userId: number, unitId?: number): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`
  
  try {
    let sql = `SELECT 
        e.id,
        e.nome_fantasia AS nome,
        e.cnpj,
        e.caepf,
        e.razao_social,
        e.telefone,
        e.email,
        e.cidade,
        u.nome AS unidade_nome
      FROM empresas e
      LEFT JOIN unidades u ON e.unidade_responsavel = u.id
      WHERE (
        e.nome_fantasia LIKE ? OR
        e.cnpj LIKE ? OR
        e.caepf LIKE ? OR
        e.razao_social LIKE ? OR
        e.email LIKE ?
      )`
    
    const params: any[] = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
    
    // Adicionar filtro de unidade se fornecido
    if (unitId) {
      sql += ` AND e.unidade_responsavel = ?`
      params.push(unitId)
    }
    
    sql += ` ORDER BY e.nome_fantasia ASC LIMIT 50`
    
    const [rows] = await pool.query<RowDataPacket[]>(sql, params)

    return rows.map(row => {
      let relevance = 0
      const lowerQuery = query.toLowerCase()
      const nome = (row.nome || '').toLowerCase()
      const razao = (row.razao_social || '').toLowerCase()

      if (nome.includes(lowerQuery)) relevance += 100
      if (nome.startsWith(lowerQuery)) relevance += 50
      if (razao.includes(lowerQuery)) relevance += 80
      if (row.cnpj && row.cnpj.includes(query)) relevance += 90
      if (row.caepf && row.caepf.includes(query)) relevance += 90

      return {
        id: row.id,
        type: 'company' as const,
        title: row.nome || 'Sem nome',
        subtitle: row.cnpj || row.caepf || row.razao_social || 'Sem documento',
        description: row.cidade && row.estado ? `${row.cidade} - ${row.estado}` : undefined,
        metadata: {
          telefone: row.telefone,
          email: row.email,
          unidade: row.unidade_nome
        },
        relevance,
        url: `/empresa/${row.id}`
      }
    })
  } catch (error) {
    console.error('[searchService] Erro ao buscar empresas:', error)
    return []
  }
}

/**
 * Busca em usuários
 */
async function searchUsers(query: string, userId: number, userCargoId: number): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`
  
  // Apenas admins podem buscar todos os usuários
  const isAdmin = userCargoId === 1 || userCargoId === 2 || userCargoId === 3
  
  try {
    let sql = `
      SELECT 
        u.id,
        u.nome,
        u.sobrenome,
        u.email,
        c.nome AS cargo_nome,
        u.foto_url
      FROM usuarios u
      LEFT JOIN cargos c ON u.cargo_id = c.id
      WHERE (
        u.nome LIKE ? OR
        u.sobrenome LIKE ? OR
        u.email LIKE ?
      )
    `
    
    // Não-admins só podem buscar usuários da mesma unidade
    if (!isAdmin) {
      sql += ` AND u.id IN (
        SELECT uu.usuario_id FROM usuario_unidades uu
        INNER JOIN usuario_unidades uu2 ON uu.unidade_id = uu2.unidade_id
        WHERE uu2.usuario_id = ?
      )`
    }
    
    sql += ' ORDER BY u.nome ASC LIMIT 30'
    
    const params = isAdmin 
      ? [searchPattern, searchPattern, searchPattern]
      : [searchPattern, searchPattern, searchPattern, userId]

    const [rows] = await pool.query<RowDataPacket[]>(sql, params)

    return rows.map(row => {
      let relevance = 0
      const lowerQuery = query.toLowerCase()
      const nome = (row.nome || '').toLowerCase()
      const sobrenome = (row.sobrenome || '').toLowerCase()
      const email = (row.email || '').toLowerCase()

      if (nome.startsWith(lowerQuery)) relevance += 100
      if (sobrenome.startsWith(lowerQuery)) relevance += 100
      if (nome.includes(lowerQuery)) relevance += 50
      if (sobrenome.includes(lowerQuery)) relevance += 50
      if (email.includes(lowerQuery)) relevance += 30

      const fullName = `${row.nome || ''} ${row.sobrenome || ''}`.trim()

      return {
        id: row.id,
        type: 'user' as const,
        title: fullName || 'Sem nome',
        subtitle: row.cargo_nome || 'Sem cargo',
        description: row.email || undefined,
        metadata: {
          telefone: row.telefone,
          fotoUrl: row.foto_url
        },
        relevance,
        url: `/admin/usuario/${row.id}`
      }
    })
  } catch (error) {
    console.error('[searchService] Erro ao buscar usuários:', error)
    return []
  }
}
