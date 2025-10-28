# 🚀 Guia de Início Rápido - Chat de IA

## Configuração em 3 passos

### 1️⃣ Obter API Key do Google Gemini (Gratuito)

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

### 2️⃣ Configurar no Backend

Edite o arquivo `.env` na raiz do projeto:

```bash
# Adicione esta linha:
GEMINI_API_KEY=sua-api-key-aqui
```

### 3️⃣ Iniciar o servidor

```bash
# Backend (terminal 1)
cd server
npm run dev

# Frontend (terminal 2)
npm run dev
```

## ✅ Testar

1. Acesse: http://localhost:5173
2. Faça login
3. Clique em **"Chat IA"** no menu lateral (ícone ✨)
4. Digite uma mensagem e teste!

## 📦 O que foi criado?

### Backend (7 arquivos)
- ✅ `server/services/aiService.ts` - Serviço principal de IA
- ✅ `server/controllers/AIController.ts` - Controladores HTTP
- ✅ `server/middleware/rateLimiter.ts` - Rate limiting (100/min)
- ✅ `server/routes/ai.ts` - Rotas da API
- ✅ `server/routes/router.ts` - Registro das rotas (atualizado)

### Frontend (3 arquivos)
- ✅ `src/pages/AIChat.tsx` - Interface de chat
- ✅ `src/App.tsx` - Rota registrada (atualizado)
- ✅ `src/components/layout/app-sidebar.tsx` - Menu lateral (atualizado)

### Documentação (3 arquivos)
- ✅ `config/.env.example` - Template de variáveis de ambiente
- ✅ `docs/ai/AI_SETUP.md` - Documentação completa
- ✅ `.github/copilot-instructions.md` - Instruções para IA (atualizado)

## 🎯 Funcionalidades Implementadas

### ✨ Recursos Principais
- [x] Chat multi-turno com histórico
- [x] Análise de imagens em base64 (essencial para checklist)
- [x] Geração de texto simples
- [x] Cache inteligente (15min TTL, economiza tokens)
- [x] Rate limiting (100 req/min por usuário)
- [x] Retry automático com backoff exponencial
- [x] Logs de consumo de tokens
- [x] Sanitização de inputs
- [x] Tratamento de erros (429, 500, timeout)

### 🎨 Interface do Chat
- [x] Design moderno e responsivo
- [x] Indicador de cache (respostas já consultadas)
- [x] Contador de requisições restantes
- [x] Aviso quando próximo do limite
- [x] Auto-scroll para última mensagem
- [x] Suporte a Shift+Enter para nova linha
- [x] Sugestões de prompts iniciais
- [x] Botão de limpar histórico

## 📊 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/ai/text` | Gerar texto simples |
| POST | `/api/ai/image` | Analisar imagem base64 |
| POST | `/api/ai/chat` | Chat multi-turno |
| GET | `/api/ai/stats` | Estatísticas de uso |
| POST | `/api/ai/cache/clear` | Limpar cache |

## 🔐 Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Rate limiting por usuário (100/min)
- ✅ Validação de inputs (tamanho, formato)
- ✅ Sanitização automática
- ✅ Cache isolado por usuário

## 📝 Próximos Passos (Opcional)

1. **Persistência de histórico:** Salvar conversas no banco de dados
2. **Contexto do sistema:** Permitir que IA acesse dados do usuário (tarefas, propostas)
3. **Streaming:** Respostas em tempo real (palavra por palavra)
4. **Múltiplas conversas:** Permitir criar/gerenciar várias threads de chat
5. **Compartilhamento:** Compartilhar conversas com outros usuários
6. **Integração com checklist:** Botão "Analisar com IA" em fotos de checklist

## 🆘 Problemas Comuns

**"Gemini API não configurada"**
→ Adicione `GEMINI_API_KEY` no `.env` e reinicie o servidor

**"Taxa de requisições excedida"**
→ Aguarde 60 segundos ou ajuste o limite em `rateLimiter.ts`

**Timeout/Erro de conexão**
→ Verifique sua internet e se a API Key é válida

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/ai/AI_SETUP.md` - Guia completo de configuração e uso
- `docs/ai/AI_PROMPT_EXAMPLES.md` - Exemplos práticos de uso
- `docs/ai/GEMINI_API_KEY_GUIDE.md` - Como gerar sua API Key
- `.github/copilot-instructions.md` - Padrões para desenvolvimento

## 🎉 Pronto!

Seu sistema agora tem integração completa com Google Gemini Flash!
