// src/lib/tourConfig.ts

// Configuração global do Shepherd
export const tourDefaultOptions = {
  useModalOverlay: true,
  exitOnEsc: true,
  keyboardNavigation: true,
  defaultStepOptions: {
    classes: 'shepherd-theme-custom',
    scrollTo: { 
      behavior: 'smooth', 
      block: 'center' 
    },
    cancelIcon: {
      enabled: true
    },
    // Prevenir bugs de navegação
    canClickTarget: false,
    // Adicionar pequeno delay para prevenir race conditions
    modalOverlayOpeningPadding: 4,
    modalOverlayOpeningRadius: 4,
    // Configurações do Popper.js para melhor posicionamento
    popperOptions: {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 12] // 12px de distância do elemento
          }
        },
        {
          name: 'preventOverflow',
          options: {
            padding: 8,
            altAxis: true,
            tether: false
          }
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['bottom', 'top', 'right', 'left'],
            padding: 8
          }
        }
      ]
    }
  }
} as const

// Estilos customizados para os botões
export const tourButtons = {
  back: {
    text: '← Voltar',
    action() {
      // @ts-ignore - this refere-se ao Tour no contexto do Shepherd
      this.back()
    },
    classes: 'shepherd-button-secondary'
  },
  next: {
    text: 'Próximo →',
    action() {
      // @ts-ignore - this refere-se ao Tour no contexto do Shepherd
      this.next()
    },
    classes: 'shepherd-button-next'
  },
  finish: {
    text: '✓ Concluir',
    action() {
      // @ts-ignore - this refere-se ao Tour no contexto do Shepherd
      this.complete()
    },
    classes: 'button-success'
  },
  skip: {
    text: 'Pular Tour',
    action() {
      // @ts-ignore - this refere-se ao Tour no contexto do Shepherd
      this.cancel()
    },
    classes: 'shepherd-button-secondary'
  }
}

// Tipos de tours disponíveis
export type TourId = 
  | 'dashboard'
  | 'commercial-dashboard'
  | 'tasks'
  | 'detail-tasks'
  | 'proposals'
  | 'companies'
  | 'users'
  | 'agenda'
  | 'first-time'

export interface TourDefinition {
  id: TourId
  name: string
  description: string
  steps: any[]
}
