// src/components/MetricCard.tsx
import type { ComponentType } from 'react'
import { Card, CardContent } from '../ui/card'

type Color = 'blue' | 'yellow' | 'red' | 'green'

interface MetricCardProps {
  title: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  color?: Color
}

const colorClasses: Record<Color, string> = {
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  green: 'text-green-600',
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
}: MetricCardProps) {
  const textColor = colorClasses[color]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-12 w-12 ${textColor}`} />
          </div>
          <div className="ml-4">
            <h2 className={`text-xl font-semibold ${textColor}`}>{title}</h2>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}