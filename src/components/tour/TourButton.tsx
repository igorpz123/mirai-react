// src/components/tour/TourButton.tsx
import { GraduationCap, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTour } from '@/contexts/TourContext'
import { allTours } from '@/data/tours'
import type { TourId } from '@/lib/tourConfig'
import { CheckCircle2, Circle } from 'lucide-react'

interface TourButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showText?: boolean
  autoStartTourId?: TourId
}

export function TourButton({ 
  variant = 'ghost', 
  size = 'icon',
  showText = false,
  autoStartTourId
}: TourButtonProps) {
  const { startTour, hasSeenTour, resetTours } = useTour()

  const handleTourClick = (tourId: TourId) => {
    startTour(tourId)
  }

  const handleResetTours = () => {
    if (confirm('Tem certeza que deseja resetar todos os tours? Você poderá vê-los novamente.')) {
      resetTours()
    }
  }

  // Se autoStartTourId for fornecido, renderiza apenas o botão simples
  if (autoStartTourId) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleTourClick(autoStartTourId)}
        data-tour="help-button"
      >
        <GraduationCap className="h-5 w-5" />
        {showText && <span className="ml-2">Iniciar Tour</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} data-tour="tutorial-button">
          <GraduationCap className="h-5 w-5" />
          {showText && <span className="ml-2">Tours Interativos</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Tours Interativos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allTours.map((tour) => {
          const seen = hasSeenTour(tour.id)
          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => handleTourClick(tour.id)}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                {seen ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium">{tour.name}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {tour.description}
              </p>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleResetTours}
          className="text-muted-foreground cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar todos os tours
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
