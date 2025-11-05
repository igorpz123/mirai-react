import React from 'react'
import { Button } from '@/components/ui/button'
import { IconHelp } from '@tabler/icons-react'
import { HelpDialog } from './HelpDialog'
import { useLocation } from 'react-router'

interface HelpButtonProps {
  moduleId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  autoDetect?: boolean // Nova prop para habilitar detecção automática
}

// Mapeamento de rotas para módulos de ajuda
const routeToModuleMap: Record<string, string> = {
  '/empresas': 'empresas',
  '/tarefas': 'tarefas',
  '/propostas': 'propostas',
  '/comercial/propostas': 'propostas',
  '/usuarios': 'usuarios',
  '/dashboard': 'dashboard',
  '/admin/dashboard': 'dashboard',
  '/technical/dashboard': 'dashboard',
  '/commercial/dashboard': 'dashboard',
  '/busca': 'busca',
  '/notificacoes': 'notificacoes',
}

// Função para detectar módulo baseado na rota atual
function detectModuleFromRoute(pathname: string): string | undefined {
  // Tenta match exato primeiro
  if (routeToModuleMap[pathname]) {
    return routeToModuleMap[pathname]
  }
  
  // Tenta match parcial (ex: /empresas/123 → empresas)
  for (const [route, moduleId] of Object.entries(routeToModuleMap)) {
    if (pathname.startsWith(route)) {
      return moduleId
    }
  }
  
  return undefined
}

export function HelpButton({ 
  moduleId, 
  variant = 'outline', 
  size = 'sm', 
  className,
  autoDetect = false 
}: HelpButtonProps) {
  const [open, setOpen] = React.useState(false)
  const location = useLocation()
  
  // Se autoDetect está ativo e nenhum moduleId foi passado, detecta da rota
  const detectedModuleId = autoDetect && !moduleId 
    ? detectModuleFromRoute(location.pathname)
    : moduleId

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
        title="Ajuda"
      >
        <IconHelp size={18} />
        {size !== 'icon' && <span className="ml-2">Ajuda</span>}
      </Button>
      <HelpDialog open={open} onOpenChange={setOpen} moduleId={detectedModuleId} />
    </>
  )
}
