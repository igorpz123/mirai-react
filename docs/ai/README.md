# 🤖 Documentação de Integração com IA

Esta pasta contém toda a documentação relacionada à integração com **Google Gemini AI**.

## 📚 Guias Disponíveis

### [AI_SETUP.md](AI_SETUP.md) 📖
**Guia completo de configuração** (260 linhas)

Documentação abrangente incluindo:
- ✅ Instalação de dependências backend (`@google/generative-ai`)
- ✅ Implementação do serviço de IA (`aiService.ts`)
- ✅ Criação de controllers e rotas
- ✅ Implementação do frontend (página de chat)
- ✅ Configuração de variáveis de ambiente
- ✅ Troubleshooting detalhado

**Para quem:** Desenvolvedores fazendo setup inicial ou entendendo a arquitetura completa.

---

### [AI_QUICKSTART.md](AI_QUICKSTART.md) ⚡
**Início rápido em 3 passos** (110 linhas)

Guia resumido para setup em 5 minutos:
1. Instalar dependência
2. Configurar API Key
3. Testar integração

**Para quem:** Desenvolvedores que querem começar rapidamente.

---

### [AI_PROMPT_EXAMPLES.md](AI_PROMPT_EXAMPLES.md) 💡
**20+ exemplos práticos de uso** (300+ linhas)

Exemplos organizados por categoria:
- 📊 Análise de dados e relatórios
- ✍️ Geração de conteúdo
- 🖼️ Análise de imagens
- 📋 Integração com checklists
- 💬 Sugestões de chat

**Para quem:** Desenvolvedores e usuários finais buscando inspiração.

---

### [GEMINI_API_KEY_GUIDE.md](GEMINI_API_KEY_GUIDE.md) 🔑
**Passo a passo para gerar API Key**

Instruções detalhadas:
- Como acessar Google AI Studio
- Criar projeto e gerar chave
- Configurar no projeto
- Validar a chave com script de teste

**Para quem:** Qualquer pessoa que precise gerar uma API Key do Google Gemini.

---

## 🚀 Começando

### Setup Rápido (5 minutos)
```bash
# 1. Instalar dependência
cd server && npm install @google/generative-ai

# 2. Configurar API Key
# Edite server/.env e adicione:
# GEMINI_API_KEY=sua_chave_aqui
# GEMINI_MODEL=gemini-2.5-flash

# 3. Testar
cd /workspaces/mirai-react/server
export $(cat .env | grep -v '^#' | xargs)
node test-gemini-key.js
```

### Setup Completo
Siga o [AI_SETUP.md](AI_SETUP.md) para implementação completa.

---

## 🎯 Funcionalidades Implementadas

### ✨ Backend (`server/`)
- **`services/aiService.ts`** - Serviço principal com 3 métodos:
  - `generateText()` - Geração de texto
  - `analyzeImage()` - Análise de imagens base64
  - `chatMultiTurn()` - Chat com histórico multi-turno
  
- **Features:**
  - ⚡ Cache de respostas (15 min, 500 entradas)
  - 🔄 Retry com backoff exponencial (3 tentativas)
  - 📊 Logging de tokens consumidos
  - 🚦 Rate limiting (100 req/min por usuário)
  - 🛡️ Sanitização de inputs
  - ❌ Error handling robusto

### 🎨 Frontend (`src/`)
- **`pages/AIChat.tsx`** - Interface de chat moderna:
  - 💬 Conversas multi-turno
  - ⚡ Indicador de cache
  - 🚦 Display de rate limit
  - 📱 Design responsivo
  - 🌙 Suporte dark mode
  - ✨ Renderização de Markdown

---

## 📊 API Endpoints

Todos os endpoints estão em `/api/ai/`:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/ai/text` | POST | Geração de texto simples |
| `/api/ai/image` | POST | Análise de imagem (base64) |
| `/api/ai/chat` | POST | Chat multi-turno |
| `/api/ai/stats` | GET | Estatísticas de uso |
| `/api/ai/cache/clear` | POST | Limpar cache |

---

## 🔧 Troubleshooting

### Erro 401 "API keys are not supported by this API"
➡️ Você está usando chave do Vertex AI. Precisa gerar no [Google AI Studio](https://aistudio.google.com/apikey).

### Erro 404 "Model not found"
➡️ Modelo desatualizado. Use `gemini-2.5-flash` (versão atual).

### Erro 429 "Rate limit exceeded"
➡️ Limite de 100 req/min por usuário atingido. Aguarde 1 minuto.

### Mais soluções
Veja seção completa de troubleshooting em [AI_SETUP.md](AI_SETUP.md).

---

## 🔗 Links Úteis

- [Google AI Studio](https://aistudio.google.com/) - Gerar API Keys
- [Gemini API Docs](https://ai.google.dev/docs) - Documentação oficial
- [Pricing](https://ai.google.dev/pricing) - Preços e limites

---

## 📝 Notas

**Versões:**
- Modelo atual: `gemini-2.5-flash` (junho 2025)
- SDK: `@google/generative-ai` v0.21.0+
- Rate limit: 100 req/min (configurável)
- Cache TTL: 15 minutos (configurável)

**Custos:**
- Free tier: 15 RPM, 1M TPM, 1500 RPD
- Paid tier: Consulte [pricing oficial](https://ai.google.dev/pricing)

---

📚 Para mais detalhes, veja [documentação completa](../INDEX.md).
