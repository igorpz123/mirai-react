# 🤖 Documentação de Integração com IA

Esta pasta contém toda a documentação relacionada à integração com **IA no Mirai React**.

O sistema suporta **dois providers de IA**:
- 🌐 **Google Gemini** (IA na nuvem)
- 🏠 **Ollama** (IA local)

Com **sistema híbrido** e **fallback automático** entre providers.

---

## 📚 Guias Disponíveis

### [OLLAMA_SETUP.md](OLLAMA_SETUP.md) 🏠 **NOVO!**
**Guia completo de instalação do Ollama** (300+ linhas)

Setup completo de IA local incluindo:
- ✅ Instalação do Ollama (Linux, macOS, Windows)
- ✅ Download de modelos (llama3.2, llava, mistral)
- ✅ Configuração do sistema híbrido
- ✅ Fallback automático para Gemini
- ✅ Comparação de performance
- ✅ Troubleshooting detalhado
- ✅ Requisitos de hardware

**Para quem:** Desenvolvedores que querem rodar IA localmente com privacidade e sem custos.

---

### [AI_SETUP.md](AI_SETUP.md) 📖
**Guia completo de configuração do Gemini** (260 linhas)

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

### Escolha seu Provider

#### Opção 1: Ollama (IA Local) 🏠
**Recomendado se:** Você tem servidor com ≥8GB RAM e quer privacidade/custo zero.

```bash
# 1. Instalar Ollama e modelos
cd server/scripts
./setup-ollama.sh

# 2. Configurar .env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2
OLLAMA_VISION_MODEL=llava

# 3. Testar
./test-ollama.sh
```

**Guia completo:** [OLLAMA_SETUP.md](OLLAMA_SETUP.md)

---

#### Opção 2: Google Gemini (IA na Nuvem) ☁️
**Recomendado se:** Você quer setup rápido e não tem hardware adequado.

```bash
# 1. Instalar dependência
cd server && npm install @google/generative-ai

# 2. Configurar .env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash

# 3. Testar
export $(cat .env | grep -v '^#' | xargs)
node test-gemini-key.js
```

**Guia completo:** [AI_SETUP.md](AI_SETUP.md)

---

#### Opção 3: Sistema Híbrido (Recomendado) 🔄
**Ollama como principal + Gemini como fallback**

```bash
# Configurar .env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
GEMINI_API_KEY=sua_chave_aqui  # Para fallback

# Sistema usará Ollama e fará fallback para Gemini se:
# - Ollama não responder (ECONNREFUSED)
# - Timeout (>30s)
# - Erro interno (500)
```

---

## 🎯 Funcionalidades Implementadas

### ✨ Backend (`server/`)

**Arquitetura Híbrida:**
- **`services/aiService.ts`** - Serviço Gemini (original)
- **`services/aiService.ollama.ts`** - Serviço Ollama (novo)
- **`services/aiService.hybrid.ts`** - Gerenciador híbrido com fallback automático

**3 Métodos Principais:**
- `generateText()` - Geração de texto
- `analyzeImage()` - Análise de imagens base64
- `chatMultiTurn()` - Chat com histórico multi-turno

**Features Avançadas:**
- ⚡ Cache de respostas (15 min, 500 entradas)
- 🔄 Retry com backoff exponencial (3 tentativas)
- 📊 Logging de tokens consumidos
- 🚦 Rate limiting (100 req/min por usuário)
- 🛡️ Sanitização de inputs
- 🔀 Fallback automático entre providers
- 🎭 Controle de concorrência (3 requisições Ollama simultâneas)
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

| Endpoint | Método | Descrição | Resposta Inclui Provider |
|----------|--------|-----------|--------------------------|
| `/api/ai/health` | GET | Health check dos providers | ✅ |
| `/api/ai/text` | POST | Geração de texto simples | ✅ provider, usedFallback, responseTime |
| `/api/ai/image` | POST | Análise de imagem (base64) | ✅ provider, usedFallback, responseTime |
| `/api/ai/chat` | POST | Chat multi-turno | ✅ provider, usedFallback, responseTime |
| `/api/ai/stats` | GET | Estatísticas de uso | ✅ Separado por provider |
| `/api/ai/cache/clear` | POST | Limpar cache | - |

### Exemplo de Resposta Híbrida

```json
{
  "text": "TypeScript é uma linguagem...",
  "cached": false,
  "provider": "ollama",
  "usedFallback": false,
  "responseTime": 1234,
  "timestamp": "2025-11-05T..."
}
```

### Health Check Response

```json
{
  "ollama": {
    "available": true,
    "url": "http://localhost:11434",
    "models": ["llama3.2", "llava"],
    "responseTime": 45
  },
  "gemini": {
    "available": true,
    "configured": true
  },
  "currentProvider": "ollama",
  "fallbackEnabled": true
}
```

---

## 🔧 Troubleshooting

### Ollama
➡️ Veja [OLLAMA_SETUP.md - Troubleshooting](OLLAMA_SETUP.md#troubleshooting)

Problemas comuns:
- Servidor não responde → Execute `ollama serve`
- Modelo não encontrado → Execute `ollama pull llama3.2`
- Out of memory → Use modelo menor ou aumente RAM
- Timeout → Aumente `OLLAMA_TIMEOUT` no .env

### Gemini

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

### Ollama
- [Ollama Official](https://ollama.com/) - Website oficial
- [Model Library](https://ollama.com/library) - Catálogo de modelos
- [GitHub](https://github.com/ollama/ollama) - Código fonte
- [API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md) - Documentação da API

### Gemini
- [Google AI Studio](https://aistudio.google.com/) - Gerar API Keys
- [Gemini API Docs](https://ai.google.dev/docs) - Documentação oficial
- [Pricing](https://ai.google.dev/pricing) - Preços e limites

---

## 📝 Notas

**Providers Suportados:**
- Ollama (local) - llama3.2, llava, mistral, etc.
- Google Gemini (cloud) - gemini-2.5-flash

**Versões:**
- Modelo Gemini atual: `gemini-2.5-flash` (junho 2025)
- SDK Gemini: `@google/generative-ai` v0.21.0+
- Ollama: 0.1.0+

**Configurações Padrão:**
- Rate limit: 100 req/min por usuário (configurável)
- Cache TTL: 15 minutos (configurável)
- Ollama timeout: 30s texto, 60s imagem
- Ollama concurrency: 3 requisições simultâneas

**Custos:**
- **Ollama:** Gratuito (custos de infraestrutura)
- **Gemini Free tier:** 15 RPM, 1M TPM, 1500 RPD
- **Gemini Paid tier:** Consulte [pricing oficial](https://ai.google.dev/pricing)

**Sistema Híbrido:**
- Provider principal configurável via `AI_PROVIDER`
- Fallback automático de Ollama → Gemini
- Cache separado por provider
- Logs unificados com tag de provider

---

## 🆕 Changelog

### v2.0 (Novembro 2025)
- ✨ Adicionado suporte ao Ollama (IA local)
- ✨ Sistema híbrido com fallback automático
- ✨ Controle de concorrência para Ollama
- ✨ Health check endpoint (`/api/ai/health`)
- ✨ Provider metadata em todas as respostas
- ✨ Scripts de instalação e teste
- 📚 Documentação completa do Ollama
- 🐛 Compatibilidade mantida com frontend existente

### v1.0 (Original)
- ✨ Integração com Google Gemini
- ✨ Cache de respostas
- ✨ Rate limiting
- ✨ Retry com backoff
- ✨ Chat multi-turno
- ✨ Análise de imagens

---

📚 Para mais detalhes, veja [documentação completa](../INDEX.md).
