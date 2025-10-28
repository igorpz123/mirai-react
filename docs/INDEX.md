# 📚 Documentação Mirai React

Bem-vindo à documentação do projeto Mirai React!

## 🗂️ Índice de Documentação

### 🤖 Integração com IA (Google Gemini)
Documentação completa sobre a integração com Google Gemini AI:

- **[AI Setup](ai/AI_SETUP.md)** - Guia completo de instalação e configuração (260 linhas)
  - Instalação de dependências
  - Configuração do backend
  - Implementação frontend
  - Troubleshooting

- **[AI Quickstart](ai/AI_QUICKSTART.md)** ⚡ - Início rápido em 3 passos
  - Setup em 5 minutos
  - Configuração mínima
  - Teste rápido

- **[AI Prompt Examples](ai/AI_PROMPT_EXAMPLES.md)** 💡 - 20+ exemplos práticos
  - Análise de dados
  - Geração de conteúdo
  - Análise de imagens
  - Integração com checklists

- **[Gemini API Key Guide](ai/GEMINI_API_KEY_GUIDE.md)** 🔑 - Como gerar sua chave
  - Passo a passo com screenshots
  - Configuração no projeto
  - Validação da chave

### 🚀 Deployment
Guias e configurações para deploy em produção:

- **[Deploy Lightsail](deployment/DEPLOY_LIGHTSAIL.md)** - Deploy em AWS Lightsail
  - Configuração do servidor
  - Setup de ambiente
  - Scripts de deploy

- **[Nginx Config](deployment/nginx-mirai.conf)** - Configuração do Nginx
- **[Nginx Fixed Config](deployment/nginx-mirai-fixed.conf)** - Configuração corrigida
- **[.htaccess](deployment/.htaccess)** - Configuração Apache (se aplicável)

### ⚙️ Configuração
Arquivos de configuração do projeto disponíveis em `/config`:

- **[.env.example](../config/.env.example)** - Template de variáveis de ambiente
  - Configurações de banco de dados
  - JWT secret
  - API keys (Gemini)
  
- **[components.json](../config/components.json)** - Configuração de componentes UI

### 🛠️ Desenvolvimento
- **[Copilot Instructions](../.github/copilot-instructions.md)** - Convenções e arquitetura
  - Estrutura do monorepo
  - Padrões de código
  - Fluxo de autenticação
  - Sistema de notificações
  - Integração com IA

## 🔗 Links Rápidos

### Começando
1. Clone o repositório
2. Siga o [AI Quickstart](ai/AI_QUICKSTART.md) para integração com IA
3. Consulte [Deploy Lightsail](deployment/DEPLOY_LIGHTSAIL.md) para produção

### Desenvolvimento
- Frontend: `npm run dev` (porta 5173)
- Backend: `npm --prefix server run dev` (porta 5000)
- Build: `npm run build:full`

### Precisa de Ajuda?
- Verifique a seção **Troubleshooting** em [AI_SETUP.md](ai/AI_SETUP.md)
- Consulte os **Exemplos** em [AI_PROMPT_EXAMPLES.md](ai/AI_PROMPT_EXAMPLES.md)
- Leia as **Convenções** em [copilot-instructions.md](../.github/copilot-instructions.md)

---

📝 **Última atualização:** Outubro 2025  
🎯 **Versão:** 1.0  
💻 **Stack:** React + TypeScript + Vite + Express + MySQL + Google Gemini AI
