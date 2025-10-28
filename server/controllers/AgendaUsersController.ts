import { Response } from 'express'
import { AuthRequest } from '../middleware/permissions'
import agendaUsersService from '../services/agendaUsersService'

/**
 * GET /api/agenda-users/:unidadeId?
 * Busca usuários visíveis na agenda
 * Se unidadeId não for passado, retorna usuários de todas as unidades
 */
export async function getVisibleUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const unidadeId = req.params.unidadeId ? parseInt(req.params.unidadeId) : undefined

    const users = await agendaUsersService.getVisibleUsersForAgenda(unidadeId)
    
    res.json({ success: true, data: users })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao buscar usuários visíveis:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar usuários da agenda' 
    })
  }
}

/**
 * GET /api/agenda-users/config/all
 * Lista todas as configurações da agenda (admin only)
 */
export async function getAllConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await agendaUsersService.getAllAgendaConfigs()
    
    res.json({ success: true, data: configs })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao listar configurações:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar configurações' 
    })
  }
}

/**
 * POST /api/agenda-users
 * Adiciona um usuário à agenda
 * Body: { usuarioId: number, unidadeId?: number | null, ordem?: number }
 */
export async function addUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { usuarioId, unidadeId = null, ordem = 0 } = req.body

    if (!usuarioId) {
      res.status(400).json({ 
        success: false, 
        message: 'usuarioId é obrigatório' 
      })
      return
    }

    await agendaUsersService.addUserToAgenda(usuarioId, unidadeId, ordem)
    
    res.json({ 
      success: true, 
      message: 'Usuário adicionado à agenda com sucesso' 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao adicionar usuário:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar usuário' 
    })
  }
}

/**
 * PUT /api/agenda-users/:usuarioId/order
 * Atualiza a ordem de um usuário
 * Body: { ordem: number, unidadeId?: number | null }
 */
export async function updateOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usuarioId = parseInt(req.params.usuarioId)
    const { ordem, unidadeId } = req.body

    if (!ordem && ordem !== 0) {
      res.status(400).json({ 
        success: false, 
        message: 'ordem é obrigatória' 
      })
      return
    }

    await agendaUsersService.updateUserOrder(usuarioId, ordem, unidadeId)
    
    res.json({ 
      success: true, 
      message: 'Ordem atualizada com sucesso' 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao atualizar ordem:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar ordem' 
    })
  }
}

/**
 * PUT /api/agenda-users/:usuarioId/activate
 * Ativa um usuário na agenda
 * Body: { unidadeId?: number | null }
 */
export async function activateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usuarioId = parseInt(req.params.usuarioId)
    const { unidadeId } = req.body

    await agendaUsersService.activateUser(usuarioId, unidadeId)
    
    res.json({ 
      success: true, 
      message: 'Usuário ativado com sucesso' 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao ativar usuário:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao ativar usuário' 
    })
  }
}

/**
 * DELETE /api/agenda-users/:usuarioId
 * Remove usuário da agenda (soft delete)
 * Query: ?unidadeId=<number> (opcional - se não passar, remove de todas)
 */
export async function removeUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usuarioId = parseInt(req.params.usuarioId)
    const unidadeId = req.query.unidadeId ? parseInt(req.query.unidadeId as string) : undefined

    await agendaUsersService.removeUserFromAgenda(usuarioId, unidadeId)
    
    res.json({ 
      success: true, 
      message: 'Usuário removido da agenda' 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao remover usuário:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover usuário' 
    })
  }
}

/**
 * DELETE /api/agenda-users/config/:configId
 * Deleta permanentemente uma configuração (admin only)
 */
export async function deleteConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configId = parseInt(req.params.configId)

    await agendaUsersService.deleteAgendaConfig(configId)
    
    res.json({ 
      success: true, 
      message: 'Configuração deletada com sucesso' 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao deletar configuração:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar configuração' 
    })
  }
}

/**
 * POST /api/agenda-users/bulk
 * Atualiza múltiplas configurações de uma vez (admin only)
 * Body: { configs: Array<{ usuarioId, unidadeId, ativo, ordem }> }
 */
export async function bulkUpdate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { configs } = req.body

    if (!Array.isArray(configs) || configs.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'configs deve ser um array não vazio' 
      })
      return
    }

    await agendaUsersService.bulkUpdateAgendaUsers(configs)
    
    res.json({ 
      success: true, 
      message: `${configs.length} configurações atualizadas com sucesso` 
    })
  } catch (error) {
    console.error('[AgendaUsersController] Erro na atualização em lote:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro na atualização em lote' 
    })
  }
}

/**
 * GET /api/agenda-users/stats
 * Retorna estatísticas das configurações (admin only)
 */
export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await agendaUsersService.getAgendaStats()
    
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('[AgendaUsersController] Erro ao buscar estatísticas:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar estatísticas' 
    })
  }
}

export default {
  getVisibleUsers,
  getAllConfigs,
  addUser,
  updateOrder,
  activateUser,
  removeUser,
  deleteConfig,
  bulkUpdate,
  getStats
}
