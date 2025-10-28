# Configuração do Chat de IA (Google Gemini)

Este documento descreve como configurar e usar a integração com Google Gemini Flash no sistema Mirai.

## 📋 Pré-requisitos

1. **API Key do Google Gemini**
   - Acesse: https://makersuite.google.com/app/apikey
   - Crie um novo projeto ou use um existente
   - Gere uma API key
   - **Importante:** A versão Flash do Gemini é gratuita com limites generosos

## 🔧 Configuração

### Backend

1. **Adicionar a API Key no arquivo `.env`:**

```bash
# No diretório raiz do projeto
GEMINI_API_KEY=sua-api-key-aqui
GEMINI_MODEL=gemini-1.5-flash
```

2. **Instalar dependências** (já instaladas automaticamente):

```bash
cd server
npm install @google/generative-ai
```

3. **Verificar configuração:**

```bash
# No diretório server/
npm run dev
```

O servidor deve iniciar sem erros. Se a API Key não estiver configurada, você verá um aviso no console:
```
[AIService] GEMINI_API_KEY não configurada. Funcionalidades de IA desabilitadas.
```

## 🚀 Uso

### Frontend (Interface de Chat)

1. **Acessar o chat:**
   - Faça login no sistema
   - No menu lateral, clique em **"Chat IA"** (ícone ✨)
   - A página está disponível em `/ai/chat`

2. **Funcionalidades:**
   - ✅ Chat multi-turno (mantém histórico da conversa)
   - ✅ Respostas em tempo real
   - ✅ Indicador de cache (respostas já consultadas)
   - ✅ Limite de requisições visível (100/min por usuário)
   - ✅ Aviso quando próximo do limite
   - ✅ Auto-scroll para última mensagem
   - ✅ Suporte a Shift+Enter para nova linha

### API Endpoints

#### 1. **POST /api/ai/text** - Gerar texto simples

```bash
curl -X POST http://localhost:5000/api/ai/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"prompt": "Escreva um resumo sobre inteligência artificial"}'
```

**Resposta:**
```json
{
  "text": "A inteligência artificial (IA) é...",
  "cached": false,
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

#### 2. **POST /api/ai/image** - Analisar imagem (ESSENCIAL para checklist)

```bash
curl -X POST http://localhost:5000/api/ai/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "prompt": "Identifique os itens visíveis nesta imagem"
  }'
```

**Resposta:**
```json
{
  "description": "A imagem mostra um ambiente de trabalho...",
  "detected": ["computador", "teclado", "mouse", "monitor"],
  "confidence": "high",
  "cached": false,
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

#### 3. **POST /api/ai/chat** - Chat multi-turno

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Como posso melhorar minha produtividade?",
    "history": [
      {"role": "user", "text": "Olá!"},
      {"role": "model", "text": "Olá! Como posso ajudar?"}
    ]
  }'
```

**Resposta:**
```json
{
  "reply": "Para melhorar sua produtividade...",
  "history": [...],
  "cached": false,
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

#### 4. **GET /api/ai/stats** - Estatísticas de uso

```bash
curl http://localhost:5000/api/ai/stats?limit=50 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta:**
```json
{
  "userId": 123,
  "logs": [...],
  "summary": {
    "totalRequests": 45,
    "cachedRequests": 12,
    "cacheHitRate": "26.67%",
    "totalInputTokens": 15000,
    "totalOutputTokens": 12000,
    "totalTokens": 27000
  },
  "cache": {
    "size": 35,
    "maxSize": 500,
    "ttlMinutes": 15
  }
}
```

#### 5. **POST /api/ai/cache/clear** - Limpar cache

```bash
curl -X POST http://localhost:5000/api/ai/cache/clear \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Segurança e Limites

### Rate Limiting
- **100 requisições por minuto** por usuário
- Headers de resposta incluem:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp de reset
  - `Retry-After`: Segundos para tentar novamente (quando excede)

### Sanitização de Inputs
- Máximo de 30.000 caracteres para prompts de texto
- Máximo de 10.000 caracteres para mensagens de chat
- Máximo de ~10MB para imagens em base64
- Remoção automática de caracteres de controle

### Cache Inteligente
- **TTL:** 15 minutos
- **Capacidade:** 500 prompts únicos
- **Economia:** Reduz custos de tokens e latência
- **Visibilidade:** Indicador visual no frontend quando resposta vem do cache

## 🔍 Monitoramento

### Logs de Token
Todos os requests são logados com:
- User ID
- Método usado (`generateText`, `analyzeImage`, `chatMultiTurn`)
- Tokens de entrada e saída
- Se foi cache hit
- Timestamp

### Retry Automático
- **3 tentativas** com backoff exponencial (1s, 2s, 4s)
- Retry apenas em erros 429 (rate limit) e 5xx (server errors)
- Não faz retry em 4xx (bad request, unauthorized, etc.)

## 🐛 Troubleshooting

### Erro: "Gemini API não configurada"
- Verifique se `GEMINI_API_KEY` está definida no `.env`
- Reinicie o servidor após adicionar a variável

### Erro: "Taxa de requisições excedida"
- Aguarde 60 segundos
- O frontend mostra aviso quando próximo do limite
- Considere ajustar `MAX_REQUESTS` em `server/middleware/rateLimiter.ts`

### Erro 401/403 da API Gemini
- Verifique se a API key é válida
- Confirme que o projeto no Google Cloud está ativo
- Verifique cotas da API no console do Google

### Timeout
- Retry automático será acionado
- Se persistir, verifique conexão de internet
- Imagens muito grandes podem causar timeout (limite ~10MB)

## 📊 Uso em Checklist (Análise de Imagens)

Para integrar análise de imagens em checklists:

```typescript
// Exemplo de uso no frontend
const analyzeChecklistImage = async (base64Image: string) => {
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      image: base64Image,
      prompt: 'Identifique todos os itens de segurança visíveis nesta imagem e verifique se estão conformes.'
    })
  })
  
  const data = await response.json()
  return data.detected // Array de itens identificados
}
```

## 🎯 Boas Práticas

1. **Cache:** Reutilize prompts quando possível para economizar tokens
2. **Histórico:** Limite histórico de chat a ~20 mensagens para evitar contexto muito longo
3. **Imagens:** Redimensione imagens grandes antes de enviar (recomendado < 2MB)
4. **Prompts:** Seja específico e claro nos prompts para melhores resultados
5. **Erros:** Sempre trate erros 429 (rate limit) no frontend com mensagens amigáveis

## 📝 Arquivos Importantes

- **Backend:**
  - `server/services/aiService.ts` - Lógica principal de IA
  - `server/controllers/AIController.ts` - Endpoints HTTP
  - `server/middleware/rateLimiter.ts` - Rate limiting
  - `server/routes/ai.ts` - Rotas

- **Frontend:**
  - `src/pages/AIChat.tsx` - Interface de chat
  - `src/App.tsx` - Registro da rota

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique logs do servidor (`npm run dev` no diretório `server/`)
2. Consulte documentação oficial: https://ai.google.dev/docs
3. Verifique status da API: https://status.cloud.google.com/
