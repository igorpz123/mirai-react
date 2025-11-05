# 📝 Changelog - Mirai React

Histórico de atualizações e melhorias do sistema.

---

## 🎯 Formato

Cada entrada contém:
- **Data** da atualização
- **Categoria** (Funcionalidade, Melhoria, Correção, Performance)
- **Descrição** das mudanças
- **Impacto** no usuário (se aplicável)

---

## Novembro 2025

### ✨ Sistema de Ajuda Contextual com Auto-Detecção [05/11/2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Sistema de ajuda agora está **integrado no header global**
- **Detecção automática** do módulo baseado na página atual
- Não é mais necessário clicar em botões individuais de ajuda

**Como usar:**
- Clique no ícone de **ajuda (?)** no topo da página (próximo às notificações)
- O sistema abre automaticamente na ajuda relevante para a página que você está
- Use a busca interna para encontrar tópicos específicos

**Módulos com ajuda:**
- Empresas (5 seções)
- Tarefas (4 seções)
- Propostas (5 seções)
- Usuários (4 seções)
- Dashboard (3 seções)
- Busca Global (1 seção)
- Notificações (2 seções)

### 📚 Sistema de Ajuda Contextual [04/11/2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Novo sistema de páginas de ajuda para cada módulo
- Busca em tempo real em todo conteúdo de ajuda
- Guias passo a passo e dicas práticas
- Interface premium com navegação intuitiva

**Como usar:**
- Procure o botão "Ajuda" nas páginas do sistema
- Use a busca para encontrar tópicos específicos
- Navegue entre módulos e seções

**Benefícios:**
- Aprenda a usar o sistema sem sair da aplicação
- Encontre respostas rápidas para dúvidas comuns
- Acesse tutoriais passo a passo

### 🔍 Busca Global com Ctrl+K [03/11/2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Nova busca global que busca em **tarefas, propostas, empresas e usuários**
- Atalho de teclado **Ctrl+K** (⌘K no Mac)
- Navegação por teclado (↑/↓/Enter/Esc)
- Histórico das últimas 10 buscas
- Busca inteligente com ranking de relevância

**Como usar:**
1. Pressione `Ctrl+K` em qualquer tela
2. Digite o que procura (mín. 2 caracteres)
3. Use `↑` e `↓` para navegar
4. Pressione `Enter` para abrir

**Exemplos:**
- "renovação licença" → Encontra tarefas
- "12345678000190" → Busca por CNPJ
- "João Silva" → Encontra usuários e empresas

**Benefícios:**
- Encontre informações **10x mais rápido**
- Não precisa navegar por menus
- Busca em múltiplas entidades simultaneamente

### 🔐 Sistema de Permissões [Outubro 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Sistema flexível de permissões baseado em banco de dados
- Administradores podem alterar permissões sem modificar código
- Três permissões principais: `admin`, `comercial`, `tecnico`

**Impacto:**
- Usuários veem apenas o que têm permissão de acessar
- Mais segurança e controle de acesso
- Admins podem gerenciar permissões de cada cargo

**Como usar (Admin):**
- Acesse página de Gerenciamento de Permissões
- Selecione cargo
- Marque/desmarque permissões
- Salve alterações

### 📅 Agenda de Usuários [Outubro 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Cada usuário pode configurar seus horários de trabalho
- Horários separados para manhã e tarde
- Flexibilidade para diferentes jornadas

**Como usar:**
1. Acesse seu Perfil
2. Clique em "Configurar Agenda"
3. Defina horários de trabalho
4. Salve

**Benefícios:**
- Sistema sugere horários compatíveis para tarefas
- Melhor planejamento de agenda
- Respeita jornada individual

### ⚡ Otimizações de Performance [Outubro 2025]

**Categoria:** Performance

**O que mudou:**
- Indexes adicionados no banco de dados
- Cache de permissões (5 minutos)
- Debounce em buscas (300ms)
- Queries otimizadas

**Impacto:**
- Sistema **30% mais rápido**
- Menos tempo de carregamento
- Melhor experiência de uso

### 🔄 Processamento Assíncrono [Outubro 2025]

**Categoria:** Melhoria

**O que mudou:**
- Tarefas demoradas agora rodam em background
- Sistema não trava durante processamento
- Feedback visual de progresso

**Exemplos:**
- Geração de tarefas automáticas futuras
- Exportação de relatórios grandes
- Upload de múltiplos arquivos

**Benefícios:**
- Não precisa esperar processos longos
- Pode continuar trabalhando normalmente
- Notificação quando completar

### 🎨 Componentes Multi-Select [Outubro 2025]

**Categoria:** Melhoria

**O que mudou:**
- Novos componentes de seleção múltipla
- Busca integrada nas opções
- Botões "Selecionar Todos" / "Limpar"
- Visual mais limpo com badges

**Onde usar:**
- Seleção de unidades
- Seleção de setores
- Filtros de relatórios
- Atribuição de tarefas

**Benefícios:**
- Seleção mais rápida
- Menos cliques
- Interface mais intuitiva

---

## Setembro 2025

### 🤖 Integração com IA (Google Gemini) [Setembro 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Integração completa com Google Gemini AI
- Análise de texto e imagens
- Chat interativo com IA
- Rate limiting (100 req/min)

**Como usar:**
1. Acesse página de Chat com IA
2. Digite sua pergunta
3. Receba resposta instantânea
4. Continue conversação

**Exemplos de uso:**
- "Explique o que é PPRA"
- "Analise equipamentos nesta imagem"
- "Me ajude com NR-12"

**Benefícios:**
- Assistência instantânea
- Análise automatizada de documentos
- Suporte 24/7

### 🔔 Sistema de Notificações em Tempo Real [Setembro 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Notificações push em tempo real via WebSocket
- Badge com contador de não lidas
- Toast visual para novas notificações
- Histórico completo de notificações

**Tipos de notificação:**
- Tarefas atribuídas
- Propostas atualizadas
- Comentários em tarefas
- Alertas do sistema

**Como usar:**
- Clique no ícone de sino (🔔) no topo
- Veja notificações não lidas
- Clique para marcar como lida
- Clique em "Marcar todas como lidas"

### 👥 Detecção de Presença Online [Setembro 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Sistema detecta usuários online em tempo real
- Indicador verde ao lado do nome
- Atualização automática a cada 10 segundos

**Onde ver:**
- Lista de usuários
- Atribuição de tarefas
- Dashboard de equipe

**Benefícios:**
- Saber quem está disponível
- Melhor coordenação de equipe
- Comunicação mais eficiente

---

## Agosto 2025

### 📊 Dashboards Personalizados [Agosto 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Dashboard específico por tipo de cargo
- Gráficos interativos
- KPIs relevantes por área

**Dashboards disponíveis:**
- **Admin:** Visão geral completa do sistema
- **Comercial:** Propostas, clientes, vendas
- **Técnico:** Tarefas, prazos, pendências

**Benefícios:**
- Informações relevantes de relance
- Tomada de decisão mais rápida
- Acompanhamento de métricas

### 📄 Sistema de Propostas Comerciais [Agosto 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Módulo completo de propostas comerciais
- Criação e edição de propostas
- Adição de itens e serviços
- Cálculo automático de valores
- Exportação para PDF

**Como usar:**
1. Acesse "Propostas Comerciais"
2. Clique em "Nova Proposta"
3. Preencha dados do cliente
4. Adicione itens/serviços
5. Salve e exporte

**Benefícios:**
- Propostas profissionais
- Menos erros de cálculo
- Histórico completo

---

## Julho 2025

### 🏢 Gestão de Empresas e Unidades [Julho 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Sistema completo de cadastro de empresas
- Gestão de unidades por empresa
- Vinculação de técnicos responsáveis
- Upload de documentos

**Como usar:**
1. Acesse "Empresas"
2. Clique em "Nova Empresa"
3. Preencha CNPJ e dados
4. Adicione unidades
5. Atribua técnicos

**Benefícios:**
- Organização por cliente
- Rastreabilidade completa
- Documentação centralizada

### ✅ Sistema de Tarefas [Julho 2025]

**Categoria:** Funcionalidade

**O que mudou:**
- Criação e atribuição de tarefas
- Definição de prioridades e prazos
- Anexos e comentários
- Acompanhamento de status

**Status disponíveis:**
- Pendente
- Em andamento
- Aguardando aprovação
- Concluída
- Cancelada

**Como usar:**
1. Acesse "Tarefas"
2. Clique em "Nova Tarefa"
3. Preencha informações
4. Atribua responsável
5. Defina prazo e prioridade

---

## 📋 Como Ler Este Changelog

### Categorias

- **✨ Funcionalidade** - Nova funcionalidade adicionada
- **🔧 Melhoria** - Melhoria em funcionalidade existente
- **🐛 Correção** - Bug corrigido
- **⚡ Performance** - Otimização de performance
- **📚 Documentação** - Atualização de docs

### Impacto

- **Alto** - Mudança significativa que todos devem conhecer
- **Médio** - Melhoria importante mas não crítica
- **Baixo** - Pequeno ajuste ou correção

---

## 🔮 Próximas Atualizações

### Em Desenvolvimento
- [ ] Notificações por email
- [ ] Relatórios avançados com gráficos
- [ ] Integração com Google Calendar
- [ ] App mobile (React Native)
- [ ] Sistema de backup automático

### Planejadas
- [ ] Dashboard executivo com KPIs
- [ ] Logs de auditoria completos
- [ ] Versionamento de documentos
- [ ] Integração com WhatsApp
- [ ] API pública para integrações

---

📅 **Documento atualizado em:** Novembro 2025  
📝 **Frequência de atualização:** Mensal ou quando houver mudanças significativas  
💡 **Dúvidas?** Consulte a [Documentação do Usuário](./user/DOCUMENTACAO_USUARIO.md) ou [FAQ](./FAQ_COMPLETO.md)
