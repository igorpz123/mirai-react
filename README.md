````markdown
# Mirai React - Sistema de Gestão

Sistema completo de gestão com React (Vite) no frontend e Express no backend, incluindo integração com Google Gemini AI.

## 🚀 Início Rápido

### Desenvolvimento Local

```bash
# Instalar dependências (root + server)
npm run install:all

# Terminal 1 - Frontend (Vite dev server)
npm run dev

# Terminal 2 - Backend (Express + Socket.IO)
npm --prefix server run dev
```

Acesse: `http://localhost:5173`

### Build de Produção

```bash
# Build completo (frontend + backend)
npm run build:full

# Servir em produção
cd server && SERVE_FRONT=true npm start
```

## 📁 Estrutura do Projeto

```
mirai-react/
├── src/                    # Frontend React + Vite
├── server/                 # Backend Express + Socket.IO
├── docs/                   # Documentação
│   ├── ai/                 # Docs de integração com IA
│   └── deployment/         # Docs e configs de deploy
├── config/                 # Arquivos de configuração
│   ├── .env.example        # Template de variáveis
│   └── components.json     # Configuração de componentes UI
├── scripts/                # Scripts de deploy (PowerShell)
└── public/                 # Arquivos estáticos

```

## 🤖 Integração com IA

Este projeto inclui integração completa com **Google Gemini 2.5 Flash**.

**Guias disponíveis:**
- 📖 [Setup Completo](docs/ai/AI_SETUP.md) - Instalação detalhada
- ⚡ [Quickstart](docs/ai/AI_QUICKSTART.md) - Início rápido (3 passos)
- 💡 [Exemplos de Prompts](docs/ai/AI_PROMPT_EXAMPLES.md) - 20+ exemplos práticos
- 🔑 [Guia de API Key](docs/ai/GEMINI_API_KEY_GUIDE.md) - Como gerar sua chave

**Funcionalidades:**
- ✨ Chat multi-turno com histórico
- 🖼️ Análise de imagens (base64)
- ⚡ Cache de respostas (15 min)
- 🚦 Rate limiting (100 req/min/usuário)
- 🔄 Retry com backoff exponencial
- 📊 Logging de tokens consumidos

## 🛠️ Tecnologias

**Frontend:**
- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Radix UI
- React Router v7
- Socket.IO Client

**Backend:**
- Node.js + Express
- TypeScript
- MySQL (mysql2/promise)
- Socket.IO (realtime)
- JWT Authentication
- Google Gemini AI

## 📚 Documentação Adicional

- [Deploy Lightsail](docs/deployment/DEPLOY_LIGHTSAIL.md)
- [Copilot Instructions](.github/copilot-instructions.md)

## 🔐 Configuração

Copie `config/.env.example` para `server/.env` e configure:

```env
# Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=mirai

# Auth
JWT_SECRET=seu_segredo_jwt

# AI (opcional)
GEMINI_API_KEY=sua_chave_api
GEMINI_MODEL=gemini-2.5-flash
```

## 📦 Scripts Disponíveis

```bash
npm run dev              # Dev frontend (Vite)
npm run build            # Build frontend
npm run build:server     # Build backend
npm run build:full       # Build frontend + backend
npm run install:all      # Instalar todas as dependências
```

## 🚢 Deploy

Scripts PowerShell disponíveis em `scripts/`:
- `deploy-all.ps1` - Deploy completo
- `deploy-frontend.ps1` - Deploy apenas frontend
- `deploy-backend.ps1` - Deploy apenas backend

Veja [DEPLOY_LIGHTSAIL.md](docs/deployment/DEPLOY_LIGHTSAIL.md) para instruções detalhadas.

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**
````
