# 🔑 GUIA: Como Obter a API Key CORRETA do Google Gemini

## ⚠️ IMPORTANTE: Existem 2 APIs Diferentes!

### ❌ ERRADO - Google Cloud Vertex AI
- URL: https://console.cloud.google.com
- Requer OAuth2
- Requer projeto e billing no Google Cloud
- **NÃO FUNCIONA** com API Key simples

### ✅ CORRETO - Google AI Studio (Gratuito)
- URL: https://aistudio.google.com/app/apikey
- Usa API Key simples
- Gratuito com limites generosos
- **É O QUE VOCÊ PRECISA!**

---

## 📋 Passo a Passo (Correto)

### 1️⃣ Acesse o Google AI Studio
```
https://aistudio.google.com/app/apikey
```

### 2️⃣ Faça Login
- Use sua conta Google (Gmail)
- Aceite os termos de uso se aparecer

### 3️⃣ Criar API Key
1. Clique em **"Get API Key"** ou **"Create API Key"**
2. Selecione **"Create API key in new project"** (ou use um projeto existente)
3. A chave será gerada automaticamente

### 4️⃣ Copiar a Chave
- Formato correto: `AIzaSy...` (começa com `AIzaSy`)
- Tamanho: ~39 caracteres
- **Exemplo:** `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5️⃣ Adicionar no .env
```bash
# No arquivo server/.env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash-latest
```

### 6️⃣ Reiniciar o Servidor
```bash
# Pare o servidor (Ctrl+C) e reinicie
cd server
npm run dev
```

---

## 🔍 Verificar se a Chave Está Correta

### ✅ Chave Correta:
- Começa com: `AIzaSy`
- Tamanho: 39 caracteres
- Exemplo: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### ❌ Chave Errada:
- Começa com: `AQ.Ab` ou outro formato
- Tamanho diferente de 39
- Foi gerada no Google Cloud Console

---

## 🧪 Testar a API Key (via cURL)

```bash
# Substitua YOUR_API_KEY pela sua chave
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Olá, você está funcionando?"
      }]
    }]
  }'
```

**Resposta esperada (sucesso):**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Sim, estou funcionando!"
          }
        ]
      }
    }
  ]
}
```

**Resposta de erro (chave inválida):**
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid..."
  }
}
```

---

## 🆘 Problemas Comuns

### Erro: "API keys are not supported by this API"
**Causa:** Você gerou a chave no Google Cloud Console (errado)  
**Solução:** Gerar nova chave em https://aistudio.google.com/app/apikey

### Erro: "API key not valid"
**Causa:** Chave inválida, expirada ou com formato errado  
**Solução:** Gerar nova chave no AI Studio

### Erro: "User location is not supported"
**Causa:** Gemini não está disponível no seu país  
**Solução:** Usar VPN ou aguardar disponibilidade

### Erro: "Quota exceeded"
**Causa:** Limite gratuito excedido  
**Solução:** 
- Aguardar reset (diário/mensal)
- Verificar limites em https://aistudio.google.com/

---

## 📊 Limites da Versão Gratuita

| Recurso | Limite Gratuito |
|---------|----------------|
| Requisições/minuto | 15 |
| Requisições/dia | 1.500 |
| Tokens/minuto | 1.000.000 |
| Tokens/dia | Variável |

---

## 🔗 Links Úteis

- **Gerar API Key:** https://aistudio.google.com/app/apikey
- **Documentação:** https://ai.google.dev/docs
- **Modelos disponíveis:** https://ai.google.dev/models/gemini
- **Playground:** https://aistudio.google.com/

---

## ✅ Checklist Final

- [ ] Acessei https://aistudio.google.com/app/apikey
- [ ] Gerei nova API Key
- [ ] Chave começa com `AIzaSy`
- [ ] Adicionei no arquivo `server/.env`
- [ ] Reiniciei o servidor
- [ ] Testei no chat

---

**Após gerar a chave correta, reinicie o servidor e teste novamente!** 🚀
