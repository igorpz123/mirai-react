# 🗺️ Guia Rápido - Onde Está Cada Coisa?

> **Última atualização:** 28/10/2025  
> **Estrutura reorganizada para facilitar navegação**

## 🔍 Encontre Rápido

### "Quero começar o projeto"
→ Leia: **[README.md](README.md)** (raiz)

### "Preciso configurar variáveis de ambiente"
→ Copie: **[config/.env.example](config/.env.example)**  
→ Guia: **[config/README.md](config/README.md)**

### "Quero integrar com IA (Google Gemini)"
→ Início rápido (5 min): **[docs/ai/AI_QUICKSTART.md](docs/ai/AI_QUICKSTART.md)**  
→ Setup completo: **[docs/ai/AI_SETUP.md](docs/ai/AI_SETUP.md)**  
→ Exemplos de uso: **[docs/ai/AI_PROMPT_EXAMPLES.md](docs/ai/AI_PROMPT_EXAMPLES.md)**  
→ Como gerar API Key: **[docs/ai/GEMINI_API_KEY_GUIDE.md](docs/ai/GEMINI_API_KEY_GUIDE.md)**

### "Como faço deploy?"
→ AWS Lightsail: **[docs/deployment/DEPLOY_LIGHTSAIL.md](docs/deployment/DEPLOY_LIGHTSAIL.md)**  
→ Config Nginx: **[docs/deployment/nginx-mirai-fixed.conf](docs/deployment/nginx-mirai-fixed.conf)**  
→ Guia completo: **[docs/deployment/README.md](docs/deployment/README.md)**

### "Preciso entender a arquitetura"
→ Instruções Copilot: **[.github/copilot-instructions.md](.github/copilot-instructions.md)**  
→ Estrutura: **[docs/ORGANIZATION.md](docs/ORGANIZATION.md)**

### "Onde estão os scripts de deploy?"
→ Pasta: **[scripts/](scripts/)**
- `deploy-all.ps1` - Deploy completo
- `deploy-frontend.ps1` - Apenas frontend  
- `deploy-backend.ps1` - Apenas backend
- `deploy-uploads.ps1` - Sync de uploads

---

## 📁 Mapa de Pastas

```
📂 mirai-react/
│
├── 📄 README.md ..................... Início do projeto
├── 📄 package.json .................. Dependências frontend
│
├── 📂 config/ ....................... ⚙️ CONFIGURAÇÕES
│   ├── 📄 README.md ................. Guia de configuração
│   ├── 📄 .env.example .............. Template de variáveis
│   └── 📄 components.json ........... Config de componentes UI
│
├── 📂 docs/ ......................... 📚 DOCUMENTAÇÃO
│   ├── 📄 INDEX.md .................. Índice geral
│   ├── 📄 ORGANIZATION.md ........... Como está organizado
│   │
│   ├── 📂 ai/ ....................... 🤖 Integração com IA
│   │   ├── 📄 README.md ............. Índice de docs de IA
│   │   ├── 📄 AI_SETUP.md ........... Setup completo
│   │   ├── 📄 AI_QUICKSTART.md ...... Setup rápido (5 min)
│   │   ├── 📄 AI_PROMPT_EXAMPLES.md . 20+ exemplos práticos
│   │   └── 📄 GEMINI_API_KEY_GUIDE.md Como gerar API Key
│   │
│   └── 📂 deployment/ ............... 🚀 Deploy em produção
│       ├── 📄 README.md ............. Guia de deploy
│       ├── 📄 DEPLOY_LIGHTSAIL.md ... AWS Lightsail
│       ├── 📄 nginx-mirai.conf ...... Config Nginx original
│       ├── 📄 nginx-mirai-fixed.conf  Config Nginx corrigida
│       └── 📄 .htaccess ............. Config Apache
│
├── 📂 scripts/ ...................... 🔧 Scripts PowerShell
│   ├── 📄 deploy-all.ps1 ............ Deploy completo
│   ├── 📄 deploy-frontend.ps1 ....... Deploy frontend
│   ├── 📄 deploy-backend.ps1 ........ Deploy backend
│   └── 📄 deploy-uploads.ps1 ........ Sync uploads
│
├── 📂 server/ ....................... 🖥️ BACKEND
│   ├── 📄 server.ts ................. Entrypoint do servidor
│   ├── 📄 package.json .............. Dependências backend
│   ├── 📂 config/ ................... Configurações (DB, Auth)
│   ├── 📂 controllers/ .............. Controllers REST
│   ├── 📂 routes/ ................... Rotas da API
│   ├── 📂 services/ ................. Lógica de negócio
│   ├── 📂 middleware/ ............... Middlewares (auth, upload)
│   └── 📂 uploads/ .................. Arquivos enviados
│
└── 📂 src/ .......................... ⚛️ FRONTEND
    ├── 📄 App.tsx ................... Componente principal
    ├── 📄 main.tsx .................. Entrypoint React
    ├── 📂 pages/ .................... Páginas da aplicação
    ├── 📂 components/ ............... Componentes reutilizáveis
    ├── 📂 contexts/ ................. Contexts (Auth, Realtime)
    ├── 📂 hooks/ .................... Custom hooks
    ├── 📂 services/ ................. APIs e integrações
    └── 📂 lib/ ...................... Utilitários
```

---

## 🎯 Por Tipo de Tarefa

### Frontend (React)
```bash
📂 src/
   ├── pages/       # Criar nova página aqui
   ├── components/  # Componentes reutilizáveis
   ├── contexts/    # Estados globais
   └── hooks/       # Custom hooks
```

### Backend (Express)
```bash
📂 server/
   ├── routes/       # Adicionar novas rotas
   ├── controllers/  # Lógica dos endpoints
   ├── services/     # Lógica de negócio
   └── middleware/   # Middlewares custom
```

### Configuração
```bash
📂 config/
   └── .env.example  # Template de variáveis

📂 server/
   ├── config/       # Configs de DB, Auth, etc
   └── .env          # Variáveis reais (não comitar!)
```

### Documentação
```bash
📂 docs/
   ├── INDEX.md                        # Começa aqui
   ├── ai/                             # Docs de IA
   └── deployment/                     # Docs de deploy
```

### Deploy
```bash
📂 scripts/                            # Scripts PowerShell
📂 docs/deployment/                    # Guias e configs
```

---

## 🆘 Solução Rápida de Problemas

### "Não consigo instalar dependências"
```bash
npm run install:all
```

### "Erro ao iniciar servidor"
```bash
# Verificar se tem .env configurado
ls server/.env

# Se não existir, criar:
cp config/.env.example server/.env
# Editar server/.env com suas credenciais
```

### "Erro de API Key do Gemini"
→ Leia: **[docs/ai/GEMINI_API_KEY_GUIDE.md](docs/ai/GEMINI_API_KEY_GUIDE.md)**

### "Frontend não encontra API"
```bash
# Verificar se backend está rodando:
curl http://localhost:5000/api/health
```

### "Build de produção falha"
```bash
# Limpar e rebuildar:
rm -rf dist server/dist node_modules server/node_modules
npm run install:all
npm run build:full
```

---

## 💡 Dicas

### Navegação Rápida
- Use `Ctrl+P` (VS Code) e digite nome do arquivo
- Use `grep -r "texto" .` para buscar em todo projeto
- Consulte `docs/INDEX.md` para links organizados

### Convenções de Código
- Leia **[.github/copilot-instructions.md](.github/copilot-instructions.md)**
- Backend: snake_case (DB), camelCase (código)
- Frontend: camelCase
- Async/await para operações assíncronas

### Ordem de Leitura Sugerida
1. **[README.md](README.md)** - Overview do projeto
2. **[config/README.md](config/README.md)** - Configuração inicial
3. **[docs/INDEX.md](docs/INDEX.md)** - Índice de documentação
4. **[docs/ai/AI_QUICKSTART.md](docs/ai/AI_QUICKSTART.md)** - Se for usar IA
5. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Arquitetura

---

## 📞 Ainda Perdido?

1. **Comece aqui:** [README.md](README.md)
2. **Veja o índice:** [docs/INDEX.md](docs/INDEX.md)
3. **Entenda a organização:** [docs/ORGANIZATION.md](docs/ORGANIZATION.md)
4. **Busque globalmente:**
   ```bash
   grep -r "o que você procura" .
   ```

---

📅 **Atualizado em:** 28/10/2025  
🎯 **Objetivo:** Facilitar navegação para novos e antigos colaboradores  
💬 **Feedback:** Abra uma issue se algo estiver confuso!
