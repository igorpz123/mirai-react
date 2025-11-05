# 🤖 Prompt para Implementação Completa do Ollama

## Objetivo
Implementar integração com **Ollama (IA local)** no sistema Mirai React, mantendo **compatibilidade com a estrutura atual** do Gemini e criando um **sistema híbrido** com fallback automático.

## Contexto Técnico
- **Stack:** React + Vite + Express + TypeScript + Socket.IO
- **Estrutura atual:** Sistema de IA usando Google Gemini em `server/services/aiService.ts`
- **Funcionalidades existentes:** Geração de texto, análise de imagem, chat multi-turno, cache, rate limiting, logs de tokens
- **Arquivos relacionados:** 
  - `server/services/aiService.ts` (service principal)
  - `server/controllers/AIController.ts` (endpoints)
  - `server/routes/ai.ts` (rotas)
  - `server/middleware/rateLimiter.ts` (rate limiting)

## Requisitos da Implementação

### 1. Criar Novo Service com Ollama (`server/services/aiService.ollama.ts`)

**Funcionalidades obrigatórias:**
- ✅ `generateText(userId, prompt)` - Usar modelo `llama3.2` ou `mistral`
- ✅ `analyzeImage(userId, base64Image, prompt)` - Usar modelo `llava` para visão computacional
- ✅ `chatMultiTurn(userId, message, history)` - Chat com contexto de histórico
- ✅ **Retry com backoff exponencial** (3 tentativas, delays: 1s, 2s, 4s)
- ✅ **Cache de respostas** (Map<string, CacheEntry> com TTL de 15min)
- ✅ **Logs de consumo** (tracking de tokens estimados e performance)
- ✅ **Timeout de 30 segundos** por requisição
- ✅ **Sanitização de inputs** (remover caracteres de controle, limite de 30k caracteres)
- ✅ **Tratamento de erros específicos** (timeout, connection refused, rate limit)

**API Ollama:**
```typescript
// Endpoint: POST http://localhost:11434/api/generate
// Corpo para texto:
{
  model: 'llama3.2',
  prompt: string,
  stream: false,
  options: { temperature: 0.7, num_predict: 2048 }
}

// Corpo para imagem:
{
  model: 'llava',
  prompt: string,
  images: [base64String], // sem prefixo data:image/...
  stream: false
}

// Resposta:
{
  response: string,
  model: string,
  created_at: string,
  done: boolean
}
```

**Variáveis de ambiente (adicionar ao `.env`):**
```bash
# Configuração de IA
AI_PROVIDER=ollama          # 'ollama' ou 'gemini'
OLLAMA_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2
OLLAMA_VISION_MODEL=llava
OLLAMA_TIMEOUT=30000        # 30 segundos
```

### 2. Criar Service Híbrido (`server/services/aiService.hybrid.ts`)

**Lógica de fallback:**
```typescript
1. Detectar AI_PROVIDER do .env ('ollama' ou 'gemini')
2. Se 'ollama':
   - Tentar Ollama primeiro
   - Se falhar (ECONNREFUSED, timeout, erro 500):
     → Log de warning
     → Fallback automático para Gemini
     → Adicionar flag 'usedFallback: true' na resposta
3. Se 'gemini':
   - Usar apenas Gemini (comportamento atual)
```

**Interface comum:**
```typescript
export interface AIResponse<T> {
  data: T
  cached: boolean
  provider: 'ollama' | 'gemini'
  usedFallback?: boolean
  responseTime?: number
}
```

### 3. Atualizar Controller (`server/controllers/AIController.ts`)

**Mudanças necessárias:**
- ✅ Importar `aiService.hybrid.ts` ao invés de `aiService.ts`
- ✅ Retornar campo adicional `provider` em todas as respostas
- ✅ Adicionar campo `usedFallback` quando fallback for usado
- ✅ Adicionar campo `responseTime` (tempo de execução em ms)
- ✅ Manter compatibilidade com frontend existente

**Exemplo de resposta atualizada:**
```json
{
  "text": "...",
  "cached": false,
  "provider": "ollama",
  "usedFallback": false,
  "responseTime": 1234,
  "timestamp": "2025-11-05T..."
}
```

### 4. Criar Endpoint de Health Check (`GET /api/ai/health`)

**Resposta esperada:**
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

**Implementação:**
- Testar conexão com Ollama via `GET /api/tags`
- Verificar se `GEMINI_API_KEY` está configurada
- Retornar status de ambos os providers

### 5. Criar Scripts de Setup

**Script 1: `server/scripts/setup-ollama.sh`**
```bash
#!/bin/bash
# Instalar Ollama e baixar modelos necessários

echo "🤖 Instalando Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo "📦 Baixando modelos..."
ollama pull llama3.2    # ~2GB - Texto
ollama pull llava       # ~4.7GB - Visão
ollama pull mistral     # ~4GB - Alternativa

echo "✅ Ollama configurado! Servidor rodando em localhost:11434"
```

**Script 2: `server/scripts/test-ollama.sh`**
```bash
#!/bin/bash
# Testar se Ollama está funcionando

echo "🧪 Testando Ollama..."
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, world!",
  "stream": false
}'
```

### 6. Atualizar Documentação

**Criar arquivo: `docs/ai/OLLAMA_SETUP.md`**

Conteúdo:
- ✅ Passo a passo de instalação do Ollama
- ✅ Comandos para baixar modelos
- ✅ Configuração de variáveis de ambiente
- ✅ Troubleshooting comum (porta ocupada, modelos não encontrados, out of memory)
- ✅ Comparação de performance Ollama vs Gemini
- ✅ Requisitos de hardware (RAM, CPU, GPU opcional)

**Atualizar arquivo: `docs/ai/README.md`**
- Adicionar seção sobre Ollama
- Documentar sistema híbrido e fallback
- Exemplos de uso com cada provider

### 7. Adicionar Testes no Frontend (Opcional)

**Criar: `src/pages/AITest.tsx`**
- Interface para testar ambos os providers
- Botão "Testar Ollama" e "Testar Gemini"
- Exibir tempo de resposta e provider usado
- Mostrar status de fallback

### 8. Considerações de Performance

**Otimizações obrigatórias:**
- ✅ **Streaming desabilitado** (Ollama suporta, mas simplifica implementação inicial)
- ✅ **Context size:** Limitar a 4096 tokens para evitar OOM
- ✅ **Concurrency:** Máximo 3 requisições simultâneas ao Ollama (via Semaphore)
- ✅ **Cache agressivo:** Respostas idênticas em 15min não reprocessam
- ✅ **Timeout:** 30s para texto, 60s para imagem (visão é mais lenta)

### 9. Tratamento de Erros Específicos

**Erros do Ollama:**
```typescript
// ECONNREFUSED - Ollama não está rodando
→ "Ollama não está disponível. Usando Gemini como fallback."

// Model not found - Modelo não baixado
→ "Modelo X não encontrado. Execute: ollama pull X"

// Out of memory - RAM insuficiente
→ "Memória insuficiente para processar. Tente um prompt menor."

// Timeout
→ "Requisição demorou muito. Usando Gemini como fallback."
```

### 10. Logs e Monitoramento

**Logs obrigatórios:**
```typescript
console.log('[Ollama] Tentando gerar texto com llama3.2...')
console.log('[Ollama] Resposta recebida em 1234ms')
console.warn('[Ollama] Falha na conexão, usando fallback para Gemini')
console.error('[Ollama] Erro inesperado:', error)
```

**Estatísticas de uso (adicionar ao `/api/ai/stats`):**
```json
{
  "totalRequests": 150,
  "ollamaRequests": 120,
  "geminiRequests": 30,
  "fallbackCount": 15,
  "averageResponseTime": {
    "ollama": 1234,
    "gemini": 890
  }
}
```

## Checklist de Implementação

- [ ] Criar `server/services/aiService.ollama.ts` com API do Ollama
- [ ] Criar `server/services/aiService.hybrid.ts` com lógica de fallback
- [ ] Atualizar `server/controllers/AIController.ts` para usar híbrido
- [ ] Adicionar endpoint `GET /api/ai/health`
- [ ] Criar scripts `setup-ollama.sh` e `test-ollama.sh`
- [ ] Adicionar variáveis de ambiente ao `.env.example`
- [ ] Criar documentação em `docs/ai/OLLAMA_SETUP.md`
- [ ] Atualizar `docs/ai/README.md`
- [ ] Testar geração de texto com Ollama
- [ ] Testar análise de imagem com llava
- [ ] Testar fallback automático (parar Ollama e verificar se usa Gemini)
- [ ] Testar cache e rate limiting com ambos os providers
- [ ] Verificar logs e estatísticas de uso

## Critérios de Sucesso

✅ **Funcional:** Sistema gera texto e analisa imagens via Ollama  
✅ **Compatível:** Frontend não precisa de alterações (mesma API)  
✅ **Robusto:** Fallback automático para Gemini em caso de falha  
✅ **Monitorado:** Logs claros e estatísticas de uso por provider  
✅ **Documentado:** Setup completo e troubleshooting no docs/  

## Exemplo de Uso Final

```typescript
// Backend decide automaticamente qual provider usar
const result = await generateText(userId, "Explique TypeScript")

// Resposta:
{
  text: "TypeScript é uma linguagem...",
  cached: false,
  provider: "ollama",      // ou "gemini" se usou fallback
  usedFallback: false,
  responseTime: 1234
}
```

---

**🎯 Este prompt está pronto para ser usado com o GitHub Copilot Coding Agent ou para implementação manual passo a passo.**
