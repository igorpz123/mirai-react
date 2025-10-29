import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconCheck, IconX, IconTrash, IconPlus, IconRefresh, IconEdit, IconDeviceFloppy } from '@tabler/icons-react'
import {
  getAllAgendaConfigs,
  addUserToAgenda,
  removeUserFromAgenda,
  deleteAgendaConfig,
  activateAgendaUser,
  updateUserOrder,
  getAgendaStats,
  type AgendaUserConfig,
  type AgendaStats
} from '@/services/agendaUsers'
import { getAllUsers } from '@/services/users'
import { getUnidades, type Unidade } from '@/services/unidades'
import { toastSuccess, toastError, toastWarning } from '@/lib/customToast'

interface User {
  id: number
  nome: string
  email: string
  cargoNome?: string
}

export default function AdminAgenda() {
  const [configs, setConfigs] = useState<AgendaUserConfig[]>([])
  const [stats, setStats] = useState<AgendaStats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allUnidades, setAllUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | null>(null)
  const [newOrdem, setNewOrdem] = useState<number>(0)
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null)
  const [editOrdem, setEditOrdem] = useState<number>(0)

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)

      // Tenta carregar os dados, mas não falha se tabela não existir
      const results = await Promise.allSettled([
        getAllAgendaConfigs().catch(err => {
          console.warn('Erro ao carregar configs:', err)
          return []
        }),
        getAgendaStats().catch(err => {
          console.warn('Erro ao carregar stats:', err)
          return { totalConfigs: 0, ativos: 0, inativos: 0, usuariosUnicos: 0 }
        }),
        getAllUsers().catch(err => {
          console.warn('Erro ao carregar usuários:', err)
          return { users: [] }
        }),
        getUnidades().catch(err => {
          console.warn('Erro ao carregar unidades:', err)
          return { unidades: [], total: 0 }
        })
      ])

      const configsData = results[0].status === 'fulfilled' ? results[0].value : []
      const statsData = results[1].status === 'fulfilled' ? results[1].value : { totalConfigs: 0, ativos: 0, inativos: 0, usuariosUnicos: 0 }
      const usersData = results[2].status === 'fulfilled' ? results[2].value : { users: [] }
      const unidadesData = results[3].status === 'fulfilled' ? results[3].value : { unidades: [], total: 0 }
      
      setConfigs(Array.isArray(configsData) ? configsData : [])
      setStats(statsData)
      setAllUsers(Array.isArray(usersData.users) ? usersData.users : [])
      setAllUnidades(Array.isArray(unidadesData.unidades) ? unidadesData.unidades : [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Não mostra toast de erro para não alarmar o usuário
      setConfigs([])
      setStats({ totalConfigs: 0, ativos: 0, inativos: 0, usuariosUnicos: 0 })
      setAllUsers([])
      setAllUnidades([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Add user to agenda
  const handleAddUser = async () => {
    if (!selectedUserId) {
      toastWarning('Selecione um usuário')
      return
    }

    try {
      await addUserToAgenda(Number(selectedUserId), selectedUnidadeId, newOrdem)
      toastSuccess('Usuário adicionado à agenda')
      setSelectedUserId('')
      setSelectedUnidadeId(null)
      setNewOrdem(0)
      fetchData()
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      toastError('Erro ao adicionar usuário')
    }
  }

  // Toggle active status
  const handleToggleActive = async (config: AgendaUserConfig) => {
    try {
      if (config.ativo) {
        // Deactivate
        await removeUserFromAgenda(config.usuarioId, config.unidadeId)
        toastSuccess('Usuário desativado')
      } else {
        // Activate
        await activateAgendaUser(config.usuarioId, config.unidadeId)
        toastSuccess('Usuário ativado')
      }
      fetchData()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toastError('Erro ao alterar status')
    }
  }

  // Delete config
  const handleDelete = async (configId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta configuração permanentemente?')) {
      return
    }

    try {
      await deleteAgendaConfig(configId)
      toastSuccess('Configuração deletada')
      fetchData()
    } catch (error) {
      console.error('Erro ao deletar configuração:', error)
      toastError('Erro ao deletar configuração')
    }
  }

  // Edit order
  const handleEditOrder = (config: AgendaUserConfig) => {
    setEditingConfigId(config.configId)
    setEditOrdem(config.ordem)
  }

  const handleSaveOrder = async (config: AgendaUserConfig) => {
    try {
      await updateUserOrder(config.usuarioId, editOrdem, config.unidadeId)
      toastSuccess('Ordem atualizada')
      setEditingConfigId(null)
      fetchData()
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
      toastError('Erro ao atualizar ordem')
    }
  }

  const handleCancelEdit = () => {
    setEditingConfigId(null)
    setEditOrdem(0)
  }

  // Group configs by user
  const configsByUser = configs.reduce((acc, config) => {
    if (!acc[config.usuarioId]) {
      acc[config.usuarioId] = []
    }
    acc[config.usuarioId].push(config)
    return acc
  }, {} as Record<number, AgendaUserConfig[]>)

  if (loading) {
    return (
      <div className="w-full">
        <SiteHeader title="Gerenciar Agenda" />
        <div className="p-4">
          <div className="text-center py-8">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <SiteHeader title="Gerenciar Agenda" />
      <div className="p-4 space-y-6">
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConfigs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.usuariosUnicos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add User Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Usuário à Agenda</CardTitle>
            <CardDescription>
              Configure quais usuários aparecem na página de Agenda. Se "Unidade" for deixado como "Todas as unidades",
              o usuário aparecerá em todas as unidades do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Usuário</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-card"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Selecione um usuário</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} - {user.email} {user.cargoNome ? `(${user.cargoNome})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">Unidade</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-card"
                  value={selectedUnidadeId ?? ''}
                  onChange={(e) => setSelectedUnidadeId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Todas as unidades</option>
                  {allUnidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="text-sm font-medium mb-1 block">Ordem</label>
                <input
                  type="number"
                  className="w-full border rounded-md px-3 py-2"
                  value={newOrdem}
                  onChange={(e) => setNewOrdem(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddUser} className="gap-2">
                  <IconPlus size={18} />
                  Adicionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurations List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Configurações Atuais</CardTitle>
              <CardDescription>
                Gerencie a visibilidade dos usuários na agenda por unidade
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <IconRefresh size={18} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma configuração encontrada. Adicione usuários acima.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(configsByUser).map(([userId, userConfigs]) => {
                  const firstConfig = userConfigs[0]
                  return (
                    <div key={userId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{firstConfig.usuarioNome}</h3>
                          <p className="text-sm text-muted-foreground">
                            {firstConfig.usuarioEmail} • {firstConfig.cargoNome}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {userConfigs.map((config) => (
                          <div
                            key={config.configId}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {config.unidadeNome || 'Todas as unidades'}
                              </span>
                              
                              {/* Editable Order */}
                              {editingConfigId === config.configId ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Ordem:</span>
                                  <input
                                    type="number"
                                    className="w-16 border rounded px-2 py-1 text-sm"
                                    value={editOrdem}
                                    onChange={(e) => setEditOrdem(Number(e.target.value))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveOrder(config)
                                      if (e.key === 'Escape') handleCancelEdit()
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveOrder(config)}
                                    className="h-7 w-7 p-0"
                                    title="Salvar"
                                  >
                                    <IconDeviceFloppy size={16} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-7 w-7 p-0"
                                    title="Cancelar"
                                  >
                                    <IconX size={16} />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    Ordem: {config.ordem}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditOrder(config)}
                                    className="h-7 w-7 p-0"
                                    title="Editar ordem"
                                  >
                                    <IconEdit size={14} />
                                  </Button>
                                </div>
                              )}

                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  config.ativo
                                    ? 'button-success'
                                    : 'button-remove'
                                }`}
                              >
                                {config.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className={config.ativo ? 'button-remove gap-1' : 'button-success gap-1'}
                                onClick={() => handleToggleActive(config)}
                              >
                                {config.ativo ? (
                                  <>
                                    <IconX size={16} />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <IconCheck size={16} />
                                    Ativar
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(config.configId)}
                                className="gap-1 button-remove"
                              >
                                <IconTrash size={16} />
                                Deletar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}