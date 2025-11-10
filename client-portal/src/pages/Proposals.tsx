import Layout from '../components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { IconFileText, IconClock, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { cn } from '../lib/utils'

export default function Proposals() {
  // Mock data - substituir por chamada à API
  const proposals = [
    {
      id: 1,
      titulo: 'Proposta Comercial - SST Básico',
      data_criacao: '2025-01-15',
      status: 'aprovada',
      valor_total: 5500.00,
      descricao: 'Serviços básicos de SST incluindo NR5 e PCMSO',
    },
    {
      id: 2,
      titulo: 'Proposta Comercial - SST Completo',
      data_criacao: '2025-01-10',
      status: 'em_analise',
      valor_total: 12500.00,
      descricao: 'Pacote completo de serviços de SST',
    },
    {
      id: 3,
      titulo: 'Proposta Comercial - Treinamentos',
      data_criacao: '2025-01-05',
      status: 'pendente',
      valor_total: 3200.00,
      descricao: 'Treinamentos obrigatórios NR6, NR35 e NR10',
    },
  ]

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      aprovada: {
        label: 'Aprovada',
        icon: IconCheck,
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
      },
      em_analise: {
        label: 'Em Análise',
        icon: IconClock,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
      },
      pendente: {
        label: 'Pendente',
        icon: IconAlertCircle,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
      },
    }
    return configs[status] || configs.pendente
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minhas Propostas
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualize e acompanhe suas propostas comerciais
          </p>
        </div>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconFileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhuma proposta encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Entre em contato com seu consultor para solicitar uma proposta
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {proposals.map((proposal) => {
              const statusConfig = getStatusConfig(proposal.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          <IconFileText className="w-6 h-6 text-primary" />
                          {proposal.titulo}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {proposal.descricao}
                        </CardDescription>
                      </div>
                      <span className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <IconClock className="w-4 h-4" />
                          {new Date(proposal.data_criacao).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="font-semibold text-primary text-base">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(proposal.valor_total)}
                        </div>
                      </div>
                      <button className="text-sm font-medium text-primary hover:underline">
                        Ver detalhes →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
