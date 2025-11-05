# 📚 Manual do Usuário - Sistema Mirai

**Versão:** 1.0  
**Data:** Novembro 2025  
**Público-alvo:** Usuários finais do sistema (técnicos, comercial, administrativo)

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Navegação Principal](#navegação-principal)
4. [Módulo de Tarefas](#módulo-de-tarefas)
5. [Módulo de Empresas](#módulo-de-empresas)
6. [Módulo de Propostas Comerciais](#módulo-de-propostas-comerciais)
7. [Agenda](#agenda)
8. [Livro de Registros](#livro-de-registros)
9. [Busca Global](#busca-global)
10. [Notificações](#notificações)
11. [Perfil e Configurações](#perfil-e-configurações)
12. [Dúvidas Frequentes (FAQ)](#dúvidas-frequentes-faq)

---

## 🎯 Introdução

O **Sistema Mirai** é uma plataforma integrada para gestão de empresas, tarefas técnicas, propostas comerciais e agendamentos. Este manual irá guiá-lo através de todas as funcionalidades disponíveis.

### Tipos de Usuários

- **Administrador/Diretor:** Acesso completo ao sistema, incluindo dashboards analíticos e gestão de usuários
- **Comercial:** Foco em propostas comerciais, empresas e relatórios de vendas
- **Técnico:** Gestão de tarefas técnicas, agenda e empresas atribuídas
- **Outros perfis:** Acesso customizado conforme permissões

---

## 🔐 Acesso ao Sistema

### Primeiro Acesso

1. Acesse a URL fornecida pela sua organização
2. Use as credenciais (e-mail e senha) fornecidas pelo administrador
3. Ao fazer login pela primeira vez, você será direcionado ao dashboard correspondente ao seu perfil

### Login

1. Na página inicial, insira seu **e-mail** e **senha**
2. Clique em **"Entrar"**
3. O sistema irá validar suas credenciais e direcioná-lo ao dashboard apropriado

### Recuperação de Senha

> **Nota:** Atualmente a recuperação de senha deve ser solicitada ao administrador do sistema.

### Sessão e Segurança

- Sua sessão expira após **4 horas** de inatividade
- **2 minutos antes de expirar**, você receberá um aviso para renovar a sessão
- Sempre faça **logout** ao sair de computadores compartilhados

---

## 🧭 Navegação Principal

### Barra Lateral (Sidebar)

A navegação principal fica na **barra lateral esquerda** e varia conforme seu perfil:

#### Menu Técnico
- **Dashboard:** Visão geral de tarefas e métricas
- **Tarefas:** Lista de todas as tarefas técnicas
- **Empresas:** Cadastro e gerenciamento de empresas
- **Agenda:** Visualização e criação de eventos
- **Livro de Registros:** Histórico de atividades

#### Menu Comercial
- **Dashboard Comercial:** Métricas de vendas e propostas
- **Propostas:** Gerenciamento de propostas comerciais
- **Empresas:** Cadastro e gerenciamento de empresas
- **Itens Comerciais:** Catálogo de produtos/serviços

#### Menu Administrativo
- Todos os itens acima, mais:
- **Usuários:** Gerenciamento de usuários
- **Unidades:** Cadastro de unidades/filiais
- **Cargos:** Gerenciamento de perfis
- **Relatórios:** Análises e exportações

### Barra Superior

- **Logo Mirai:** Clique para voltar ao dashboard
- **Busca Global:** Campo de pesquisa rápida (🔍)
- **Notificações:** Sino com badge de novas notificações
- **Perfil do Usuário:** Menu com foto e opções

---

## 📋 Módulo de Tarefas

### Visualizar Tarefas

1. Clique em **"Tarefas"** no menu lateral
2. A tabela mostra todas as tarefas com:
   - **ID:** Número único da tarefa
   - **Empresa:** Nome da empresa vinculada
   - **Tipo:** Inspeção Inicial, Renovação, Rotina, etc.
   - **Status:** Automático, Andamento, Concluído, Cancelado
   - **Prioridade:** Normal, Alta, Urgente
   - **Prazo:** Data limite para conclusão
   - **Responsável:** Técnico designado

### Filtrar Tarefas

**Filtros disponíveis:**
- **Pesquisa por texto:** Digite nome da empresa ou ID
- **Status:** Selecione um ou múltiplos status
- **Prioridade:** Filtre por nível de prioridade
- **Unidade:** Visualize tarefas de uma unidade específica
- **Responsável:** Filtre por técnico

**Como aplicar filtros:**
1. Use os campos de filtro acima da tabela
2. Selecione as opções desejadas
3. A tabela atualiza automaticamente
4. Clique em **"Limpar filtros"** para resetar

### Criar Nova Tarefa

1. Clique no botão **"+ Nova Tarefa"**
2. Preencha o formulário:
   - **Empresa:** Selecione da lista ou pesquise
   - **Tipo de Tarefa:** Escolha o tipo (Inspeção, Renovação, etc.)
   - **Prioridade:** Defina a urgência
   - **Prazo:** Selecione a data limite
   - **Responsável:** Atribua um técnico
   - **Setor:** Defina o setor responsável
   - **Descrição:** (Opcional) Detalhes adicionais
3. Clique em **"Criar Tarefa"**

### Editar Tarefa

1. Na lista de tarefas, clique no **⋮** (três pontos) na linha da tarefa
2. Selecione **"Editar"**
3. Modifique os campos necessários
4. Clique em **"Salvar"**

**Campos editáveis:**
- Status
- Prioridade
- Prazo
- Responsável
- Observações

### Adicionar Observações

1. Clique na tarefa para abrir os detalhes
2. Role até a seção **"Observações"**
3. Digite sua observação no campo de texto
4. Clique em **"Adicionar Observação"**
5. A observação aparecerá com:
   - Nome do usuário
   - Data e hora
   - Texto da observação

### Upload de Arquivos (Anexos)

1. Abra a tarefa
2. Na seção **"Anexos"**, clique em **"Upload"** ou arraste arquivos
3. Selecione os arquivos do seu computador
4. Clique em **"Enviar"**

**Tipos de arquivo aceitos:**
- Documentos: PDF, DOC, DOCX, XLS, XLSX
- Imagens: JPG, PNG, JPEG, GIF
- Outros: ZIP, TXT

**Tamanho máximo:** 10MB por arquivo

### Excluir/Cancelar Tarefa

1. Clique no **⋮** (três pontos) na linha da tarefa
2. Selecione **"Cancelar Tarefa"** ou **"Excluir"**
3. Confirme a ação no diálogo que aparece

> **⚠️ Atenção:** 
> - Tarefas **automáticas** não podem ser editadas manualmente
> - Tarefas **concluídas** não podem ser editadas
> - A exclusão é permanente e não pode ser desfeita

### Alterar Status da Tarefa

**Fluxo típico de status:**
1. **Automático** → Status inicial de tarefas geradas automaticamente
2. **Andamento** → Tarefa em execução
3. **Concluído** → Tarefa finalizada
4. **Cancelado** → Tarefa cancelada

**Como alterar:**
1. Abra a tarefa ou use o menu **⋮**
2. Selecione o novo status
3. Adicione uma observação explicando a mudança (recomendado)

### Tarefas Automáticas

O sistema gera tarefas automaticamente com base em:
- **Data de renovação** da empresa
- **Periodicidade** configurada

**Características:**
- Status inicial: **Automático**
- Criadas em lote para o ano atual + anos futuros configurados
- Aparecem na agenda automaticamente
- Não podem ser editadas diretamente (altere o status para modificar)

---

## 🏢 Módulo de Empresas

### Visualizar Empresas

1. Clique em **"Empresas"** no menu lateral
2. A tabela exibe:
   - **Nome Fantasia**
   - **Razão Social**
   - **CNPJ/CAEPF** (CPF para empresas rurais)
   - **Técnico Responsável**
   - **Status** (Ativo/Inativo)

### Buscar Empresa

Use os filtros:
- **Pesquisa por texto:** Nome, razão social ou CNPJ/CAEPF
- **Unidade:** Filtre por unidade responsável
- **Técnico:** Filtre por técnico responsável

### Criar Nova Empresa

1. Clique em **"+ Nova Empresa"**
2. No formulário lateral (Sheet), preencha:
   
   **Documentação:**
   - Selecione **CNPJ** ou **CAEPF (CPF Rural)**
   - Digite o documento (com validação automática)
   - ✓ verde = documento válido
   - ✗ vermelho = documento inválido

   **Dados Básicos:**
   - **Razão Social:** Nome oficial da empresa **(obrigatório)**
   - **Nome Fantasia:** Nome comercial **(obrigatório)**
   - **Cidade:** Localização
   - **Telefone:** Contato (formatação automática)

   **Gestão:**
   - **Unidade Responsável:** Filial que gerencia a empresa
   - **Técnico Responsável:** Técnico designado
   - **Periodicidade:** Intervalo em dias entre rotinas (ex: 30, 60, 90)
   - **Data de Renovação:** Data da próxima renovação

3. Clique em **"Criar Empresa"**

> **💡 Dica:** A periodicidade e data de renovação são usadas para gerar tarefas automáticas!

### Editar Empresa

1. Clique no **⋮** (três pontos) na linha da empresa
2. Selecione **"Detalhes"**
3. Modifique os campos necessários
4. Clique em **"Salvar"**

**Se você alterar a data de renovação ou periodicidade:**
- Um diálogo aparecerá perguntando **quantos anos futuros** gerar tarefas
- Escolha de **0 a 5 anos**
- O sistema irá:
  - Apagar tarefas automáticas antigas
  - Gerar novas tarefas respeitando a nova configuração

### Inativar/Reativar Empresa

**Inativar:**
1. Clique no **⋮** → **"Inativar"**
2. Confirme a ação
3. A empresa fica marcada como **Inativa** (não será excluída)

**Reativar:**
1. Clique no **⋮** → **"Reativar"**
2. A empresa volta ao status **Ativa**

### Gerar Tarefas Automáticas por Unidade

1. Na página **Empresas**, selecione uma **Unidade** no filtro
2. Clique em **"Gerar tarefas automáticas (Unidade)"**
3. No diálogo que aparece:
   - Escolha **quantos anos futuros** gerar (0-5)
   - Exemplo: Escolher "1" gera tarefas para 2025 e 2026
4. Clique em **"Gerar Tarefas"**
5. O processamento acontece em segundo plano
6. Você receberá uma **notificação** quando concluir

**O que é gerado:**
- **Tarefa de Renovação/Inspeção Inicial** na data de renovação
- **Tarefas de Rotina** baseadas na periodicidade
- **Eventos na Agenda** vinculados às tarefas

### Visualizar Tarefas e Propostas da Empresa

1. Acesse os **Detalhes** da empresa
2. Role para baixo para ver:
   - **Tarefas vinculadas:** Todas as tarefas relacionadas
   - **Propostas comerciais:** Propostas criadas para esta empresa

---

## 💼 Módulo de Propostas Comerciais

### Visualizar Propostas

1. Clique em **"Propostas"** (menu comercial)
2. A tabela mostra:
   - **Número da Proposta**
   - **Cliente** (Empresa)
   - **Título**
   - **Status:** Rascunho, Enviada, Aprovada, Recusada
   - **Valor Total**
   - **Data de Criação**
   - **Responsável**

### Criar Nova Proposta

**Passo 1: Dados da Empresa**
1. Clique em **"+ Nova Proposta"**
2. Escolha **CNPJ** ou **CAEPF**
3. Digite o documento e clique em **"Buscar"**
   - Se a empresa existir, os dados serão preenchidos
   - Se não existir, preencha os dados manualmente

**Passo 2: Adicionar Itens**
1. Clique em **"Adicionar Item"** (dropdown)
2. Escolha o tipo:
   - **Programa**
   - **Curso**
   - **Produto Químico**
   - **Produto**

3. Para cada item:
   - Selecione da lista ou pesquise
   - Defina **quantidade**
   - Ajuste **preço unitário** (se necessário)
   - Clique em **"Adicionar"**

**Passo 3: Finalizar**
1. Revise todos os itens
2. Verifique o **Valor Total**
3. Adicione **observações** (opcional)
4. Clique em **"Criar Proposta"**

### Editar Proposta

1. Clique na proposta para abrir os detalhes
2. Clique em **"Editar"**
3. Modifique os itens:
   - **Adicionar novos itens**
   - **Remover itens** (ícone de lixeira)
   - **Alterar quantidades/preços**
4. Clique em **"Salvar"**

> **⚠️ Atenção:** Propostas **Aprovadas** não podem ser editadas!

### Alterar Status da Proposta

**Fluxo típico:**
1. **Rascunho** → Proposta em criação
2. **Enviada** → Enviada para o cliente
3. **Aprovada** → Cliente aceitou
4. **Recusada** → Cliente recusou

**Como alterar:**
1. Abra a proposta
2. Use o dropdown de **Status**
3. Selecione o novo status
4. Salve as alterações

### Gerar PDF da Proposta

1. Abra a proposta
2. Clique em **"Gerar PDF"**
3. O sistema cria um PDF formatado com:
   - Logo da empresa
   - Dados do cliente
   - Tabela de itens
   - Valores e totais
4. O PDF abre em nova aba (você pode salvar ou imprimir)

### Excluir Proposta

1. No menu **⋮** da proposta, selecione **"Excluir"**
2. Confirme a exclusão
3. **Atenção:** A exclusão é permanente!

---

## 📅 Agenda

### Visualizar Agenda

1. Clique em **"Agenda"** no menu lateral
2. Escolha a visualização:
   - **Mês:** Visão mensal completa
   - **Semana:** Detalhes semanais
   - **Dia:** Visualização diária detalhada
   - **Lista:** Eventos em formato de lista

### Navegação

- **Setas (← →):** Avançar/retroceder no tempo
- **Hoje:** Voltar para a data atual
- **Selecionar data:** Clique em uma data no calendário

### Criar Evento

**Opção 1: Clique rápido**
1. Clique em um dia/horário vazio no calendário
2. Preencha o formulário rápido:
   - **Título**
   - **Horário início/fim**
3. Clique em **"Criar"**

**Opção 2: Formulário completo**
1. Clique em **"+ Novo Evento"**
2. Preencha:
   - **Título:** Nome do evento **(obrigatório)**
   - **Descrição:** Detalhes adicionais
   - **Data e Hora:** Início e fim
   - **Cor:** Escolha uma cor para destaque
   - **Tarefa Vinculada:** (Opcional) Vincule a uma tarefa existente
3. Clique em **"Salvar"**

### Editar Evento

1. Clique no evento no calendário
2. No popup, clique em **"Editar"**
3. Modifique os campos
4. Salve as alterações

**Ou arraste e solte:**
- Arraste o evento para outra data/horário
- O sistema atualiza automaticamente

### Excluir Evento

1. Clique no evento
2. No popup, clique em **"Excluir"**
3. Confirme a exclusão

> **⚠️ Nota:** Eventos vinculados a tarefas automáticas são recriados se você regerar as tarefas!

### Filtrar Eventos

- **Por tipo de tarefa:** Use os filtros na lateral
- **Por responsável:** Veja eventos de técnicos específicos
- **Por cor:** Identifique visualmente tipos de eventos

### Eventos Automáticos

Quando tarefas automáticas são geradas, eventos são criados automaticamente na agenda:

- **Inspeção Inicial/Renovação:** 🟡 Amarelo, 13h-14h
- **Rotinas:** 🟢 Verde, 8h-8h30

---

## 📖 Livro de Registros

### Acessar o Livro

1. Clique em **"Livro de Registros"** no menu
2. Visualize todos os registros históricos

### Criar Novo Registro

1. Clique em **"+ Novo Registro"**
2. Preencha:
   - **Data do Registro**
   - **Empresa:** Selecione da lista
   - **Tipo de Atividade:** Escolha o tipo
   - **Descrição:** Detalhes da atividade
   - **Observações:** Informações adicionais
3. Clique em **"Salvar"**

### Buscar Registros

Use os filtros:
- **Período:** Selecione data início e fim
- **Empresa:** Filtre por empresa específica
- **Tipo:** Filtre por tipo de atividade

### Exportar Registros

1. Aplique os filtros desejados
2. Clique em **"Exportar"**
3. Escolha o formato:
   - **PDF:** Relatório formatado
   - **Excel:** Planilha para análise

---

## 🔍 Busca Global

A busca global permite encontrar rapidamente qualquer item no sistema.

### Como Usar

1. Clique no **campo de busca** no topo (ou pressione **Ctrl+K**)
2. Digite o que procura:
   - Nome de empresa
   - CNPJ/CAEPF
   - Número de tarefa
   - Título de proposta
   - Nome de usuário

3. Os resultados aparecem em tempo real, separados por:
   - 📋 **Tarefas**
   - 🏢 **Empresas**
   - 💼 **Propostas**
   - 👤 **Usuários**

4. Clique no resultado para abrir o item

### Dicas de Busca

- **Pesquisa parcial funciona:** Digite "jos" para encontrar "José da Silva"
- **Busca por documento:** Digite números do CNPJ/CPF
- **Busca por ID:** Digite "#123" para encontrar tarefa 123

### Histórico de Busca

- Suas últimas buscas ficam salvas
- Acesse rapidamente itens recentes
- Limpe o histórico clicando no ícone de lixeira

---

## 🔔 Notificações

### Visualizar Notificações

1. Clique no **ícone de sino** no topo (🔔)
2. Um painel lateral abre com todas as notificações
3. Badge vermelho mostra o número de notificações não lidas

### Tipos de Notificação

- **Novas tarefas atribuídas** a você
- **Alterações em tarefas** que você acompanha
- **Propostas aprovadas/recusadas**
- **Comentários/observações** em itens seus
- **Tarefas próximas do prazo**
- **Conclusão de processamentos** (ex: geração de tarefas em lote)

### Marcar como Lida

- **Individual:** Clique na notificação
- **Todas:** Clique em **"Marcar todas como lidas"**

### Configurações de Notificação

> **Nota:** Configurações avançadas de notificação serão implementadas em versão futura.

---

## 👤 Perfil e Configurações

### Acessar Perfil

1. Clique na **foto de perfil** no topo direito
2. Menu com opções:
   - **Meu Perfil**
   - **Configurações**
   - **Ajuda**
   - **Sair**

### Editar Perfil

1. Clique em **"Meu Perfil"**
2. Altere:
   - **Foto de perfil:** Clique na foto para fazer upload
   - **Nome e Sobrenome**
   - **E-mail:** (Validação necessária)
   - **Telefone**
3. Clique em **"Salvar"**

### Alterar Senha

1. No perfil, clique em **"Alterar Senha"**
2. Digite:
   - **Senha Atual**
   - **Nova Senha**
   - **Confirmar Nova Senha**
3. Clique em **"Salvar"**

**Requisitos de senha:**
- Mínimo 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos um número

### Tema do Sistema

1. Em **Configurações**, escolha:
   - **Claro:** Fundo branco (padrão)
   - **Escuro:** Fundo escuro (conforto visual)
   - **Automático:** Segue o sistema operacional

---

## ❓ Dúvidas Frequentes (FAQ)

### Tarefas

**P: Por que não consigo editar uma tarefa automática?**  
R: Tarefas com status "Automático" são gerenciadas pelo sistema. Altere o status para "Andamento" para poder editar.

**P: Como faço para uma tarefa aparecer na agenda?**  
R: Toda tarefa com prazo definido cria automaticamente um evento na agenda.

**P: Posso atribuir uma tarefa para outra pessoa?**  
R: Sim, edite a tarefa e altere o campo "Responsável".

**P: O que significa "Tarefas criadas: X (2 anos)"?**  
R: O sistema gerou X tarefas distribuídas ao longo de 2 anos (ano atual + 1 ano futuro).

### Empresas

**P: Qual a diferença entre CNPJ e CAEPF?**  
R: CNPJ é para empresas normais (14 dígitos). CAEPF é para produtores rurais que usam CPF (11 dígitos).

**P: Posso cadastrar empresa sem CNPJ?**  
R: Sim, use CAEPF (CPF) para empresas rurais. Pelo menos um dos dois é obrigatório.

**P: O que acontece se eu mudar a data de renovação?**  
R: O sistema pergunta se deseja regerar as tarefas automáticas com a nova data.

**P: Quantos anos futuros devo gerar?**  
R: Recomendamos 1-2 anos. Gerar mais pode criar muitas tarefas antecipadamente.

### Propostas

**P: Posso editar uma proposta já enviada?**  
R: Sim, mas crie uma nova versão se o cliente já tiver visualizado. Propostas aprovadas não podem ser editadas.

**P: Como adiciono um item customizado?**  
R: Use o tipo "Produto" e preencha manualmente nome, descrição e valor.

**P: O PDF não está gerando. O que fazer?**  
R: Verifique se todos os itens têm preço definido e tente novamente. Se persistir, contate o suporte.

### Agenda

**P: Eventos da agenda sincronizam com Google Calendar?**  
R: Atualmente não há integração. Esta funcionalidade está planejada para versões futuras.

**P: Posso convidar outros usuários para um evento?**  
R: No momento, eventos são individuais. Funcionalidade de convites será implementada.

**P: Como removo um evento vinculado a uma tarefa?**  
R: Cancele ou exclua a tarefa relacionada. Ou altere a tarefa para remover o prazo.

### Busca e Notificações

**P: A busca não encontra uma empresa que existe.**  
R: Tente buscar por parte do nome, CNPJ sem pontuação, ou razão social. Se persistir, verifique filtros ativos.

**P: Por que não recebi notificação de uma nova tarefa?**  
R: Verifique se você é o responsável pela tarefa. Notificações são enviadas apenas para o técnico atribuído.

**P: Notificações antigas somem?**  
R: Notificações são mantidas por 90 dias. Após isso, são arquivadas.

### Geral

**P: Posso usar o sistema no celular?**  
R: Sim! O sistema é responsivo e funciona em smartphones e tablets. Use o navegador mobile.

**P: Minha sessão expirou. Perdi meu trabalho?**  
R: Formulários salvam automaticamente rascunhos localmente. Ao fazer login novamente, você pode recuperar.

**P: Como solicito novas funcionalidades?**  
R: Entre em contato com o administrador do sistema ou use o formulário de feedback em Ajuda > Sugerir Melhoria.

---

## 📞 Suporte

### Precisa de Ajuda?

**Contato do Suporte Técnico:**
- 📧 E-mail: [inserir e-mail]
- 📱 Telefone: [inserir telefone]
- 🕐 Horário: Segunda a Sexta, 8h-18h

### Reportar Bug

Se encontrar um erro:
1. Anote o que estava fazendo
2. Tire um print da tela
3. Envie para o suporte com:
   - Descrição do problema
   - Passos para reproduzir
   - Navegador utilizado

---

## 📝 Glossário

- **CAEPF:** Cadastro de Atividade Econômica da Pessoa Física (CPF de produtor rural)
- **Dashboard:** Tela inicial com resumo e métricas
- **Status Automático:** Tarefa gerada automaticamente pelo sistema
- **Periodicidade:** Intervalo em dias entre rotinas recorrentes
- **Proposta Comercial:** Orçamento formal enviado a cliente
- **Unidade:** Filial ou departamento da organização
- **Hard Refresh:** Recarregar página ignorando cache (Ctrl+F5)

---

**Fim do Manual do Usuário** | *Última atualização: Novembro 2025*
