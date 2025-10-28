import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IconShield, IconRefresh, IconCheck, IconX } from '@tabler/icons-react'
import { toastSuccess, toastError } from '@/lib/customToast'
import { SiteHeader } from '@/components/layout/site-header'

// ==========================================
// INTERFACES
// ==========================================

interface Permission {
  id: number
  nome: string
  descricao: string
}

interface CargoPermission {
  cargoId: number
  cargoNome: string
  permissions: string[]
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [cargos, setCargos] = useState<CargoPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Buscar permissões disponíveis
      const permsRes = await fetch('/api/permissoes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (permsRes.ok) {
        const permsData = await permsRes.json()
        setPermissions(permsData)
      }

      // Buscar cargos com suas permissões
      const cargosRes = await fetch('/api/permissoes/cargos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (cargosRes.ok) {
        const cargosData = await cargosRes.json()
        setCargos(cargosData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toastError('Erro ao carregar permissões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ==========================================
  // TOGGLE PERMISSION
  // ==========================================

  const togglePermission = async (cargoId: number, permissionName: string, currentlyHas: boolean) => {
    setSaving(cargoId)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      if (currentlyHas) {
        // Remover permissão
        const res = await fetch(`/api/permissoes/cargo/${cargoId}/${permissionName}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Erro ao remover permissão')
      } else {
        // Adicionar permissão
        const res = await fetch(`/api/permissoes/cargo/${cargoId}/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ permission: permissionName })
        })
        if (!res.ok) throw new Error('Erro ao adicionar permissão')
      }

      // Atualizar estado local
      setCargos(prev =>
        prev.map(cargo =>
          cargo.cargoId === cargoId
            ? {
              ...cargo,
              permissions: currentlyHas
                ? cargo.permissions.filter(p => p !== permissionName)
                : [...cargo.permissions, permissionName]
            }
            : cargo
        )
      )

      toastSuccess(
        currentlyHas
          ? 'Permissão removida com sucesso'
          : 'Permissão adicionada com sucesso'
      )
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error)
      toastError('Erro ao atualizar permissão')
    } finally {
      setSaving(null)
    }
  }

  // ==========================================
  // LIMPAR CACHE
  // ==========================================

  const clearCache = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/permissoes/cache', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toastSuccess('Cache de permissões limpo com sucesso')
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      toastError('Erro ao limpar cache')
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header */}
      <SiteHeader title="Admin | Gerenciamento de Permissões" />

      <div className="mx-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light flex items-center gap-2">
              Configure as permissões de acesso por cargo
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <IconRefresh className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={clearCache}>
              Limpar Cache
            </Button>
          </div>
        </div>

        {/* Legenda de Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {permissions.map(perm => (
                <div key={perm.id} className="border rounded-lg p-4">
                  <div className="font-semibold text-sm mb-1">{perm.nome}</div>
                  <div className="text-xs text-muted-foreground">{perm.descricao}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Matriz de Permissões por Cargo */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permissões</CardTitle>
            <CardDescription>
              Marque/desmarque as permissões para cada cargo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cargos.map(cargo => (
                <div key={cargo.cargoId} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4">{cargo.cargoNome}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {permissions.map(perm => {
                      const hasPermission = cargo.permissions.includes(perm.nome)
                      const isSaving = saving === cargo.cargoId

                      return (
                        <label
                          key={perm.nome}
                          className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                        >
                          <Checkbox
                            checked={hasPermission}
                            disabled={isSaving}
                            onCheckedChange={() =>
                              togglePermission(cargo.cargoId, perm.nome, hasPermission)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{perm.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {perm.descricao}
                            </div>
                          </div>
                          {hasPermission ? (
                            <IconCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <IconX className="w-4 h-4 text-muted-foreground" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                  {saving === cargo.cargoId && (
                    <div className="mt-2 text-sm text-muted-foreground">Salvando...</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent>
            <div className="flex gap-3">
              <IconShield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  💡 Dicas sobre Permissões
                </p>
                <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>
                    <strong>admin</strong> - Acesso completo a todas as funcionalidades
                  </li>
                  <li>
                    <strong>comercial</strong> - Acesso ao módulo comercial (propostas, itens)
                  </li>
                  <li>
                    <strong>tecnico</strong> - Acesso ao módulo técnico (tarefas, agenda)
                  </li>
                  <li>Alterações aplicam-se imediatamente após salvar</li>
                  <li>Usuários precisam fazer logout/login para ver mudanças (ou aguardar 5 min)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
