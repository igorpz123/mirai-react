# 📝 Prompt para Documentação do Usuário - Sistema Mirai

## 🎯 Objetivo

Criar uma documentação completa, clara e amigável para usuários finais (não-técnicos) do Sistema Mirai, cobrindo todas as funcionalidades, fluxos de trabalho e casos de uso comuns.

---

## 📋 Contexto do Sistema

O **Sistema Mirai** é uma plataforma web de gestão empresarial com os seguintes módulos principais:

### Módulos Principais
1. **Dashboard Administrativo** - Métricas, KPIs e visão geral para gestores
2. **Dashboard Comercial** - Funil de vendas, propostas e metas
3. **Dashboard Técnico** - Tarefas, prazos e agenda
4. **Gestão de Empresas** - CRUD de empresas com suporte a CNPJ e CAEPF (CPF rural)
5. **Gestão de Tarefas** - Tarefas técnicas com sistema de tarefas automáticas
6. **Propostas Comerciais** - Criação de orçamentos com múltiplos tipos de itens
7. **Agenda** - Calendário integrado com tarefas e eventos
8. **Livro de Registros** - Histórico de atividades e relatórios
9. **Busca Global** - Pesquisa unificada em todos os módulos
10. **Notificações** - Sistema de notificações em tempo real (Socket.IO)

### Perfis de Usuário
- **Administrador/Diretor (cargoId 1, 2, 3)** - Acesso total
- **Comercial (cargoId 13)** - Foco em vendas e propostas
- **Técnico (outros)** - Foco em execução de tarefas

---

## 📖 Requisitos da Documentação

### 1. Público-Alvo
- **Usuários finais** sem conhecimento técnico
- **Novos colaboradores** em processo de onboarding
- **Gestores** que precisam entender o fluxo de trabalho
- **Equipe de suporte** como referência rápida

### 2. Estrutura Desejada

#### 2.1. Introdução
- Apresentação do sistema e seus objetivos
- Visão geral das funcionalidades
- Tipos de usuários e permissões
- Como obter credenciais de acesso

#### 2.2. Acesso e Navegação
- Login e recuperação de senha
- Estrutura da interface (sidebar, header, footer)
- Menu de navegação por perfil
- Atalhos de teclado úteis
- Busca global e como utilizá-la

#### 2.3. Módulo de Tarefas
Cobrir em detalhes:
- **Visualizar tarefas** - Tabela, colunas, significado de cada campo
- **Filtrar tarefas** - Por status, prioridade, responsável, unidade, prazo
- **Criar nova tarefa manual** - Passo a passo com screenshots conceituais
- **Editar tarefa existente** - Campos editáveis vs não-editáveis
- **Adicionar observações** - Como e quando usar
- **Upload de anexos** - Tipos de arquivo, limites, como visualizar/baixar
- **Alterar status** - Fluxo de status (Automático → Andamento → Concluído/Cancelado)
- **Atribuir/reatribuir técnico** - Como transferir responsabilidade
- **Excluir/cancelar tarefa** - Diferença entre cancelar e excluir
- **Tarefas automáticas** - O que são, como são geradas, como gerenciar
- **Prazos e alertas** - Como o sistema notifica sobre prazos próximos

#### 2.4. Módulo de Empresas
Cobrir em detalhes:
- **Visualizar empresas** - Tabela, filtros, ordenação
- **Buscar empresa** - Por nome, razão social, CNPJ, CAEPF
- **Criar nova empresa** - Formulário completo com validações
  - Diferença entre CNPJ e CAEPF (quando usar cada um)
  - Campos obrigatórios vs opcionais
  - Validação de CNPJ/CPF em tempo real
  - Unidade e técnico responsável
  - Periodicidade e data de renovação (impacto nas tarefas automáticas)
- **Editar empresa** - Campos editáveis, impacto nas tarefas
- **Inativar/reativar empresa** - Quando e como fazer
- **Gerar tarefas automáticas por unidade** - Processo detalhado
  - Seleção de anos futuros (0-5)
  - Processamento assíncrono e notificação
  - O que são as tarefas geradas (Inspeção Inicial, Renovação, Rotinas)
- **Visualizar tarefas e propostas vinculadas** - Na página de detalhes

#### 2.5. Módulo de Propostas Comerciais
Cobrir em detalhes:
- **Visualizar propostas** - Tabela, status, valores
- **Criar nova proposta** - Fluxo completo em 3 passos:
  1. **Buscar/criar empresa** - Por CNPJ ou CAEPF
  2. **Adicionar itens** - Dropdown com 4 tipos (Programa, Curso, Químico, Produto)
     - Como adicionar cada tipo
     - Editar quantidade e preço
     - Remover itens
  3. **Finalizar proposta** - Valor total, observações, criar
- **Editar proposta** - Adicionar/remover itens, alterar valores
- **Alterar status** - Fluxo (Rascunho → Enviada → Aprovada/Recusada)
- **Gerar PDF** - Como gerar, visualizar e enviar ao cliente
- **Excluir proposta** - Quando permitido, avisos

#### 2.6. Agenda
Cobrir em detalhes:
- **Visualizações** - Mês, Semana, Dia, Lista
- **Navegação** - Setas, botão "Hoje", seleção de data
- **Criar evento** - Clique rápido vs formulário completo
- **Editar evento** - Modificar campos, arrastar e soltar
- **Excluir evento** - Impacto em tarefas vinculadas
- **Eventos automáticos** - Gerados por tarefas, cores e categorias
- **Filtros** - Por tipo de tarefa, responsável, unidade

#### 2.7. Livro de Registros
Cobrir em detalhes:
- **Visualizar registros** - Tabela histórica
- **Criar novo registro** - Campos, tipos de atividade
- **Buscar registros** - Por período, empresa, tipo
- **Exportar registros** - PDF e Excel

#### 2.8. Busca Global
Cobrir em detalhes:
- **Como acessar** - Campo de busca, atalho Ctrl+K
- **O que é pesquisado** - Tarefas, empresas, propostas, usuários
- **Resultados em tempo real** - Categorização, relevância
- **Histórico de buscas** - Como funciona, limpar histórico
- **Dicas de busca eficiente** - Termos parciais, IDs, documentos

#### 2.9. Notificações
Cobrir em detalhes:
- **Tipos de notificação** - Tarefas, propostas, comentários, prazos
- **Visualizar notificações** - Painel lateral, badge de contagem
- **Marcar como lida** - Individual ou em lote
- **Notificações de processamento assíncrono** - Geração de tarefas em lote

#### 2.10. Perfil e Configurações
Cobrir em detalhes:
- **Editar perfil** - Foto, nome, e-mail, telefone
- **Alterar senha** - Requisitos, segurança
- **Tema** - Claro, escuro, automático
- **Logout** - Como sair com segurança

---

## 🎨 Estilo e Formatação

### Tom da Documentação
- **Amigável e acessível** - Evite jargões técnicos
- **Passo a passo claro** - Numere as etapas
- **Exemplos práticos** - Use casos reais de uso
- **Avisos e dicas** - Destaque informações importantes

### Elementos Visuais (Conceituais)
Use emojis e formatação Markdown para:
- 📋 **Listas e passos** numerados
- ⚠️ **Avisos e atenções** em destaque
- 💡 **Dicas e boas práticas**
- ✅ **Checklist de verificação**
- 🔍 **Exemplos de busca**
- 📊 **Tabelas comparativas**

### Seções Especiais

#### Dúvidas Frequentes (FAQ)
Para cada módulo, inclua:
- Perguntas comuns de usuários
- Erros frequentes e como evitar
- Casos especiais e exceções

#### Glossário
Defina termos específicos:
- Status de tarefas
- Tipos de propostas
- Campos técnicos
- Siglas (CNPJ, CAEPF, etc.)

#### Troubleshooting
Para problemas comuns:
- "Não consigo editar uma tarefa"
- "Empresa não aparece na busca"
- "PDF não está gerando"
- "Notificação não chegou"

---

## 📸 Screenshots (Diretrizes)

Como não podemos incluir imagens reais, use:

**Placeholders descritivos:**
```
[SCREENSHOT: Tela de Login com campos Email e Senha, botão Entrar em destaque]

[SCREENSHOT: Dashboard Técnico mostrando cards de métricas: 
- Total de Tarefas (15)
- Tarefas Atrasadas (3) em vermelho
- Tarefas da Semana (8)
- Tarefas Concluídas (10)]

[SCREENSHOT: Formulário de Nova Tarefa com campos preenchidos como exemplo:
- Empresa: "Empresa Exemplo Ltda"
- Tipo: "Renovação"
- Prioridade: "Alta"
- Prazo: "15/11/2025"
- Responsável: "João Silva"]
```

---

## 🔄 Fluxos de Trabalho Detalhados

### Exemplo: Fluxo Completo - Criar Empresa e Gerar Tarefas

```
1. Acesso ao Módulo
   ├─ Clicar em "Empresas" no menu lateral
   └─ Aguardar carregamento da lista

2. Iniciar Criação
   ├─ Clicar no botão "+ Nova Empresa"
   └─ Sheet lateral abre com formulário

3. Escolher Tipo de Documento
   ├─ Selecionar opção "CNPJ" (para empresas normais)
   └─ OU selecionar "CAEPF" (para produtores rurais)

4. Preencher Documento
   ├─ Digitar o CNPJ/CAEPF
   ├─ Sistema valida em tempo real
   ├─ ✓ Verde = válido
   └─ ✗ Vermelho = inválido (corrigir)

5. Preencher Dados Obrigatórios
   ├─ Razão Social (nome oficial)
   └─ Nome Fantasia (nome comercial)

6. Preencher Dados Opcionais
   ├─ Cidade
   ├─ Telefone (formatação automática)
   ├─ Unidade Responsável
   ├─ Técnico Responsável
   ├─ Periodicidade (ex: 30 dias)
   └─ Data de Renovação

7. Criar Empresa
   ├─ Botão "Criar Empresa" fica habilitado
   ├─ Clicar no botão
   └─ Sistema valida e salva

8. Confirmação
   ├─ Toast de sucesso aparece
   ├─ Sheet fecha
   ├─ Empresa aparece na lista
   └─ Se periodicidade foi definida: tarefas são geradas automaticamente

9. Resultado
   ├─ Empresa cadastrada e ativa
   ├─ Tarefas automáticas criadas (se configurado)
   └─ Eventos na agenda (vinculados às tarefas)
```

### Outros Fluxos Importantes
1. **Criar e enviar proposta comercial**
2. **Editar tarefa e adicionar observações**
3. **Gerar tarefas em lote para uma unidade**
4. **Alterar status de tarefa de Automático para Andamento**
5. **Buscar empresa, criar proposta e gerar PDF**

---

## 📊 Tabelas de Referência

### Tabela: Status de Tarefas

| Status | Significado | Ações Permitidas | Cor |
|--------|-------------|------------------|-----|
| Automático | Gerada pelo sistema | Visualizar, alterar status | Azul |
| Andamento | Em execução | Editar, adicionar observações, concluir | Amarelo |
| Concluído | Finalizada com sucesso | Visualizar apenas | Verde |
| Cancelado | Cancelada/descartada | Visualizar apenas | Vermelho |

### Tabela: Prioridades

| Prioridade | Quando Usar | Prazo Sugerido |
|------------|-------------|----------------|
| Normal | Tarefas de rotina | Até 30 dias |
| Alta | Requer atenção especial | Até 15 dias |
| Urgente | Crítico, prioridade máxima | Até 7 dias |

### Tabela: Tipos de Tarefa

| Tipo | Descrição | Frequência |
|------|-----------|------------|
| Inspeção Inicial | Primeira inspeção de nova empresa | Uma vez |
| Renovação | Renovação anual | Anual |
| Rotina | Visita de rotina | Conforme periodicidade |
| Outro | Tarefas ad-hoc | Sob demanda |

---

## ✅ Checklist de Completude

A documentação deve cobrir:

### Funcionalidades Básicas
- [ ] Login e logout
- [ ] Navegação entre módulos
- [ ] Busca global
- [ ] Notificações
- [ ] Edição de perfil

### Módulo Tarefas
- [ ] Visualizar lista de tarefas
- [ ] Criar nova tarefa
- [ ] Editar tarefa existente
- [ ] Adicionar observações
- [ ] Upload de anexos
- [ ] Alterar status
- [ ] Excluir/cancelar tarefa
- [ ] Filtrar e ordenar
- [ ] Entender tarefas automáticas

### Módulo Empresas
- [ ] Visualizar lista de empresas
- [ ] Criar nova empresa (CNPJ)
- [ ] Criar nova empresa (CAEPF)
- [ ] Editar empresa
- [ ] Inativar/reativar empresa
- [ ] Gerar tarefas automáticas por unidade
- [ ] Visualizar tarefas vinculadas

### Módulo Propostas
- [ ] Visualizar lista de propostas
- [ ] Criar proposta (3 passos)
- [ ] Adicionar itens (4 tipos)
- [ ] Editar proposta
- [ ] Alterar status
- [ ] Gerar PDF
- [ ] Excluir proposta

### Módulo Agenda
- [ ] Visualizações (mês/semana/dia/lista)
- [ ] Criar evento
- [ ] Editar evento
- [ ] Excluir evento
- [ ] Entender eventos automáticos
- [ ] Filtrar eventos

### Livro de Registros
- [ ] Visualizar registros
- [ ] Criar novo registro
- [ ] Buscar registros
- [ ] Exportar (PDF/Excel)

### FAQ e Troubleshooting
- [ ] Perguntas frequentes por módulo
- [ ] Problemas comuns e soluções
- [ ] Glossário de termos
- [ ] Contato de suporte

---

## 🚀 Casos de Uso Completos

### Caso 1: Onboarding de Novo Técnico
**Persona:** João, novo técnico contratado

**Jornada:**
1. Receber credenciais do administrador
2. Fazer primeiro login
3. Conhecer o dashboard técnico
4. Ver tarefas atribuídas a ele
5. Abrir uma tarefa e adicionar observação
6. Marcar tarefa como "Andamento"
7. Verificar agenda com suas tarefas
8. Criar um evento de visita técnica
9. Receber notificação de nova tarefa atribuída

### Caso 2: Vendedor Criando Proposta
**Persona:** Maria, vendedora comercial

**Jornada:**
1. Cliente liga pedindo orçamento
2. Maria acessa "Propostas"
3. Clica em "+ Nova Proposta"
4. Busca empresa pelo CNPJ (já existe)
5. Adiciona itens:
   - 1 Programa de Segurança
   - 3 Cursos de Capacitação
   - 5 Produtos Químicos
6. Revisa valor total
7. Cria a proposta (status Rascunho)
8. Edita e ajusta preços
9. Altera status para "Enviada"
10. Gera PDF e envia para cliente
11. Cliente aprova
12. Maria altera status para "Aprovada"
13. Recebe notificação de aprovação

### Caso 3: Gestor Gerenciando Empresas e Tarefas
**Persona:** Carlos, diretor de operações

**Jornada:**
1. Acessa dashboard administrativo
2. Vê métricas de tarefas atrasadas
3. Filtra tarefas por unidade
4. Identifica empresa sem tarefas geradas
5. Acessa "Empresas"
6. Edita empresa e configura:
   - Periodicidade: 30 dias
   - Data renovação: 01/01/2026
7. Confirma geração de tarefas para 2 anos
8. Sistema processa e notifica
9. Verifica na agenda as novas tarefas
10. Atribui técnico para cada tarefa

---

## 📝 Instruções de Escrita

### Para o Copilot:

**Objetivo Final:**
Criar uma documentação de usuário que permita a qualquer pessoa, independente do nível técnico, utilizar o Sistema Mirai de forma autônoma e eficiente.

**Abordagem:**
1. **Comece pelo básico** - Login e navegação
2. **Progrida gradualmente** - Do simples ao complexo
3. **Use linguagem simples** - Evite termos técnicos ou explique-os
4. **Seja visual** - Use formatação Markdown, emojis, tabelas
5. **Inclua exemplos** - Casos práticos para cada funcionalidade
6. **Antecipe dúvidas** - FAQ robusto para cada módulo

**Estrutura de Cada Seção:**
```
## [Nome do Módulo/Funcionalidade]

### O que é?
[Breve explicação do propósito]

### Como Acessar
[Passos para chegar à funcionalidade]

### Passo a Passo
[Instruções numeradas detalhadas]

### Dicas e Boas Práticas
[💡 Dicas úteis]

### Atenções e Avisos
[⚠️ Cuidados importantes]

### Perguntas Frequentes
[❓ FAQ específico]

### Casos de Uso
[Exemplos práticos]
```

**Expansões Necessárias:**
1. Para cada funcionalidade, expanda com **screenshots conceituais**
2. Adicione **mais exemplos práticos** para casos reais
3. Inclua **troubleshooting** detalhado
4. Crie **checklists** de verificação
5. Adicione **tabelas de referência rápida**
6. Inclua **fluxogramas de decisão** (em texto/Mermaid)

**Validação:**
Ao terminar, verifique se um usuário novo conseguiria:
- ✅ Fazer login e navegar no sistema
- ✅ Criar uma empresa do zero
- ✅ Criar uma tarefa manual
- ✅ Criar uma proposta completa
- ✅ Gerenciar sua agenda
- ✅ Usar a busca global eficientemente
- ✅ Entender notificações
- ✅ Resolver problemas comuns sozinho

---

## 🎯 Resultado Esperado

Uma documentação que:
1. **Seja autoexplicativa** - Não requeira suporte constante
2. **Cubra 100% das funcionalidades** do usuário final
3. **Inclua troubleshooting** para problemas comuns
4. **Seja pesquisável** - Fácil de encontrar informações
5. **Esteja atualizada** - Refletir o estado atual do sistema
6. **Seja acessível** - Disponível em HTML/PDF/Markdown

---

## 📦 Entregáveis

1. **DOCUMENTACAO_USUARIO.md** (completa e expandida)
2. **GUIA_RAPIDO.md** (resumo de 2 páginas)
3. **FAQ_COMPLETO.md** (todas as perguntas frequentes)
4. **GLOSSARIO.md** (termos e definições)
5. **CHANGELOG_USUARIO.md** (para futuras atualizações)

---

**Pronto para começar! Use este prompt como guia completo para criar a documentação definitiva do Sistema Mirai.**
