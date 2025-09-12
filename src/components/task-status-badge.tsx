import React from 'react'
import { Badge } from '@/components/ui/badge'
import { IconCircleCheckFilled, IconProgress, IconLoader } from '@tabler/icons-react'

export interface TaskStatusBadgeProps {
  status?: string | null
  className?: string
}

export const getStatusText = (status?: string | null): string => {
  switch (status) {
    case 'progress':
      return 'Em Andamento'
    case 'concluída':
      return 'Concluída'
    case 'pendente':
      return 'Pendente'
    default:
      return status || '—'
  }
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className }) => {
  if (!status) return null
  const text = getStatusText(status)
  let badgeClass = ''
  let icon: React.ReactNode = null

  if (status === 'concluída') {
    badgeClass = 'button-success'
    icon = <IconCircleCheckFilled className="mr-1 size-4 fill-green-500 dark:fill-green-400" />
  } else if (status === 'progress') {
    badgeClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50'
    icon = <IconProgress className="mr-1 size-4" />
  } else if (status === 'pendente') {
    badgeClass = 'button-primary'
    icon = <IconLoader className="mr-1 size-4 animate-spin" />
  }

  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 ${badgeClass} ${className || ''}`}>
      {icon}
      {text}
    </Badge>
  )
}

export default TaskStatusBadge
