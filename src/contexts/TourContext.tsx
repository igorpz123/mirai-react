// src/contexts/TourContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import type { TourId } from '@/lib/tourConfig'
import { tourDefaultOptions } from '@/lib/tourConfig'
import { getTourById } from '@/data/tours'

interface TourContextType {
  startTour: (tourId: TourId) => void
  currentTour: typeof Shepherd.Tour.prototype | null
  isAnyTourActive: boolean
  hasSeenTour: (tourId: TourId) => boolean
  markTourAsSeen: (tourId: TourId) => void
  resetTours: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

const STORAGE_KEY = 'mirai_tours_seen'

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<typeof Shepherd.Tour.prototype | null>(null)
  const [seenTours, setSeenTours] = useState<Set<TourId>>(new Set())

  // Cleanup: destruir tour ao desmontar
  useEffect(() => {
    return () => {
      if (currentTour) {
        try {
          currentTour.complete()
        } catch (e) {
          // Ignorar erros de cleanup
        }
      }
    }
  }, [currentTour])

  // Carregar tours já vistos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TourId[]
        setSeenTours(new Set(parsed))
      }
    } catch (error) {
      console.error('Erro ao carregar tours vistos:', error)
    }
  }, [])

  // Verificar se há um tour pendente no localStorage (após redirecionamento)
  useEffect(() => {
    let hasChecked = false // Previne múltiplas execuções
    
    const checkPendingTour = () => {
      if (hasChecked) return
      
      const pendingTour = localStorage.getItem('pendingTour') as TourId | null
      const timestamp = localStorage.getItem('pendingTourTimestamp')
      
      if (pendingTour) {
        hasChecked = true // Marca como verificado
        
        // Verifica se o timestamp não é muito antigo (evita tours pendentes de dias atrás)
        const now = Date.now()
        const tourTime = timestamp ? parseInt(timestamp) : 0
        const timeDiff = now - tourTime
        
        // Se passou mais de 30 segundos, ignora (provavelmente não é um redirect recente)
        if (timeDiff > 30000) {
          localStorage.removeItem('pendingTour')
          localStorage.removeItem('pendingTourTimestamp')
          return
        }
        
        // Limpa o localStorage
        localStorage.removeItem('pendingTour')
        localStorage.removeItem('pendingTourTimestamp')
        
        // Aguarda um pouco para a página estar completamente carregada
        setTimeout(() => {
          startTour(pendingTour)
        }, 1500) // Aguarda 1.5s para garantir que a página está pronta
      }
    }
    
    // Verifica ao montar
    checkPendingTour()
    
    return () => {
      // Cleanup
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Salvar tours vistos no localStorage
  const saveSeenTours = useCallback((tours: Set<TourId>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...tours]))
    } catch (error) {
      console.error('Erro ao salvar tours vistos:', error)
    }
  }, [])

  const hasSeenTour = useCallback((tourId: TourId): boolean => {
    return seenTours.has(tourId)
  }, [seenTours])

  const markTourAsSeen = useCallback((tourId: TourId) => {
    setSeenTours(prev => {
      const newSet = new Set(prev)
      newSet.add(tourId)
      saveSeenTours(newSet)
      return newSet
    })
  }, [saveSeenTours])

  const resetTours = useCallback(() => {
    setSeenTours(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const startTour = useCallback((tourId: TourId) => {
    // Buscar definição do tour ANTES de fazer qualquer coisa
    const tourDefinition = getTourById(tourId)
    if (!tourDefinition) {
      console.error(`Tour não encontrado: ${tourId}`)
      return
    }

    // Verificar se o tour precisa de redirecionamento
    // Tours que começam em páginas específicas
    const tourRequiresPage: Record<string, string | ((user: any) => string)> = {
      'detail-tasks': '/nova-tarefa',
      'proposals': '/comercial/proposta/nova',
      'dashboard': (user: any) => {
        // Se for admin (cargoId 1, 2 ou 3), vai para admin/dashboard-technical
        // Caso contrário, vai para technical/dashboard
        const isAdmin = user?.cargoId === 1 || user?.cargoId === 2 || user?.cargoId === 3
        return isAdmin ? '/admin/dashboard-technical' : '/technical/dashboard'
      },
      'commercial-dashboard': (user: any) => {
        // Se for admin (cargoId 1, 2 ou 3), vai para admin/dashboard-commercial
        // Caso contrário, vai para commercial/dashboard
        const isAdmin = user?.cargoId === 1 || user?.cargoId === 2 || user?.cargoId === 3
        return isAdmin ? '/admin/dashboard-commercial' : '/commercial/dashboard'
      },
      // Adicione outros tours que precisam de páginas específicas aqui
    }

    const requiredPageOrFn = tourRequiresPage[tourId]
    let requiredPage: string | null = null

    // Se for uma função, pega o usuário do localStorage e calcula a página
    if (typeof requiredPageOrFn === 'function') {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          requiredPage = requiredPageOrFn(payload)
        }
      } catch (e) {
        console.error('Erro ao decodificar token:', e)
      }
    } else if (typeof requiredPageOrFn === 'string') {
      requiredPage = requiredPageOrFn
    }

    if (requiredPage && window.location.pathname !== requiredPage) {
      // Salva o tour pendente ANTES de redirecionar (usando localStorage para garantir persistência)
      localStorage.setItem('pendingTour', tourId)
      localStorage.setItem('pendingTourTimestamp', Date.now().toString())
      
      // Redireciona
      window.location.href = requiredPage
      return // Não continua, a página vai recarregar
    }
    
    // Cancelar tour ativo
    if (currentTour) {
      try {
        currentTour.cancel()
      } catch (e) {
        console.warn('Erro ao cancelar tour anterior:', e)
      }
      setCurrentTour(null)
    }

    // Pequeno delay para garantir que o tour anterior foi completamente destruído
    setTimeout(() => {

      // Criar nova instância do Shepherd
      const tour = new Shepherd.Tour({
        ...tourDefaultOptions,
        tourName: tourId
      })

      // Adicionar steps
      tourDefinition.steps.forEach((step) => {
        tour.addStep({
          ...step,
          when: {
            show() {
              if (step.attachTo && typeof step.attachTo === 'object' && 'element' in step.attachTo) {
                const element = document.querySelector(step.attachTo.element as string)
                if (!element) {
                  console.warn(`Elemento não encontrado: ${step.attachTo.element}`)
                }
              }
            }
          }
        })
      })

      // Handlers do tour
      tour.on('complete', () => {
        markTourAsSeen(tourId)
        setCurrentTour(null)
      })

      tour.on('cancel', () => {
        setCurrentTour(null)
      })

      tour.on('destroy', () => {
        setCurrentTour(null)
      })

      // Iniciar tour
      try {
        tour.start()
        setCurrentTour(tour)
      } catch (error) {
        console.error('Erro ao iniciar tour:', error)
        setCurrentTour(null)
      }
    }, 100)
  }, [currentTour, markTourAsSeen])

  const isAnyTourActive = currentTour !== null

  return (
    <TourContext.Provider
      value={{
        startTour,
        currentTour,
        isAnyTourActive,
        hasSeenTour,
        markTourAsSeen,
        resetTours
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour deve ser usado dentro de TourProvider')
  }
  return context
}
