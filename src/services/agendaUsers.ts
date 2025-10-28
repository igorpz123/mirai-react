import api from './api'

export interface AgendaUser {
  id: number
  nome: string
  email: string
  fotoUrl: string | null
  cargoNome: string
}

export interface AgendaUserConfig {
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

export interface AgendaStats {
  totalConfigs: number
  ativos: number
  inativos: number
  usuariosUnicos: number
}

/**
 * Busca usuários visíveis na agenda para uma unidade específica
 */
export async function getVisibleAgendaUsers(unidadeId?: number): Promise<AgendaUser[]> {
  try {
    const endpoint = unidadeId ? `/agenda-users/${unidadeId}` : '/agenda-users'
    const response = await api.get(endpoint)
    return response.data.data || []
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao buscar usuários visíveis:', error)
    throw error
  }
}

/**
 * Lista todas as configurações da agenda (admin only)
 */
export async function getAllAgendaConfigs(): Promise<AgendaUserConfig[]> {
  try {
    const response = await api.get('/agenda-users/config/all')
    return response.data.data || []
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao listar configurações:', error)
    throw error
  }
}

/**
 * Adiciona um usuário à agenda (admin only)
 */
export async function addUserToAgenda(
  usuarioId: number,
  unidadeId?: number | null,
  ordem: number = 0
): Promise<void> {
  try {
    await api.post('/agenda-users', { usuarioId, unidadeId, ordem })
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao adicionar usuário:', error)
    throw error
  }
}

/**
 * Atualiza a ordem de um usuário (admin only)
 */
export async function updateUserOrder(
  usuarioId: number,
  ordem: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    await api.put(`/agenda-users/${usuarioId}/order`, { ordem, unidadeId })
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao atualizar ordem:', error)
    throw error
  }
}

/**
 * Ativa um usuário na agenda (admin only)
 */
export async function activateAgendaUser(
  usuarioId: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    await api.put(`/agenda-users/${usuarioId}/activate`, { unidadeId })
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao ativar usuário:', error)
    throw error
  }
}

/**
 * Remove usuário da agenda (admin only)
 */
export async function removeUserFromAgenda(
  usuarioId: number,
  unidadeId?: number | null
): Promise<void> {
  try {
    const params = unidadeId !== undefined ? `?unidadeId=${unidadeId}` : ''
    await api.delete(`/agenda-users/${usuarioId}${params}`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao remover usuário:', error)
    throw error
  }
}

/**
 * Deleta configuração permanentemente (admin only)
 */
export async function deleteAgendaConfig(configId: number): Promise<void> {
  try {
    await api.delete(`/agenda-users/config/${configId}`)
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao deletar configuração:', error)
    throw error
  }
}

/**
 * Atualização em lote de configurações (admin only)
 */
export async function bulkUpdateAgendaUsers(
  configs: Array<{ usuarioId: number; unidadeId: number | null; ativo: boolean; ordem: number }>
): Promise<void> {
  try {
    await api.post('/agenda-users/bulk', { configs })
  } catch (error) {
    console.error('[AgendaUsersService] Erro na atualização em lote:', error)
    throw error
  }
}

/**
 * Busca estatísticas das configurações (admin only)
 */
export async function getAgendaStats(): Promise<AgendaStats> {
  try {
    const response = await api.get('/agenda-users/stats')
    return response.data.data
  } catch (error) {
    console.error('[AgendaUsersService] Erro ao buscar estatísticas:', error)
    throw error
  }
}
