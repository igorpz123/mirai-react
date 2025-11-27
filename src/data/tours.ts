// src/data/tours.ts
import type { TourDefinition } from '@/lib/tourConfig'
import { tourButtons } from '@/lib/tourConfig'

// Helper function para aguardar elemento estar visível e renderizado
function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkElement = () => {
      const element = document.querySelector(selector)

      if (element) {
        // Verifica se o elemento está visível
        const rect = element.getBoundingClientRect()
        const isVisible = rect.width > 0 && rect.height > 0

        if (isVisible) {
          resolve(element)
          return
        }
      }

      // Timeout de segurança
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: elemento ${selector} não encontrado`))
        return
      }

      // Tenta novamente
      setTimeout(checkElement, 100)
    }

    checkElement()
  })
}

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
      id: 'user-menu',
      title: '👤 Menu do Usuário',
      text: 'Acesse suas configurações, tarefas/propostas modificadas recentemente e faça logout por aqui.',
      attachTo: { element: '[data-tour="user-menu"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'mode',
      title: '🌓 Alterar o Tema',
      text: 'Aqui você pode alternar entre o tema claro e escuro do sistema.',
      attachTo: { element: '[data-tour="mode-toggle"]', on: 'bottom' },
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
      id: 'help',
      title: '❓ Central de Ajuda',
      text: 'Precisa de ajuda? Clique aqui para iniciar tours específicos de cada módulo.',
      attachTo: { element: '[data-tour="help-button"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tutorial',
      title: '📚 Tutoriais',
      text: 'Clique aqui para iniciar tours específicos de cada módulo.',
      attachTo: { element: '[data-tour="tutorial-button"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour do Dashboard
export const dashboardTour: TourDefinition = {
  id: 'dashboard',
  name: 'Tour do Dashboard Técnico',
  description: 'Aprenda a usar o dashboard e visualizar suas métricas',
  requiredPermission: 'tecnico', // Apenas usuários com permissão técnico podem ver este tour
  steps: [
    {
      id: 'dashboard-intro',
      title: '📊 Dashboard',
      text: 'O dashboard apresenta uma visão geral das suas tarefas e estatísticas importantes.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'dashboard-search-tasks',
      title: 'Busca de Tarefas',
      text: 'Use a busca para encontrar tarefas rapidamente através de seu ID.',
      attachTo: { element: '[data-tour="search-by-id"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
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
      title: 'Botões de Navegação',
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
        return new Promise<void>((resolve) => {
          const chartTab = document.querySelector('[data-tour="tab-chart"]') as HTMLButtonElement
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

// Tour do Dashboard Comercial
export const commercialDashboardTour: TourDefinition = {
  id: 'commercial-dashboard',
  name: 'Tour do Dashboard Comercial',
  description: 'Aprenda a usar o dashboard comercial e visualizar suas métricas de vendas',
  requiredPermission: 'comercial', // Apenas usuários com permissão comercial podem ver este tour
  steps: [
    {
      id: 'commercial-intro',
      title: '💼 Dashboard Comercial',
      text: 'O dashboard comercial apresenta uma visão geral das suas propostas, estatísticas de vendas e comissões.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'commercial-search',
      title: '🔍 Busca de Propostas',
      text: 'Use a busca para encontrar propostas rapidamente através do seu número de identificação.',
      attachTo: { element: '[data-tour="search-by-id"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'commercial-stats',
      title: '📈 Cards de Estatísticas',
      text: `
        <p class="mb-3">Estes cards mostram suas principais métricas comerciais:</p>
        <ul class="list-disc list-inside space-y-1 mb-2">
          <li><strong>Propostas Criadas:</strong> Total de propostas criadas no mês</li>
          <li><strong>Propostas Aprovadas:</strong> Propostas que foram aprovadas</li>
          <li><strong>Valor Total Aprovado:</strong> Soma dos valores aprovados</li>
          <li><strong>Comissão:</strong> Sua comissão calculada (5% responsável + 2% indicação)</li>
        </ul>
        <p class="text-sm">As setas indicam a tendência em relação ao período anterior.</p>
      `,
      attachTo: { element: '[data-tour="commercial-stats-cards"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'commercial-pie',
      title: '🍰 Gráfico de Status',
      text: `
        <p class="mb-2">O gráfico de pizza mostra a distribuição das suas propostas por status:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>Pendentes</li>
          <li>Em Análise</li>
          <li>Em Andamento</li>
          <li>Aprovadas</li>
          <li>Rejeitadas</li>
        </ul>
      `,
      attachTo: { element: '[data-tour="commercial-pie-chart"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'commercial-summary',
      title: '📊 Cards de Resumo',
      text: 'Estes cards complementam o gráfico, mostrando a quantidade de propostas pendentes, em análise e em andamento com barras de progresso visuais.',
      attachTo: { element: '[data-tour="commercial-summary-cards"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'commercial-table',
      title: '📋 Tabela de Propostas',
      text: `
        <p class="mb-3">A tabela exibe todas as suas propostas com informações detalhadas:</p>
        <ul class="list-disc list-inside space-y-1 mb-2">
          <li>Filtros por status e responsável</li>
          <li>Busca por empresa, título ou número</li>
          <li>Ações rápidas: recalcular, atualizar status, excluir</li>
          <li>Link direto para visualização completa</li>
        </ul>
        <p class="text-sm">💡 <strong>Dica:</strong> Clique no menu de ações (três pontos) para gerenciar cada proposta.</p>
      `,
      attachTo: { element: '[data-tour="commercial-proposals-table"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Tarefas
export const tasksTour: TourDefinition = {
  id: 'tasks',
  name: 'Visualizar Tarefas',
  description: 'Aprenda aonde criar e visualizar tarefas',
  requiredPermission: 'tecnico', // Apenas usuários com permissão técnico podem ver este tour
  steps: [
    {
      id: 'tasks-options',
      title: '✅ Visualização de Tarefas',
      text: 'Você pode visualizar suas tarefas em duas páginas: através do Dashboard Técnico e no Fluxograma.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'tasks-option-dashboard',
      title: '📊 Dashboard',
      text: 'No dashboard você irá visualizar todas as suas tarefas, sem distinção de setores.',
      attachTo: { element: '[data-tour="tasks-dashboard"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-option-fluxograma',
      title: '🔄 Fluxograma',
      text: 'No fluxograma você pode visualizar suas tarefas separadas por setores.',
      attachTo: { element: '[data-tour="tasks-fluxograma"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-new',
      title: '➕ Nova Tarefa',
      text: 'Clique aqui para criar uma nova tarefa ou clique Ctrl + K para abrir a busca rápida',
      attachTo: { element: '[data-tour="search"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    }
  ]
}

// Tour de Criação de Tarefas
export const detailTasksTour: TourDefinition = {
  id: 'detail-tasks',
  name: 'Criar Tarefas',
  description: 'Aprenda a criar uma tarefa do 0',
  requiredPermission: 'tecnico', // Apenas usuários com permissão técnico podem ver este tour
  steps: [
    {
      id: 'tasks-create',
      title: '➕ Nova Tarefa',
      text: 'Você aprenderá agora como criar uma nova tarefa do zero.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'tasks-create-company',
      title: '🏢 Empresa',
      text: 'O primeiro passo é selecionar a empresa, toda tarefa é vinculada a uma empresa.',
      attachTo: { element: '[data-tour="tasks-create-company"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          await waitForElement('[data-tour="tasks-create-company"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento empresa:', err)
        }
      }
    },
    {
      id: 'tasks-create-unity',
      title: '🏢 Unidade',
      text: 'Irão aparecer apenas as empresas vinculadas a unidade selecionada. Caso necessário, troque de unidade clicando aqui.',
      attachTo: { element: '[data-tour="tour-unity"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'tasks-create-setor',
      title: '🏭 Setor',
      text: 'Após, você irá selecionar o setor responsável pela tarefa.',
      attachTo: { element: '[data-tour="tasks-create-setor"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: function () {
        return new Promise<void>((resolve) => {
          // Procura pelo botão "Próximo" que avança para o step 2
          const nextButton = document.querySelector('.button-primary') as HTMLButtonElement
          if (nextButton && nextButton.textContent?.includes('Próximo')) {
            nextButton.click()
            // Aguarda a renderização do próximo step
            setTimeout(() => resolve(), 500)
          } else {
            resolve()
          }
        })
      }
    },
    {
      id: 'tasks-create-user',
      title: '👤 Responsável',
      text: 'Depois de selecionar o setor, você poderá selecionar um responsável. Não é obrigatório colocar um responsável.',
      attachTo: { element: '[data-tour="tasks-create-user"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-create-finalidade',
      title: '🎯 Finalidade',
      text: 'Selecione a finalidade da tarefa, ou seja, seu objetivo.',
      attachTo: { element: '[data-tour="tasks-create-finalidade"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-create-prazo',
      title: '⏰ Prazo',
      text: 'Selecione o prazo para a conclusão da tarefa.',
      attachTo: { element: '[data-tour="tasks-create-prazo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-create-prioridade',
      title: '⚡ Prioridade',
      text: 'Selecione a prioridade da tarefa, sendo baixa, média e alta.',
      attachTo: { element: '[data-tour="tasks-create-prioridade"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-create-arquivos',
      title: '📁 Arquivos',
      text: 'Você também poderá anexar arquivos relevantes à tarefa, se necessário. Arquivos relevantes são todos aqueles que irão auxiliar no desenvolvimento da tarefa.',
      attachTo: { element: '[data-tour="tasks-create-arquivos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: function () {
        return new Promise<void>((resolve) => {
          // Procura pelo botão "Próximo" que avança para o step 3
          const nextButton = document.querySelector('.button-primary') as HTMLButtonElement
          if (nextButton && nextButton.textContent?.includes('Próximo')) {
            nextButton.click()
            // Aguarda a renderização do próximo step
            setTimeout(() => resolve(), 500)
          } else {
            resolve()
          }
        })
      }
    },
    {
      id: 'tasks-create-observacoes',
      title: '📝 Observações',
      text: 'Por fim, você poderá adicionar observações adicionais sobre a tarefa.',
      attachTo: { element: '[data-tour="tasks-create-observacoes"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'tasks-create-conclusao',
      title: '📝 Conclusão',
      text: 'Depois de preencher todos os campos obrigatórios, você poderá concluir a criação da tarefa que será feita automaticamente',
      attachTo: { element: '[data-tour="tasks-create-conclusao"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.finish]
    },
  ]
}

// Tour de Propostas
export const newProposalsTour: TourDefinition = {
  id: 'proposals',
  name: 'Criar Nova Proposta',
  description: 'Aprenda a criar uma nova proposta comercial',
  steps: [
    {
      id: 'proposals-intro',
      title: '💼 Propostas Comerciais',
      text: 'Nesse tour você irá aprender a criar uma nova proposta comercial do 0. Para acessar a página de novas propostas, utilize o menu lateral indo em CRM > Criar Proposta ou o atalho Ctrl + K.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'proposals-progress',
      title: '📊 Barra de Progresso',
      text: `
        <p class="mb-3">A barra de progresso mostra visualmente em qual etapa você está e quais já foram concluídas.</p>
        <p class="mb-2"><strong>Indicadores de Status:</strong></p>
        <ul class="list-disc list-inside space-y-1 mb-3">
          <li><span class="text-green-600 font-semibold">Verde</span>: Etapa concluída com sucesso</li>
          <li><span class="text-red-600 font-semibold">Vermelho</span>: Algo pendente ou inválido nesta etapa</li>
          <li><span class="text-primary font-semibold">Azul/Destacado</span>: Etapa atual</li>
          <li><span class="text-muted-foreground">Cinza</span>: Etapa ainda não iniciada</li>
        </ul>
        <p class="text-sm">💡 <strong>Dica:</strong> Você pode clicar em qualquer etapa para navegar diretamente para ela!</p>
      `,
      attachTo: { element: '.border-2.shadow-lg', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'proposals-new',
      title: '➕ Nova Proposta',
      text: 'O primeiro passo será selecionar a empresa digitando seu CNPJ ou CPF, sem ponto ou traço.',
      attachTo: { element: '[data-tour="new-proposal-company"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-company-type',
      title: 'Tipo de Documento',
      text: 'Você pode selecionar o tipo de documento que será utilizado para buscar a empresa: CNPJ ou CPF.',
      attachTo: { element: '[data-tour="new-proposal-company-type"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-company-info',
      title: '🏢 Empresa',
      text: 'Caso a empresa já esteja cadastrada no sistema, as informações serão preenchidas automaticamente. Caso contrário, deverão ser preenchidas manualmente.',
      attachTo: { element: '[data-tour="new-proposal-company-info"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          // Aguarda um pouco para garantir que a página está carregada
          await new Promise(resolve => setTimeout(resolve, 300))

          // Clica no botão de step 2 diretamente
          const step2Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Empresa') && btn.classList.contains('group')
          ) as HTMLButtonElement

          if (step2Button) {
            step2Button.click()
            // Aguarda a transição para o step 2
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          // Aguarda o elemento estar visível
          await waitForElement('[data-tour="new-proposal-company-info"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento empresa info:', err)
        }
      }
    },
    {
      id: 'new-proposal-programas',
      title: 'Programas',
      text: 'Após preencher as informações das empresas, você poderá preencher os programas relacionados à proposta, sendo os Programas de Convênio.',
      attachTo: { element: '[data-tour="new-proposal-programas"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          // Aguarda um pouco para garantir que a página está carregada
          await new Promise(resolve => setTimeout(resolve, 300))

          // Clica no botão de step 3 (Programas) diretamente
          const step3Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Programas') && btn.classList.contains('group')
          ) as HTMLButtonElement

          if (step3Button) {
            step3Button.click()
            // Aguarda a transição para o step 3
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          // Aguarda o elemento estar visível
          await waitForElement('[data-tour="new-proposal-programas"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento programas:', err)
        }
      }
    },
    {
      id: 'new-proposal-programas-select',
      title: 'Selecione o Programa',
      text: 'Selecione o programa desejado para a proposta.',
      attachTo: { element: '[data-tour="new-proposal-programas-select"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-programas-quantidade',
      title: 'Quantidade',
      text: 'Selecione a quantidade. A quantidade se refere a quantidade de colaboradores presentes na empresa.',
      attachTo: { element: '[data-tour="new-proposal-programas-quantidade"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-programas-desconto',
      title: 'Desconto',
      text: 'Selecione o desconto aplicado ao programa. Nos programas de convênio, o desconto é aplicado sobre o valor mensal do programa. Então, o desconto total será o valor do desconto x 12 (meses).',
      attachTo: { element: '[data-tour="new-proposal-programas-desconto"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-programas-acrescimo',
      title: 'Acréscimo',
      text: 'Selecione o acréscimo aplicado ao programa. Nos programas de convênio, o acréscimo é aplicado sobre o valor mensal do programa. Então, o acréscimo total será o valor do acréscimo x 12 (meses).',
      attachTo: { element: '[data-tour="new-proposal-programas-acrescimo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-programas-finish',
      title: 'Adicionar Programa',
      text: 'Por fim, clique no botão para adicionar o programa à proposta.',
      attachTo: { element: '[data-tour="new-proposal-programas-finish"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-cursos',
      title: '📚 Cursos',
      text: 'Agora você pode adicionar cursos à proposta. Este passo é opcional - você pode pular se não houver cursos.',
      attachTo: { element: '[data-tour="new-proposal-cursos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          const step4Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Cursos') && btn.classList.contains('group')
          ) as HTMLButtonElement
          if (step4Button) {
            step4Button.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          await waitForElement('[data-tour="new-proposal-cursos"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento cursos:', err)
        }
      }
    },
    {
      id: 'new-proposal-cursos-select',
      title: 'Selecione o Curso',
      text: 'Escolha o curso que deseja adicionar à proposta.',
      attachTo: { element: '[data-tour="new-proposal-cursos-select"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-cursos-quantidade',
      title: 'Quantidade',
      text: 'Informe a quantidade de participantes do curso.',
      attachTo: { element: '[data-tour="new-proposal-cursos-quantidade"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-cursos-desconto',
      title: 'Desconto',
      text: 'Aplique um desconto se necessário. Pode ser em valor fixo (R$) ou percentual (%).',
      attachTo: { element: '[data-tour="new-proposal-cursos-desconto"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-cursos-finish',
      title: 'Adicionar Curso',
      text: 'Clique aqui para adicionar o curso à proposta.',
      attachTo: { element: '[data-tour="new-proposal-cursos-finish"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-quimicos',
      title: '🧪 Químicos',
      text: 'Adicione químicos à proposta. Este passo também é opcional.',
      attachTo: { element: '[data-tour="new-proposal-quimicos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          const step5Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Químicos') && btn.classList.contains('group')
          ) as HTMLButtonElement
          if (step5Button) {
            step5Button.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          await waitForElement('[data-tour="new-proposal-quimicos"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento químicos:', err)
        }
      }
    },
    {
      id: 'new-proposal-quimicos-select',
      title: 'Selecione o Químico',
      text: 'Escolha o grupo químico que deseja incluir na proposta.',
      attachTo: { element: '[data-tour="new-proposal-quimicos-select"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-quimicos-pontos',
      title: 'Pontos',
      text: 'Informe a quantidade de pontos de análise química.',
      attachTo: { element: '[data-tour="new-proposal-quimicos-pontos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-quimicos-desconto',
      title: 'Desconto',
      text: 'Aplique um desconto se necessário. Pode ser em valor fixo (R$) ou percentual (%).',
      attachTo: { element: '[data-tour="new-proposal-quimicos-desconto"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-quimicos-finish',
      title: 'Adicionar Químico',
      text: 'Clique aqui para adicionar o químico à proposta.',
      attachTo: { element: '[data-tour="new-proposal-quimicos-finish"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-produtos',
      title: '📦 Produtos',
      text: 'Adicione produtos à proposta. Este é o último step opcional antes de finalizar.',
      attachTo: { element: '[data-tour="new-proposal-produtos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          const step6Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Produtos') && btn.classList.contains('group')
          ) as HTMLButtonElement
          if (step6Button) {
            step6Button.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          await waitForElement('[data-tour="new-proposal-produtos"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento produtos:', err)
        }
      }
    },
    {
      id: 'new-proposal-produtos-select',
      title: 'Selecione o Produto',
      text: 'Escolha o produto que deseja adicionar à proposta.',
      attachTo: { element: '[data-tour="new-proposal-produtos-select"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-produtos-quantidade',
      title: 'Quantidade',
      text: 'Informe a quantidade do produto.',
      attachTo: { element: '[data-tour="new-proposal-produtos-quantidade"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-produtos-desconto',
      title: 'Desconto',
      text: 'Aplique um desconto se necessário. Pode ser em valor fixo (R$) ou percentual (%).',
      attachTo: { element: '[data-tour="new-proposal-produtos-desconto"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-produtos-finish',
      title: 'Adicionar Produto',
      text: 'Clique aqui para adicionar o produto à proposta.',
      attachTo: { element: '[data-tour="new-proposal-produtos-finish"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info',
      title: '📋 Informações da Proposta',
      text: 'Agora vamos finalizar preenchendo as informações gerais da proposta.',
      attachTo: { element: '[data-tour="new-proposal-info"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
      beforeShowPromise: async function () {
        try {
          await new Promise(resolve => setTimeout(resolve, 300))
          // Buscar pelo texto correto do botão: "Proposta" ao invés de "Informações"
          const step7Button = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Proposta') && btn.classList.contains('group')
          ) as HTMLButtonElement
          if (step7Button) {
            step7Button.click()
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          await waitForElement('[data-tour="new-proposal-info"]')
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (err) {
          console.error('Erro ao aguardar elemento info:', err)
        }
      }
    },
    {
      id: 'new-proposal-info-titulo',
      title: 'Título da Proposta',
      text: 'Dê um título descritivo para a proposta. Este campo é obrigatório.',
      attachTo: { element: '[data-tour="new-proposal-info-titulo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info-indicacao',
      title: 'Indicação',
      text: 'Se a proposta veio de uma indicação, selecione o usuário responsável.',
      attachTo: { element: '[data-tour="new-proposal-info-indicacao"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info-data',
      title: 'Data da Elaboração',
      text: 'Selecione a data em que a proposta foi elaborada.',
      attachTo: { element: '[data-tour="new-proposal-info-data"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info-status',
      title: 'Status da Proposta',
      text: 'Defina o status atual da proposta (pendente, aprovada, rejeitada, etc.).',
      attachTo: { element: '[data-tour="new-proposal-info-status"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info-obs',
      title: 'Observações',
      text: 'Adicione observações adicionais sobre a proposta, se necessário.',
      attachTo: { element: '[data-tour="new-proposal-info-obs"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'new-proposal-info-finish',
      title: '✅ Finalizar Proposta',
      text: 'Pronto! Clique aqui para finalizar e criar a proposta. Você será redirecionado para a página de detalhes da proposta criada.',
      attachTo: { element: '[data-tour="new-proposal-info-finish"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Tour de Empresas
export const companiesTour: TourDefinition = {
  id: 'companies',
  name: 'Pesquisar Empresas',
  description: 'Aprenda a como encontrar uma empresa',
  steps: [
    {
      id: 'companies-intro',
      title: '🏢 Pesquisa de Empresas',
      text: 'Aprenda a como pesquisar e encontrar uma empresa no sistema.',
      buttons: [tourButtons.skip, tourButtons.next]
    },
    {
      id: 'companies-search',
      title: '🔍 Busca',
      text: 'Use <kbd>Ctrl+K</kbd> para fazer buscas rápida.',
      attachTo: { element: '[data-tour="search"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'companies-search-bar',
      title: 'Como pesquisar',
      text: 'Você poderá pesquisar uma empresa pelo nome fantasia, razão social ou CNPJ.',
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'companies-info',
      title: '📁 Acessar Informações',
      text: 'A empresa deverá aparecer com a etiqueta Empresas no resultado da busca. Clique em cima para acessar suas informações completas.',
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// // Tour de Agenda
// export const agendaTour: TourDefinition = {
//   id: 'agenda',
//   name: 'Tour da Agenda',
//   description: 'Aprenda a usar a agenda e visualizar tarefas',
//   steps: [
//     {
//       id: 'agenda-intro',
//       title: '📅 Agenda de Tarefas',
//       text: 'Visualize suas tarefas e eventos em formato de calendário.',
//       buttons: [tourButtons.skip, tourButtons.next]
//     },
//     {
//       id: 'agenda-views',
//       title: '👁️ Visualizações',
//       text: 'Alterne entre visualização mensal, semanal e diária.',
//       attachTo: { element: '[data-tour="agenda-views"]', on: 'bottom' },
//       buttons: [tourButtons.back, tourButtons.next]
//     },
//     {
//       id: 'agenda-users',
//       title: '👥 Filtro de Usuários',
//       text: 'Visualize a agenda de outros usuários da sua equipe (se tiver permissão).',
//       attachTo: { element: '[data-tour="agenda-users"]', on: 'bottom' },
//       buttons: [tourButtons.back, tourButtons.next]
//     },
//     {
//       id: 'agenda-click',
//       title: '🖱️ Criar Eventos',
//       text: 'Clique em qualquer dia do calendário para criar uma nova tarefa ou evento.',
//       attachTo: { element: '[data-tour="calendar"]', on: 'top' },
//       buttons: [tourButtons.back, tourButtons.finish]
//     }
//   ]
// }

// // Tour de Usuários (Admin)
// export const usersTour: TourDefinition = {
//   id: 'users',
//   name: 'Tour de Usuários',
//   description: 'Aprenda a gerenciar usuários e permissões',
//   requiredPermission: 'admin', // Apenas usuários com permissão admin podem ver este tour
//   steps: [
//     {
//       id: 'users-intro',
//       title: '👥 Gerenciamento de Usuários',
//       text: 'Gerencie usuários, defina permissões e organize por unidades e setores.',
//       buttons: [tourButtons.skip, tourButtons.next]
//     },
//     {
//       id: 'users-new',
//       title: '➕ Novo Usuário',
//       text: 'Cadastre novos usuários com e-mail, cargo e permissões específicas.',
//       attachTo: { element: '[data-tour="new-user"]', on: 'bottom' },
//       buttons: [tourButtons.back, tourButtons.next]
//     },
//     {
//       id: 'users-permissions',
//       title: '🔐 Permissões',
//       text: 'Configure permissões granulares: admin, comercial, técnico, etc.',
//       attachTo: { element: '[data-tour="permissions"]', on: 'left' },
//       buttons: [tourButtons.back, tourButtons.next]
//     },
//     {
//       id: 'users-units',
//       title: '🏢 Unidades e Setores',
//       text: 'Organize usuários em unidades e setores para melhor controle de acesso.',
//       attachTo: { element: '[data-tour="units"]', on: 'left' },
//       buttons: [tourButtons.back, tourButtons.finish]
//     }
//   ]
// }

// Exportar todos os tours
export const allTours: TourDefinition[] = [
  firstTimeTour,
  dashboardTour,
  commercialDashboardTour,
  tasksTour,
  detailTasksTour,
  newProposalsTour,
  companiesTour,
  // agendaTour,
  // usersTour
]

// Helper para encontrar tour por ID
export const getTourById = (id: string): TourDefinition | undefined => {
  return allTours.find(tour => tour.id === id)
}

// Helper para filtrar tours baseado nas permissões do usuário
export const filterToursByPermissions = (userPermissions: string[]): TourDefinition[] => {
  return allTours.filter(tour => {
    // Se o tour não requer permissão, está disponível para todos
    if (!tour.requiredPermission) return true
    
    // Se o tour requer permissão, verifica se o usuário tem
    return userPermissions.includes(tour.requiredPermission)
  })
}
