import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader,
  IconProgress,
  IconCircleCheckFilled,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react'

export interface ProposalStatusBadgeProps {
  status?: string | null
  className?: string
}

const getProposalStatusText = (status?: string | null): string => {
  switch ((status || '').toLowerCase()) {
    case 'andamento':
    case 'progress':
      return 'Em Andamento'
    case 'analise':
    case 'análise':
      return 'Em Análise'
    case 'pendente':
      return 'Pendente'
    case 'aprovada':
      return 'Aprovada'
    case 'rejeitada':
    case 'recusada':
      return 'Rejeitada'
    default:
      return status || '—'
  }
}

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ status, className }) => {
  if (!status) return null
  const key = (status || '').toLowerCase()
  const text = getProposalStatusText(status)

  let variantClass = ''
  let icon: React.ReactNode = null

  if (key === 'aprovada') {
    variantClass = 'button-success'
    icon = <IconCircleCheckFilled className="mr-1 size-4 fill-green-500 dark:fill-green-400" />
  } else if (key === 'andamento' || key === 'progress') {
    variantClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
    icon = <IconProgress className="mr-1 size-4" />
  } else if (key === 'analise' || key === 'análise') {
    variantClass = 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50'
    icon = <IconAlertTriangle className="mr-1 size-4" />
  } else if (key === 'pendente') {
    variantClass = 'button-primary'
    icon = <IconLoader className="mr-1 size-4 animate-spin" />
  } else if (key === 'rejeitada' || key === 'recusada') {
    variantClass = 'text-destructive bg-destructive/10 hover:bg-destructive/20'
    icon = <IconX className="mr-1 size-4" />
  }

  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 ${variantClass} ${className || ''}`}>
      {icon}
      {text}
    </Badge>
  )
}

export default ProposalStatusBadge
