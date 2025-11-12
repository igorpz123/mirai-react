// src/components/tour/FirstTimeTour.tsx
import { useEffect } from 'react'
import { useTour } from '@/contexts/TourContext'
import { useAuth } from '@/hooks/use-auth'

/**
 * Componente que inicia automaticamente o tour de primeira vez
 * para usuários que nunca viram o tour.
 */
export function FirstTimeTour() {
  const { startTour, hasSeenTour } = useTour()
  const { user } = useAuth()

  useEffect(() => {
    // Aguardar um pouco após o login para garantir que a UI está carregada
    const timer = setTimeout(() => {
      // Se o usuário está logado e nunca viu o tour de primeira vez
      if (user && !hasSeenTour('first-time')) {
        startTour('first-time')
      }
    }, 1500) // 1.5 segundos de delay

    return () => clearTimeout(timer)
  }, [user, hasSeenTour, startTour])

  return null
}
