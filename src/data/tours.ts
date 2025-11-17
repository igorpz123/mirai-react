// src/data/tours.ts
import type { TourDefinition } from '@/lib/tourConfig'
import { tourButtons } from '@/lib/tourConfig'

// Tour de primeiro acesso (overview geral do sistema)
export const firstTimeTour: TourDefinition = {
  id: 'first-time',
  name: 'Bem-vindo ao Mirai',
  description: 'Tour de introdução para novos usuários',
  steps: [
    {
      id: 'welcome',
      title: '👋 Bem-vindo ao Mirai!',
      text: `
        <p class="mb-3">Olá! Este é um tour rápido para te ajudar a conhecer as principais funcionalidades do sistema.</p>
        <p>Vamos começar? Você pode pular este tour a qualquer momento.</p>
      `,
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'sidebar',
      title: '📁 Menu de Navegação',
      text: 'Este é o menu principal. Aqui você encontra acesso rápido a todas as funcionalidades do sistema.',
      attachTo: { element: '[data-tour="sidebar"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'search',
      title: '🔍 Busca Global',
      text: 'Use <kbd>Ctrl+K</kbd> para fazer buscas rápidas em tarefas, propostas, empresas e usuários de qualquer lugar do sistema.',
      attachTo: { element: '[data-tour="search"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'notifications',
      title: '🔔 Notificações',
      text: 'Aqui você recebe alertas em tempo real sobre tarefas, propostas e menções importantes.',
      attachTo: { element: '[data-tour="notifications"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'user-menu',
      title: '👤 Menu do Usuário',
      text: 'Acesse suas configurações, troque o tema (claro/escuro) e faça logout por aqui.',
      attachTo: { element: '[data-tour="user-menu"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tutorial',
      title: '📚 Tutoriais',
      text: 'Clique aqui para iniciar tours específicos de cada módulo.',
      attachTo: { element: '[data-tour="tutorial-button"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'help',
      title: '❓ Central de Ajuda',
      text: 'Precisa de ajuda? Clique aqui para iniciar tours específicos de cada módulo.',
      attachTo: { element: '[data-tour="help-button"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour do Dashboard
export const dashboardTour: TourDefinition = {
  id: 'dashboard',
  name: 'Tour do Dashboard',
  description: 'Aprenda a usar o dashboard e visualizar suas métricas',
  steps: [
    {
      id: 'dashboard-intro',
      title: '📊 Dashboard',
      text: 'O dashboard apresenta uma visão geral das suas tarefas, propostas e estatísticas importantes.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'dashboard-cards',
      title: '📈 Cards de Resumo',
      text: 'Estes cards mostram métricas rápidas: tarefas em andamento, pendentes, atrasadas e concluídas.',
      attachTo: { element: '[data-tour="stats-cards"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'dashboard-ranking',
      title: '🏆 Ranking',
      text: 'O ranking irá mostrar os usuários que mais concluíram tarefas em um determinado período de tempo na Unidade.',
      attachTo: { element: '[data-tour="dashboard-ranking"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'dashboard-nav',
      title: '🏆 Botões de Navegação',
      text: 'Você pode alternar a visão entre a tabela de tarefas e os gráficos.',
      attachTo: { element: '[data-tour="dashboard-nav"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'dashboard-table',
      title: '📋 Tabela de Tarefas',
      text: 'A tabela exibe uma lista detalhada das tarefas com filtros e opções de ordenação.',
      attachTo: { element: '[data-tour="technical-tasks-table"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: function() {
        return new Promise<void>((resolve) => {
          const tasksTab = document.querySelector('[data-tour="tab-tasks"]') as HTMLButtonElement
          if (tasksTab) {
            // Força múltiplos eventos para garantir que o Radix UI responda
            tasksTab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
            tasksTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
            tasksTab.click()
            tasksTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
            tasksTab.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
            setTimeout(() => resolve(), 500)
          } else {
            resolve()
          }
        })
      }
    },
    {
      id: 'dashboard-charts',
      title: '📊 Gráficos',
      text: 'Os gráficos mostram quantas tarefas foram concluídas por dia.',
      attachTo: { element: '[data-tour="dashboard-charts"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish],
      beforeShowPromise: function() {
        return new Promise<void>((resolve) => {
          const chartTab = document.querySelector('[data-tour="tab-chart"]') as HTMLButtonElement
          console.log('Tab Chart encontrado:', chartTab, 'Estado:', chartTab?.getAttribute('data-state'))
          if (chartTab) {
            // Força múltiplos eventos para garantir que o Radix UI responda
            chartTab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
            chartTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
            chartTab.click()
            chartTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
            chartTab.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
            setTimeout(() => resolve(), 500)
          } else {
            resolve()
          }
        })
      }
    }
  ]
}

// Tour de Tarefas
export const tasksTour: TourDefinition = {
  id: 'tasks',
  name: 'Tour de Tarefas',
  description: 'Aprenda a criar e gerenciar tarefas',
  steps: [
    {
      id: 'tasks-intro',
      title: '✅ Gerenciamento de Tarefas',
      text: 'Aqui você pode criar, visualizar e gerenciar todas as tarefas do sistema.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'tasks-new',
      title: '➕ Nova Tarefa',
      text: 'Clique aqui para criar uma nova tarefa. Você pode definir título, descrição, responsável, prazo e prioridade.',
      attachTo: { element: '[data-tour="new-task"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-filters',
      title: '🔍 Filtros de Tarefas',
      text: 'Use os filtros para encontrar tarefas por status, responsável, prioridade ou período.',
      attachTo: { element: '[data-tour="tasks-filters"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-list',
      title: '📋 Lista de Tarefas',
      text: 'Clique em qualquer tarefa para ver detalhes, adicionar comentários ou anexar arquivos.',
      attachTo: { element: '[data-tour="tasks-list"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Propostas
export const proposalsTour: TourDefinition = {
  id: 'proposals',
  name: 'Tour de Propostas',
  description: 'Aprenda a gerenciar propostas comerciais',
  steps: [
    {
      id: 'proposals-intro',
      title: '💼 Propostas Comerciais',
      text: 'Gerencie propostas, adicione itens, acompanhe valores e exporte documentos.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'proposals-new',
      title: '➕ Nova Proposta',
      text: 'Crie uma nova proposta selecionando a empresa, tipo de serviço e adicionando itens.',
      attachTo: { element: '[data-tour="new-proposal"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'proposals-status',
      title: '📊 Status da Proposta',
      text: 'Acompanhe o status: Em Elaboração, Enviada, Aprovada ou Recusada.',
      attachTo: { element: '[data-tour="proposals-status"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'proposals-export',
      title: '📄 Exportar Proposta',
      text: 'Exporte propostas em PDF ou Excel para enviar aos clientes.',
      attachTo: { element: '[data-tour="export-proposal"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Empresas
export const companiesTour: TourDefinition = {
  id: 'companies',
  name: 'Tour de Empresas',
  description: 'Aprenda a gerenciar empresas e clientes',
  steps: [
    {
      id: 'companies-intro',
      title: '🏢 Gerenciamento de Empresas',
      text: 'Cadastre empresas, gerencie dados, documentos e histórico de interações.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'companies-new',
      title: '➕ Nova Empresa',
      text: 'Adicione uma nova empresa com dados básicos, endereço e contatos.',
      attachTo: { element: '[data-tour="new-company"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'companies-auto-tasks',
      title: '🤖 Tarefas Automáticas',
      text: 'Configure tarefas automáticas que serão geradas periodicamente (ex: renovação de licenças).',
      attachTo: { element: '[data-tour="auto-tasks"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'companies-documents',
      title: '📁 Documentos',
      text: 'Anexe documentos importantes como contratos, licenças e laudos técnicos.',
      attachTo: { element: '[data-tour="documents"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Agenda
export const agendaTour: TourDefinition = {
  id: 'agenda',
  name: 'Tour da Agenda',
  description: 'Aprenda a usar a agenda e visualizar tarefas',
  steps: [
    {
      id: 'agenda-intro',
      title: '📅 Agenda de Tarefas',
      text: 'Visualize suas tarefas e eventos em formato de calendário.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'agenda-views',
      title: '👁️ Visualizações',
      text: 'Alterne entre visualização mensal, semanal e diária.',
      attachTo: { element: '[data-tour="agenda-views"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'agenda-users',
      title: '👥 Filtro de Usuários',
      text: 'Visualize a agenda de outros usuários da sua equipe (se tiver permissão).',
      attachTo: { element: '[data-tour="agenda-users"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'agenda-click',
      title: '🖱️ Criar Eventos',
      text: 'Clique em qualquer dia do calendário para criar uma nova tarefa ou evento.',
      attachTo: { element: '[data-tour="calendar"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Usuários (Admin)
export const usersTour: TourDefinition = {
  id: 'users',
  name: 'Tour de Usuários',
  description: 'Aprenda a gerenciar usuários e permissões',
  steps: [
    {
      id: 'users-intro',
      title: '👥 Gerenciamento de Usuários',
      text: 'Gerencie usuários, defina permissões e organize por unidades e setores.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'users-new',
      title: '➕ Novo Usuário',
      text: 'Cadastre novos usuários com e-mail, cargo e permissões específicas.',
      attachTo: { element: '[data-tour="new-user"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'users-permissions',
      title: '🔐 Permissões',
      text: 'Configure permissões granulares: admin, comercial, técnico, etc.',
      attachTo: { element: '[data-tour="permissions"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'users-units',
      title: '🏢 Unidades e Setores',
      text: 'Organize usuários em unidades e setores para melhor controle de acesso.',
      attachTo: { element: '[data-tour="units"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Exportar todos os tours
export const allTours: TourDefinition[] = [
  firstTimeTour,
  dashboardTour,
  tasksTour,
  proposalsTour,
  companiesTour,
  agendaTour,
  usersTour
]

// Helper para encontrar tour por ID
export const getTourById = (id: string): TourDefinition | undefined => {
  return allTours.find(tour => tour.id === id)
}
