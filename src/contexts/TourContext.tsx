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
      // Buscar definição do tour
      const tourDefinition = getTourById(tourId)
      if (!tourDefinition) {
        console.error(`Tour não encontrado: ${tourId}`)
        return
      }

      // Criar nova instância do Shepherd
      const tour = new Shepherd.Tour({
        ...tourDefaultOptions,
        // Garantir que a configuração não sobrescreve handlers
        tourName: tourId
      })

      // Adicionar steps
      tourDefinition.steps.forEach((step, index) => {
        tour.addStep({
          ...step,
          // Garantir que elementos existam antes de anexar
          when: {
            show() {
              if (step.attachTo && typeof step.attachTo === 'object' && 'element' in step.attachTo) {
                const element = document.querySelector(step.attachTo.element as string)
                if (!element) {
                  console.warn(`[Step ${index}] Elemento não encontrado: ${step.attachTo.element}`)
                }
              }
            },
            hide() {
              // Cleanup quando step é ocultado
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

      // Cleanup quando tour é destruído
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
    }, 100) // Delay de 100ms para prevenir race conditions
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
