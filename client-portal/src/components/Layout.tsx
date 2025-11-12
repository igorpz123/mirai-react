import { ReactNode } from 'react'
import { useClientAuth } from '../contexts/ClientAuthContext'
import { Button } from './ui/button'
import { IconLogout, IconFileText, IconFiles, IconUser, IconChartBar } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import { ThemeToggle } from './ThemeToggle'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useClientAuth()
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: IconChartBar },
    { path: '/propostas', label: 'Propostas', icon: IconFileText },
    { path: '/documentos', label: 'Documentos', icon: IconFiles },
    { path: '/perfil', label: 'Perfil', icon: IconUser },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Oeste SST" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Portal do Cliente
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Oeste SST
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.empresa_nome}
                </p>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <IconLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'text-primary border-primary'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 Oeste SST. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
