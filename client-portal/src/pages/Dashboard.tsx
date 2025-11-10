import { useClientAuth } from '../contexts/ClientAuthContext'
import Layout from '../components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { IconFileText, IconFiles, IconUser, IconClock } from '@tabler/icons-react'

export default function Dashboard() {
  const { user } = useClientAuth()

  const stats = [
    {
      title: 'Propostas Ativas',
      value: '3',
      description: 'Em análise ou aprovadas',
      icon: IconFileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Documentos',
      value: '12',
      description: 'Disponíveis para download',
      icon: IconFiles,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Última Atualização',
      value: '2 dias',
      description: 'Atrás',
      icon: IconClock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bem-vindo, {user?.nome}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {user?.empresa_nome}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Suas últimas interações no portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <IconFileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nova proposta disponível</p>
                  <p className="text-sm text-muted-foreground">
                    Proposta comercial para serviços de SST
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Há 2 dias</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <IconFiles className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Documentos atualizados</p>
                  <p className="text-sm text-muted-foreground">
                    5 novos documentos disponíveis para download
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Há 5 dias</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                  <IconUser className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Perfil atualizado</p>
                  <p className="text-sm text-muted-foreground">
                    Suas informações de contato foram atualizadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Há 1 semana</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
