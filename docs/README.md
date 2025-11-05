# 📚 Documentação Mirai React

Bem-vindo à documentação centralizada do projeto **Mirai React**!

## 🎯 Navegação Rápida

### 📖 Para Usuários
- **[Documentação do Usuário](./user/DOCUMENTACAO_USUARIO.md)** - Guia completo de uso do sistema
- **[Guia Rápido](GUIA_RAPIDO.md)** - Resumo executivo de 2 páginas
- **[FAQ](FAQ_COMPLETO.md)** - Perguntas frequentes (100+ respostas)
- **[Glossário](GLOSSARIO.md)** - Termos e definições
- **[Changelog](CHANGELOG.md)** - Histórico de atualizações e novidades

### 🛠️ Para Desenvolvedores

#### Arquitetura & Código
- **[Instruções do Copilot](../.github/copilot-instructions.md)** - Arquitetura completa do projeto
- **[Guia de Refatoração](DEVELOPMENT.md#refatoração)** - Padrões de código e utilitários

#### Funcionalidades Implementadas
- **[Sistema de Permissões](FEATURES.md#permissões)** - Controle de acesso baseado em roles
- **[Sistema de Ajuda Contextual](FEATURES.md#ajuda-contextual)** - Help system integrado
- **[Busca Global](FEATURES.md#busca-global)** - Busca com Ctrl+K
- **[Agenda de Usuários](FEATURES.md#agenda-usuários)** - Sistema de agenda
- **[Multi-Select](FEATURES.md#multi-select)** - Componentes de seleção múltipla
- **[Async Jobs](FEATURES.md#async-jobs)** - Processamento assíncrono

### 🚀 Deploy & Infraestrutura
- **[Deploy no Lightsail](./deployment/DEPLOY_LIGHTSAIL.md)** - Guia completo de deploy AWS
- **[Configurações do Nginx](./deployment/nginx-mirai-fixed.conf)** - Proxy reverso configurado

### 🤖 Inteligência Artificial
- **[Setup da IA (Google Gemini)](./ai/AI_SETUP.md)** - Instalação completa
- **[Guia Rápido IA](./ai/AI_QUICKSTART.md)** - Setup em 5 minutos
- **[Exemplos de Prompts](./ai/AI_PROMPT_EXAMPLES.md)** - 20+ exemplos práticos
- **[Chave API do Gemini](./ai/GEMINI_API_KEY_GUIDE.md)** - Como obter sua chave

---

## 📂 Estrutura da Documentação

```
docs/
├── README.md                    # Este arquivo (índice central)
├── FEATURES.md                  # Todas as funcionalidades implementadas
├── DEVELOPMENT.md               # Guias de desenvolvimento
├── CHANGELOG.md                 # Histórico de atualizações
├── GUIA_RAPIDO.md              # Guia rápido de uso
├── FAQ_COMPLETO.md             # Perguntas frequentes
├── GLOSSARIO.md                # Termos e definições
│
├── user/                       # Documentação do usuário
│   └── DOCUMENTACAO_USUARIO.md
│
├── ai/                         # Integração com IA
│   ├── AI_SETUP.md
│   ├── AI_QUICKSTART.md
│   ├── AI_PROMPT_EXAMPLES.md
│   └── GEMINI_API_KEY_GUIDE.md
│
└── deployment/                 # Deploy e infraestrutura
    ├── DEPLOY_LIGHTSAIL.md
    ├── nginx-mirai-fixed.conf
    └── .htaccess
```

---

## 🚀 Começando

### Para Novos Usuários
1. Leia o **[Guia Rápido](GUIA_RAPIDO.md)** (2 páginas)
2. Consulte o **[FAQ](FAQ_COMPLETO.md)** para dúvidas comuns
3. Use o **[Glossário](GLOSSARIO.md)** para termos técnicos

### Para Novos Desenvolvedores
1. Leia as **[Instruções do Copilot](../.github/copilot-instructions.md)** (arquitetura completa)
2. Configure o ambiente seguindo o **[README principal](../README.md)**
3. Consulte o **[Guia de Desenvolvimento](DEVELOPMENT.md)** para padrões de código
4. Veja **[Funcionalidades Implementadas](FEATURES.md)** para entender os sistemas

### Para Setup de IA
1. **Rápido**: Siga o **[AI Quickstart](./ai/AI_QUICKSTART.md)** (5 minutos)
2. **Completo**: Leia o **[AI Setup](./ai/AI_SETUP.md)** (guia detalhado)
3. **Exemplos**: Consulte **[Prompt Examples](./ai/AI_PROMPT_EXAMPLES.md)**

### Para Deploy
1. Leia o **[Guia de Deploy Lightsail](./deployment/DEPLOY_LIGHTSAIL.md)**
2. Configure o **[Nginx](./deployment/nginx-mirai-fixed.conf)**
3. Use os scripts em `/scripts/` para automatizar

---

## 🔍 Buscar na Documentação

### Por Categoria

**Autenticação & Segurança:**
- Sistema de Permissões → `FEATURES.md#permissões`
- JWT & Auth → `.github/copilot-instructions.md#authentication`

**Interface & UX:**
- Sistema de Ajuda → `FEATURES.md#ajuda-contextual`
- Busca Global → `FEATURES.md#busca-global`
- Multi-Select → `FEATURES.md#multi-select`

**Backend & APIs:**
- Arquitetura → `.github/copilot-instructions.md`
- Refatoração → `DEVELOPMENT.md#refatoração`
- Async Jobs → `FEATURES.md#async-jobs`

**IA & Automação:**
- Setup Google Gemini → `ai/AI_SETUP.md`
- Exemplos de Uso → `ai/AI_PROMPT_EXAMPLES.md`

---

## 📝 Contribuindo

Ao adicionar nova documentação:
1. **Funcionalidades**: Adicione em `FEATURES.md` com link para docs técnicas
2. **Desenvolvimento**: Adicione em `DEVELOPMENT.md` com exemplos de código
3. **Usuário**: Atualize `user/DOCUMENTACAO_USUARIO.md` e `FAQ_COMPLETO.md`
4. **Atualize este README**: Adicione links na navegação rápida

---

## 🆘 Precisa de Ajuda?

- **Usuários**: Consulte **[FAQ](FAQ_COMPLETO.md)** ou **[Documentação do Usuário](./user/DOCUMENTACAO_USUARIO.md)**
- **Desenvolvedores**: Veja **[DEVELOPMENT.md](DEVELOPMENT.md)** ou **[FEATURES.md](FEATURES.md)**
- **Deploy**: Leia **[DEPLOY_LIGHTSAIL.md](./deployment/DEPLOY_LIGHTSAIL.md)**
- **IA**: Consulte **[AI Troubleshooting](./ai/AI_SETUP.md#troubleshooting)**

---

📅 **Última atualização:** Novembro 2025  
🎯 **Versão:** 2.0  
💻 **Stack:** React 19 + TypeScript + Vite + Express + MySQL + Socket.IO + Google Gemini AI
