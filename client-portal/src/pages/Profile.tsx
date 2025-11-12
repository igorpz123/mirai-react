import { useClientAuth } from '../contexts/ClientAuthContext'
import Layout from '../components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { IconBuilding, IconMail, IconPhone, IconUser } from '@tabler/icons-react'

export default function Profile() {
  const { user } = useClientAuth()

  return (
    <Layout>
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meu Perfil
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Dados cadastrais da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razao-social" className="flex items-center gap-2">
                  <IconBuilding className="w-4 h-4" />
                  Razão Social
                </Label>
                <Input
                  id="razao-social"
                  value={user?.empresa_nome || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                <Input
                  id="nome-fantasia"
                  value={user?.empresa_nome_fantasia || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={user?.empresa_cnpj || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Seus dados de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <IconUser className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={user?.nome || ''}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <IconMail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <IconPhone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={user?.telefone || ''}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">
                  Cancelar
                </Button>
                <Button>
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button>
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
