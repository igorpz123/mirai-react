import pool from '../config/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// ==========================================
// INTERFACES
// ==========================================

export interface AgendaUserConfig {
  id: number
  usuarioId: number
  unidadeId: number | null
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export interface AgendaUserView {
  configId: number
  usuarioId: number
  usuarioNome: string
  usuarioEmail: string
  usuarioFoto: string | null
  cargoNome: string
  unidadeId: number | null
  unidadeNome: string | null
  ativo: boolean
  ordem: number
}

export interface AgendaUserSimple {
  id: number
  nome: string
  email: string
  fotoUrl: string | null
  cargoNome: string
}

// ==========================================
// FUNÇÕES PRINCIPAIS
// ==========================================

/**
 * Busca usuários visíveis na agenda para uma unidade específica
 * Se unidadeId for null, retorna usuários configurados para "todas as unidades"
 */
export async function getVisibleUsersForAgenda(
  unidadeId?: number
): Promise<AgendaUserSimple[]> {
  try {
    let query: string
    let params: any[]

    if (unidadeId) {
      // Busca usuários específicos da unidade OU configurados para todas as unidades
      query = `
        SELECT DISTINCT
          u.id,
          u.nome,
          u.email,
          u.foto_url AS fotoUrl,
          c.nome AS cargoNome,
          COALESCE(auv.ordem, 999) AS ordem
        FROM usuarios u
        INNER JOIN cargos c ON u.cargo_id = c.id
        INNER JOIN agenda_usuarios_visiveis auv ON u.id = auv.usuario_id
        WHERE u.status = 'ativo'
          AND auv.ativo = 1
          AND (auv.unidade_id = ? OR auv.unidade_id IS NULL)
        ORDER BY ordem ASC, u.nome ASC
      `
      params = [unidadeId]
    } else {
      // Busca apenas usuários configurados para "todas as unidades"
      query = `
        SELECT DISTINCT
          u.id,
          u.nome,
          u.email,
          u.foto_url AS fotoUrl,
          c.nome AS cargoNome,
          auv.ordem
        FROM usuarios u
        INNER JOIN cargos c ON u.cargo_id = c.id
        INNER JOIN agenda_usuarios_visiveis auv ON u.id = auv.usuario_id
        WHERE u.status = 'ativo'
          AND auv.ativo = 1
          AND auv.unidade_id IS NULL
        ORDER BY auv.ordem ASC, u.nome ASC
      `
      params = []
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    return rows as AgendaUserSimple[]
  } catch (error: any) {
    // Se a tabela não existir, retorna array vazio ao invés de erro
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
      console.warn('[AgendaUsersService] Tabela agenda_usuarios_visiveis não existe. Execute a migration.')
      return []
    }
    console.error('[AgendaUsersService] Erro ao buscar usuários da agenda:', error)
    throw new Error('Erro ao buscar usuários da agenda')
  }
}

/**
 * Lista todas as configurações de usuários da agenda
 */
export async function getAllAgendaConfigs(): Promise<AgendaUserView[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM vw_agenda_usuarios ORDER BY ordem ASC, usuario_nome ASC'
    )
    
    return rows.map(row => ({
      configId: row.config_id,
      usuarioId: row.usuario_id,
      usuarioNome: row.usuario_nome,
      usuarioEmail: row.usuario_email,
      usuarioFoto: row.usuario_foto,
      cargoNome: row.cargo_nome,
      unidadeId: row.unidade_id,
      unidadeNome: row.unidade_nome,
      ativo: Boolean(row.ativo),
      ordem: row.ordem
    }))
  } catch (error: any) {
    // Se a tabela não existir, retorna array vazio
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
      console.warn('[AgendaUsersService] Tabela/View agenda não existe. Execute a migration.')
      return []
    }
    console.error('[AgendaUsersService] Erro ao listar configurações:', error)
    throw new Error('Erro ao listar configurações da agenda')
  }
}

/**
 * Adiciona um usuário à agenda
 */
export async function addUserToAgenda(
  usuarioId: number,
  unidadeId: number | null = null,
  ordem: number = 0
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO agenda_usuarios_visiveis (usuario_id, unidade_id, ativo, ordem)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE 
         ativo = 1,
         ordem = VALUES(ordem),
         updated_at = CURRENT_TIMESTAMP`,
      [usuarioId, unidadeId, ordem]
    )
    
    console.log(`[AgendaUsersService] Usuário ${usuarioId} adicionado à agenda`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao adicionar usuário:', error)
    throw new Error('Erro ao adicionar usuário à agenda')
  }
}

/**
 * Remove um usuário da agenda (soft delete - marca como inativo)
 */
export async function removeUserFromAgenda(
  usuarioId: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    let query: string
    let params: any[]

    if (unidadeId !== undefined) {
      // Remove configuração específica de unidade
      query = 'UPDATE agenda_usuarios_visiveis SET ativo = 0 WHERE usuario_id = ? AND unidade_id <=> ?'
      params = [usuarioId, unidadeId]
    } else {
      // Remove todas as configurações do usuário
      query = 'UPDATE agenda_usuarios_visiveis SET ativo = 0 WHERE usuario_id = ?'
      params = [usuarioId]
    }

    await pool.query(query, params)
    console.log(`[AgendaUsersService] Usuário ${usuarioId} removido da agenda`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao remover usuário:', error)
    throw new Error('Erro ao remover usuário da agenda')
  }
}

/**
 * Deleta permanentemente uma configuração
 */
export async function deleteAgendaConfig(configId: number): Promise<void> {
  try {
    await pool.query('DELETE FROM agenda_usuarios_visiveis WHERE id = ?', [configId])
    console.log(`[AgendaUsersService] Configuração ${configId} deletada`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao deletar configuração:', error)
    throw new Error('Erro ao deletar configuração')
  }
}

/**
 * Atualiza a ordem de um usuário na agenda
 */
export async function updateUserOrder(
  usuarioId: number,
  ordem: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    let query: string
    let params: any[]

    if (unidadeId !== undefined) {
      query = 'UPDATE agenda_usuarios_visiveis SET ordem = ? WHERE usuario_id = ? AND unidade_id <=> ?'
      params = [ordem, usuarioId, unidadeId]
    } else {
      query = 'UPDATE agenda_usuarios_visiveis SET ordem = ? WHERE usuario_id = ?'
      params = [ordem, usuarioId]
    }

    await pool.query(query, params)
    console.log(`[AgendaUsersService] Ordem do usuário ${usuarioId} atualizada para ${ordem}`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao atualizar ordem:', error)
    throw new Error('Erro ao atualizar ordem')
  }
}

/**
 * Ativa um usuário na agenda
 */
export async function activateUser(
  usuarioId: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    let query: string
    let params: any[]

    if (unidadeId !== undefined) {
      query = 'UPDATE agenda_usuarios_visiveis SET ativo = 1 WHERE usuario_id = ? AND unidade_id <=> ?'
      params = [usuarioId, unidadeId]
    } else {
      query = 'UPDATE agenda_usuarios_visiveis SET ativo = 1 WHERE usuario_id = ?'
      params = [usuarioId]
    }

    const [result] = await pool.query<ResultSetHeader>(query, params)
    
    // Se não encontrou nenhuma linha, adiciona nova configuração
    if (result.affectedRows === 0 && unidadeId !== undefined) {
      await addUserToAgenda(usuarioId, unidadeId, 0)
    }
    
    console.log(`[AgendaUsersService] Usuário ${usuarioId} ativado na agenda`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao ativar usuário:', error)
    throw new Error('Erro ao ativar usuário')
  }
}

/**
 * Atualiza múltiplas configurações de uma vez
 */
export async function bulkUpdateAgendaUsers(
  configs: Array<{ usuarioId: number; unidadeId: number | null; ativo: boolean; ordem: number }>
): Promise<void> {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()

    for (const config of configs) {
      await connection.query(
        `INSERT INTO agenda_usuarios_visiveis (usuario_id, unidade_id, ativo, ordem)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           ativo = VALUES(ativo),
           ordem = VALUES(ordem),
           updated_at = CURRENT_TIMESTAMP`,
        [config.usuarioId, config.unidadeId, config.ativo ? 1 : 0, config.ordem]
      )
    }

    await connection.commit()
    console.log(`[AgendaUsersService] ${configs.length} configurações atualizadas em lote`)
  } catch (error) {
    await connection.rollback()
    console.error('[AgendaUsersService] Erro ao atualizar configurações em lote:', error)
    throw new Error('Erro ao atualizar configurações em lote')
  } finally {
    connection.release()
  }
}

// ==========================================
// ESTATÍSTICAS
// ==========================================

export async function getAgendaStats(): Promise<{
  totalConfigs: number
  ativos: number
  inativos: number
  usuariosUnicos: number
}> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as totalConfigs,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos,
        COUNT(DISTINCT usuario_id) as usuariosUnicos
      FROM agenda_usuarios_visiveis`
    )

    if (rows.length === 0) {
      return { totalConfigs: 0, ativos: 0, inativos: 0, usuariosUnicos: 0 }
    }

    return {
      totalConfigs: Number(rows[0].totalConfigs),
      ativos: Number(rows[0].ativos),
      inativos: Number(rows[0].inativos),
      usuariosUnicos: Number(rows[0].usuariosUnicos)
    }
  } catch (error: any) {
    // Se a tabela não existir, retorna zeros
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
      console.warn('[AgendaUsersService] Tabela agenda_usuarios_visiveis não existe. Execute a migration.')
      return { totalConfigs: 0, ativos: 0, inativos: 0, usuariosUnicos: 0 }
    }
    console.error('[AgendaUsersService] Erro ao buscar estatísticas:', error)
    throw new Error('Erro ao buscar estatísticas')
  }
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  getVisibleUsersForAgenda,
  getAllAgendaConfigs,
  addUserToAgenda,
  removeUserFromAgenda,
  deleteAgendaConfig,
  updateUserOrder,
  activateUser,
  bulkUpdateAgendaUsers,
  getAgendaStats
}
