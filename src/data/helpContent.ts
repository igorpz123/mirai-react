/**
 * Sistema de Ajuda - Conteúdo por Módulo
 * Baseado em DOCUMENTACAO_USUARIO.md
 */

export interface HelpSection {
  id: string
  title: string
  icon?: string
  content: string
  steps?: string[]
  tips?: string[]
  videoUrl?: string
  relatedTopics?: string[]
}

export interface HelpModule {
  id: string
  title: string
  description: string
  sections: HelpSection[]
}

export const helpModules: Record<string, HelpModule> = {
  // ============================================
  // EMPRESAS
  // ============================================
  empresas: {
    id: 'empresas',
    title: 'Empresas',
    description: 'Gerencie empresas clientes, seus dados cadastrais e documentos',
    sections: [
      {
        id: 'empresas-overview',
        title: 'Visão Geral',
        content: 'O módulo de Empresas centraliza todas as informações sobre seus clientes corporativos, incluindo dados cadastrais, documentos, contatos e tarefas associadas.',
        tips: [
          'Use os filtros para encontrar empresas rapidamente',
          'A busca global também pesquisa por CNPJ e CAEPF',
          'Empresas com tarefas pendentes aparecem destacadas'
        ]
      },
      {
        id: 'empresas-criar',
        title: 'Criar Nova Empresa (Admin)',
        content: 'Para cadastrar uma nova empresa no sistema:',
        steps: [
          'Clique no botão "Nova Empresa" no canto superior direito',
          'Preencha os dados básicos: Nome Fantasia, Razão Social, CNPJ ou CAEPF',
          'Adicione informações de contato: telefone, e-mail, endereço',
          'Defina a periodicidade de renovação (anual, semestral, etc.)',
          'Selecione a data de renovação',
          'Escolha a unidade responsável',
          'Clique em "Salvar"'
        ],
        tips: [
            'Apenas Administradores tem permissão de inserir uma nova empresa',
          'CNPJ deve ter 14 dígitos (sem pontuação)',
          'CAEPF é usado para produtores rurais (CPF de 11 dígitos)',
          'A data de renovação define quando as tarefas automáticas serão criadas'
        ]
      },
      {
        id: 'empresas-editar',
        title: 'Editar Empresa (Admin)',
        content: 'Para modificar dados de uma empresa existente:',
        steps: [
          'Na lista de empresas, clique nos três pontos ao lado do nome da empresa',
          'Clique no botão "Detalhes"',
          'Modifique os campos desejados',
          'Se alterar a data de renovação ou periodicidade, o sistema perguntará para quantos anos deseja criar tarefas futuras',
          'Clique em "Salvar" para confirmar'
        ],
        tips: [
            'Apenas Administradores tem permissão de editar as informações da empresa',
          'Alterações na periodicidade afetam apenas tarefas futuras',
          'Tarefas já criadas não são modificadas automaticamente'
        ]
      },
      {
        id: 'empresas-tarefas-automaticas',
        title: 'Tarefas Automáticas (Admin)',
        content: 'O sistema pode criar tarefas automaticamente baseado na periodicidade e data de renovação da empresa.',
        steps: [
          'Defina a periodicidade ao criar/editar a empresa',
          'Configure a data de renovação',
          'Ao salvar com mudanças nesses campos, escolha para quantos anos criar tarefas (0-5 anos)',
          'O sistema criará tarefas automaticamente nas datas calculadas'
        ],
        tips: [
          'Periodicidade "Anual" cria uma tarefa por ano',
          'Periodicidade "Semestral" cria duas tarefas por ano',
          'Periodicidade "Rotina" cria tarefas baseadas em dias corridos',
          'As tarefas são criadas sempre a partir da data de renovação'
        ]
      }
    ]
  },

  // ============================================
  // TAREFAS
  // ============================================
  tarefas: {
    id: 'tarefas',
    title: 'Tarefas',
    description: 'Gerencie tarefas, prazos e entregas de documentos',
    sections: [
      {
        id: 'tarefas-overview',
        title: 'Visão Geral',
        content: 'O módulo de Tarefas permite criar, acompanhar e gerenciar todas as atividades relacionadas às empresas clientes, incluindo entregas de documentos, renovações e procedimentos.',
        tips: [
          'Use os filtros de status para visualizar apenas tarefas pendentes',
          'Tarefas atrasadas aparecem em vermelho',
          'O dashboard mostra estatísticas em tempo real'
        ]
      },
      {
        id: 'tarefas-criar',
        title: 'Criar Nova Tarefa',
        content: 'Para criar uma tarefa manualmente:',
        steps: [
          'Clique no botão "Nova Tarefa"',
          'Selecione a empresa relacionada',
          'Escolha o tipo de tarefa',
          'Configure a data de vencimento',
          'Atribua um responsável',
          'Selecione a prioridade (baixa, média, alta)',
          'Clique em "Salvar"'
        ],
        tips: [
          'Tarefas automáticas são criadas pelo sistema baseado na periodicidade',
          'Você pode criar tarefas manualmente a qualquer momento',
          'O responsável recebe notificação quando atribuído'
        ]
      },
      {
        id: 'tarefas-status',
        title: 'Atualizar Status',
        content: 'Acompanhe o progresso das tarefas através dos status:',
        steps: [
          'Acesse a página de detalhes da tarefa',
          'Use o seletor de status no topo',
          'Status disponíveis: Pendente, Em Andamento, Concluída',
          'Adicione observações se necessário',
          'O histórico registra todas as mudanças'
        ],
        tips: [
          'Tarefas concluídas não podem ser editadas por padrão',
          'Use observações para documentar decisões importantes',
          'Administradores podem reabrir tarefas concluídas'
        ]
      },
      {
        id: 'tarefas-anexos',
        title: 'Anexar Documentos',
        content: 'Anexe documentos e arquivos relacionados às tarefas:',
        steps: [
          'Na página da tarefa, vá até "Arquivos"',
          'Clique em "Selecionar arquivo"',
          'Escolha o(s) arquivo(s) no seu computador',
          'Aguarde o upload completar',
          'Os arquivos aparecem listados abaixo'
        ],
        tips: [
          'Cada tarefa pode ter múltiplos arquivos anexados',
          'Use nomes descritivos para facilitar identificação',
          'Anexos podem ser baixados por todos com acesso à tarefa'
        ]
      }
    ]
  },

  // ============================================
  // PROPOSTAS COMERCIAIS
  // ============================================
  propostas: {
    id: 'propostas',
    title: 'Propostas Comerciais',
    description: 'Crie e gerencie propostas comerciais com produtos, cursos e programas',
    sections: [
      {
        id: 'propostas-overview',
        title: 'Visão Geral',
        content: 'O módulo de Propostas Comerciais permite criar orçamentos detalhados incluindo programas de prevenção, cursos, produtos químicos e outros serviços.',
        tips: [
          'Propostas aprovadas não podem ser editadas',
          'Valores são calculados automaticamente',
          'Exporte para Word para enviar ao cliente'
        ]
      },
      {
        id: 'propostas-criar',
        title: 'Criar Proposta',
        content: 'Para criar uma nova proposta comercial:',
        steps: [
            'No menu lateral, acesse "CRM" e clique em "Criar Proposta" ou',
          'Aperte Ctrl + K para acessar a busca global e digite Criar Proposta',
          'Preencha o CNPJ ou CPF para consultar se a empresa já esta cadastrada no sistema',
          'Em caso positivo, prossiga com o preenchimento da proposta',
          'Caso a empresa não exista no sistema, preencha com os dados e informações solicitadas',
          'Preenche com os programas, cursos, medições químicas e produtos desejados',
          'Ao final, preencha o título da proposta, status, data da elaboração e se há alguma indicação',
          'Clique em Finalizar para criar a proposta',
          'Arquivos poderão ser anexados à proposta depois de criar',
        ],
        tips: [
          'Sempre aperte no "+" para adicionar um item a proposta'
        ]
      },
      {
        id: 'propostas-adicionar-itens',
        title: 'Adicionar Itens à Proposta',
        content: 'Adicione diferentes tipos de produtos e serviços:',
        steps: [
          'Clique em "Adicionar Item" no topo da proposta',
          'Escolha o tipo: Programa, Curso, Químico ou Produto',
          'Selecione o item do catálogo',
          'Defina quantidade',
          'Para programas e produtos, clique em "Calcular preço" para obter o valor conforme a tabela',
          'Adicione desconto se aplicável',
          'Clique em "Salvar"'
        ],
        tips: [
          'Programas têm preço mensal que é anualizado (×12)',
          'Produtos e programas têm preços escalonados por quantidade',
          'Químicos são precificados por pontos',
          'O valor total é atualizado automaticamente'
        ]
      },
      {
        id: 'propostas-status',
        title: 'Gerenciar Status',
        content: 'Controle o fluxo da proposta através dos status:',
        steps: [
          'Use o seletor de status na página da proposta',
          'Status: Rascunho → Em Análise → Enviada → Aprovada/Rejeitada',
          'Ao marcar como "Aprovada", informe método de pagamento e parcelas',
          'Propostas aprovadas ficam bloqueadas para edição'
        ],
        tips: [
          'Documente o motivo ao rejeitar uma proposta',
          'Use observações para registrar negociações',
          'O histórico mostra todas as alterações'
        ]
      },
      {
        id: 'propostas-exportar',
        title: 'Exportar Proposta',
        content: 'Gere documento Word formatado para enviar ao cliente:',
        steps: [
          'Na página da proposta, clique em "Exportar Word"',
          'Aguarde a geração do documento',
          'O download inicia automaticamente',
          'Abra o arquivo .docx para revisar',
          'Envie ao cliente por e-mail'
        ],
        tips: [
          'O documento já vem formatado e com todas as informações',
          'Inclui logomarca e identidade visual da empresa',
          'Valores são formatados em moeda brasileira'
        ]
      }
    ]
  },

  // ============================================
  // USUÁRIOS
  // ============================================
  usuarios: {
    id: 'usuarios',
    title: 'Usuários',
    description: 'Gerencie usuários, permissões e perfis de acesso',
    sections: [
      {
        id: 'usuarios-overview',
        title: 'Visão Geral',
        content: 'O módulo de Usuários permite gerenciar contas de acesso ao sistema, definir permissões e organizar equipes por unidades e setores.',
        tips: [
          'Apenas administradores podem criar usuários',
          'Cada usuário tem um cargo que define permissões básicas',
          'Permissões específicas podem ser configuradas individualmente'
        ]
      },
      {
        id: 'usuarios-criar',
        title: 'Criar Usuário',
        content: 'Para adicionar um novo usuário ao sistema:',
        steps: [
          'Acesse Usuários → Novo Usuário',
          'Preencha nome, sobrenome e e-mail',
          'Defina uma senha inicial',
          'Selecione o cargo (Admin, Gerente, Técnico, Comercial, etc.)',
          'Escolha as unidades de atuação',
          'Selecione os setores',
          'Configure permissões específicas se necessário',
          'Clique em "Salvar"'
        ],
        tips: [
          'O e-mail deve ser único no sistema'
        ]
      },
      {
        id: 'usuarios-permissoes',
        title: 'Gerenciar Permissões',
        content: 'Configure o que cada usuário pode fazer no sistema:',
        steps: [
          'Edite o usuário desejado',
          'Vá até a seção "Permissões"',
          'Marque/desmarque permissões específicas',
          'Permissões são organizadas por módulo',
          'Clique em "Salvar" para aplicar'
        ],
        tips: [
          'O cargo define permissões básicas',
          'Permissões específicas sobrescrevem as do cargo',
          'Admins têm todas as permissões por padrão',
          'Teste as permissões fazendo login com o usuário'
        ]
      },
      {
        id: 'usuarios-foto',
        title: 'Adicionar Foto de Perfil',
        content: 'Personalize o perfil com uma foto:',
        steps: [
          'Acesse seu perfil ou edite um usuário',
          'Clique no ícone de câmera sobre a foto',
          'Selecione uma imagem (JPG, PNG)',
          'A foto é redimensionada automaticamente',
          'Clique em "Salvar"'
        ],
        tips: [
          'Use fotos com fundo neutro',
          'Formato quadrado funciona melhor',
          'Tamanho recomendado: 400x400px'
        ]
      }
    ]
  },

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Visão geral e indicadores do sistema',
    sections: [
      {
        id: 'dashboard-overview',
        title: 'Visão Geral',
        content: 'O Dashboard apresenta métricas e indicadores importantes em tempo real, com visualizações específicas por cargo.',
        tips: [
          'Admins veem métricas gerais de todo o sistema',
          'Comerciais veem propostas e metas',
          'Técnicos veem tarefas e prazos',
          'Dados são atualizados automaticamente'
        ]
      },
      {
        id: 'dashboard-filtros',
        title: 'Usar Filtros',
        content: 'Personalize a visualização dos dados:',
        steps: [
          'Use os filtros no topo do dashboard',
          'Filtre por período (hoje, semana, mês, ano)',
          'Filtre por unidade ou setor',
          'Filtre por responsável',
          'Os gráficos são atualizados automaticamente'
        ]
      },
      {
        id: 'dashboard-graficos',
        title: 'Interpretar Gráficos',
        content: 'Entenda os indicadores apresentados:',
        tips: [
          'Gráfico de tarefas: mostra pendentes, em andamento, concluídas',
          'Gráfico de propostas: mostra por status',
          'Ranking: mostra usuários mais produtivos',
          'Linha do tempo: mostra tendências ao longo do período',
          'Clique em elementos do gráfico para ver detalhes'
        ]
      }
    ]
  },

  // ============================================
  // BUSCA GLOBAL
  // ============================================
  busca: {
    id: 'busca',
    title: 'Busca Global',
    description: 'Encontre rapidamente empresas, tarefas, propostas e usuários',
    sections: [
      {
        id: 'busca-overview',
        title: 'Como Usar',
        content: 'A busca global permite encontrar qualquer informação no sistema rapidamente.',
        steps: [
          'Pressione Ctrl+K (Windows) ou ⌘K (Mac) de qualquer tela',
          'Ou clique no botão "Buscar..." na barra lateral',
          'Digite sua busca (nome, CNPJ, CAEPF, etc.)',
          'Resultados aparecem enquanto você digita',
          'Clique em um resultado para abrir'
        ],
        tips: [
          'Busca por nome fantasia, razão social, CNPJ e CAEPF',
          'Resultados são ordenados por relevância',
          'Use filtros para refinar: tipo:empresa, tipo:tarefa, etc.'
        ]
      }
    ]
  },

  // ============================================
  // NOTIFICAÇÕES
  // ============================================
  notificacoes: {
    id: 'notificacoes',
    title: 'Notificações',
    description: 'Sistema de notificações em tempo real',
    sections: [
      {
        id: 'notificacoes-overview',
        title: 'Visão Geral',
        content: 'O sistema envia notificações em tempo real sobre eventos importantes.',
        tips: [
          'Notificações aparecem no ícone de sino',
          'Som e toast quando recebe notificação',
          'Clique para ver detalhes',
          'Marque como lida ou marque todas'
        ]
      },
      {
        id: 'notificacoes-tipos',
        title: 'Tipos de Notificações',
        content: 'Você receberá notificações sobre:',
        tips: [
          'Tarefas atribuídas a você',
          'Prazos próximos ao vencimento',
          'Alterações em tarefas que você acompanha',
          'Propostas que precisam de aprovação',
          'Comentários e observações',
          'Status alterados'
        ]
      }
    ]
  }
}

/**
 * Busca conteúdo de ajuda por termo
 */
export function searchHelp(query: string): Array<{ module: string; section: HelpSection }> {
  const results: Array<{ module: string; section: HelpSection }> = []
  const lowerQuery = query.toLowerCase()

  Object.values(helpModules).forEach(module => {
    module.sections.forEach(section => {
      const searchText = `${section.title} ${section.content} ${section.steps?.join(' ')} ${section.tips?.join(' ')}`.toLowerCase()
      if (searchText.includes(lowerQuery)) {
        results.push({ module: module.title, section })
      }
    })
  })

  return results
}

/**
 * Obtém conteúdo de ajuda para um módulo específico
 */
export function getHelpForModule(moduleId: string): HelpModule | null {
  return helpModules[moduleId] || null
}
