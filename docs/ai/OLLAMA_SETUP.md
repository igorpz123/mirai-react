# 🤖 Guia de Setup do Ollama no Mirai React

Este guia completo ensina como instalar e configurar o **Ollama** (IA local) no sistema Mirai React, com suporte híbrido e fallback automático para o Google Gemini.

## 📋 Índice

1. [O que é Ollama?](#o-que-é-ollama)
2. [Requisitos de Hardware](#requisitos-de-hardware)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Uso e Teste](#uso-e-teste)
6. [Comparação Ollama vs Gemini](#comparação-ollama-vs-gemini)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## O que é Ollama?

**Ollama** é uma plataforma que permite rodar modelos de IA grandes (LLMs) **localmente** em sua própria máquina, sem depender de APIs externas. Principais benefícios:

- ✅ **Privacidade:** Dados não saem do seu servidor
- ✅ **Sem custos:** Não há cobrança por tokens ou requisições
- ✅ **Offline:** Funciona sem conexão com internet
- ✅ **Controle total:** Você gerencia os modelos e recursos

O Mirai React implementa um **sistema híbrido** que pode usar Ollama como provider principal e fazer fallback automático para Gemini em caso de falhas.

---

## Requisitos de Hardware

### Mínimos (Funcional)
- **RAM:** 8 GB
- **Armazenamento:** 15 GB livres
- **CPU:** Qualquer processador moderno (x64)
- **GPU:** Opcional (acelera processamento)

### Recomendados (Performance Ideal)
- **RAM:** 16 GB ou mais
- **Armazenamento:** 30 GB livres (SSD preferível)
- **CPU:** 4+ cores
- **GPU:** NVIDIA com 6+ GB VRAM (CUDA) ou Apple Silicon (M1/M2)

### Requisitos por Modelo

| Modelo | Tamanho | RAM Mínima | Uso |
|--------|---------|------------|-----|
| `llama3.2` | ~2 GB | 4 GB | Geração de texto |
| `llava` | ~4.7 GB | 8 GB | Análise de imagem |
| `mistral` | ~4 GB | 8 GB | Texto (alternativa) |

---

## Instalação

### Método 1: Script Automatizado (Linux)

```bash
# No diretório raiz do projeto
cd server/scripts

# Executar script de instalação
./setup-ollama.sh
```

O script irá:
1. Instalar o Ollama
2. Baixar modelos necessários (llama3.2, llava, mistral)
3. Iniciar o servidor Ollama
4. Exibir instruções de configuração

### Método 2: Instalação Manual

#### Linux

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Iniciar servidor
ollama serve

# Em outro terminal, baixar modelos
ollama pull llama3.2    # ~2GB - Texto
ollama pull llava       # ~4.7GB - Visão
ollama pull mistral     # ~4GB - Alternativa
```

#### macOS

```bash
# Opção 1: Download direto
# Baixe em: https://ollama.com/download

# Opção 2: Homebrew
brew install ollama

# Iniciar servidor
ollama serve

# Baixar modelos
ollama pull llama3.2
ollama pull llava
ollama pull mistral
```

#### Windows

```bash
# Baixe o instalador em:
# https://ollama.com/download

# Após instalação, abra PowerShell e baixe modelos:
ollama pull llama3.2
ollama pull llava
ollama pull mistral
```

---

## Configuração

### 1. Variáveis de Ambiente

Edite `server/.env` e adicione:

```bash
# Configuração de IA
AI_PROVIDER=ollama          # 'ollama' ou 'gemini'
OLLAMA_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=llama3.2
OLLAMA_VISION_MODEL=llava
OLLAMA_TIMEOUT=30000        # 30 segundos

# Gemini (para fallback)
GEMINI_API_KEY=sua_chave_aqui   # Opcional, mas recomendado
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Modos de Operação

**Modo 1: Apenas Ollama (sem fallback)**
```bash
AI_PROVIDER=ollama
# Não configure GEMINI_API_KEY
```
→ Sistema usará apenas Ollama. Erros retornam falha direta ao frontend.

**Modo 2: Ollama com fallback para Gemini (Recomendado)**
```bash
AI_PROVIDER=ollama
GEMINI_API_KEY=sua_chave_aqui
```
→ Sistema tenta Ollama primeiro. Se falhar (conexão, timeout, erro 500), usa Gemini automaticamente.

**Modo 3: Apenas Gemini (padrão atual)**
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui
```
→ Sistema usa apenas Gemini (comportamento original).

---

## Uso e Teste

### 1. Testar Instalação

```bash
# Executar script de teste
cd server/scripts
./test-ollama.sh
```

Saída esperada:
```
✓ Servidor Ollama está rodando
✓ Modelos instalados: llama3.2, llava, mistral
✓ Geração de texto funcionando
✓ Análise de imagem funcionando
```

### 2. Iniciar Servidor Node.js

```bash
cd server
npm run dev
```

### 3. Verificar Health Check

```bash
curl http://localhost:5000/api/ai/health
```

Resposta esperada:
```json
{
  "ollama": {
    "available": true,
    "url": "http://localhost:11434",
    "models": ["llama3.2", "llava", "mistral"],
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

### 4. Testar Geração de Texto

```bash
curl -X POST http://localhost:5000/api/ai/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "prompt": "Explique TypeScript em uma frase"
  }'
```

Resposta esperada:
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

### 5. Testar Fallback Automático

```bash
# Parar servidor Ollama
pkill ollama

# Fazer requisição (deve usar Gemini como fallback)
curl -X POST http://localhost:5000/api/ai/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{"prompt": "Teste de fallback"}'
```

Resposta com fallback:
```json
{
  "text": "...",
  "provider": "gemini",
  "usedFallback": true,
  "responseTime": 890
}
```

---

## Comparação Ollama vs Gemini

| Aspecto | Ollama | Gemini |
|---------|--------|--------|
| **Custo** | Gratuito (infra própria) | Pago por token |
| **Privacidade** | Total (dados locais) | Dados vão para Google |
| **Velocidade** | Depende do hardware | Geralmente rápido |
| **Disponibilidade** | 99.9% (se infra OK) | 99.9% (SLA do Google) |
| **Qualidade** | Boa (modelos open) | Excelente (SOTA) |
| **Requisitos** | Servidor com RAM/CPU | Apenas API Key |
| **Offline** | ✅ Funciona offline | ❌ Requer internet |
| **Setup** | Mais complexo | Simples (só API key) |

### Quando usar cada um?

**Use Ollama como principal se:**
- Precisa de privacidade total
- Tem infraestrutura adequada (RAM/CPU)
- Quer evitar custos de API
- Trabalha com dados sensíveis

**Use Gemini como principal se:**
- Prioriza facilidade de setup
- Não tem hardware adequado para Ollama
- Precisa da melhor qualidade possível
- Volume de requisições justifica o custo

**Use sistema híbrido (Recomendado) se:**
- Quer melhor custo-benefício
- Precisa de alta disponibilidade
- Quer aproveitar o melhor dos dois mundos

---

## Troubleshooting

### Problema 1: "Ollama não está disponível"

**Sintomas:**
```
Error: ECONNREFUSED - Ollama não está disponível
```

**Soluções:**
```bash
# Verificar se servidor está rodando
curl http://localhost:11434/api/tags

# Se não responder, iniciar servidor
ollama serve

# Verificar porta correta no .env
OLLAMA_URL=http://localhost:11434
```

---

### Problema 2: "Modelo não encontrado"

**Sintomas:**
```
Error: Model 'llama3.2' not found
```

**Soluções:**
```bash
# Baixar modelo faltante
ollama pull llama3.2

# Verificar modelos instalados
ollama list

# Ajustar modelo no .env se necessário
OLLAMA_TEXT_MODEL=llama3.2
```

---

### Problema 3: "Out of memory"

**Sintomas:**
- Processo Ollama é morto (killed)
- Sistema fica lento/travando
- Erros de alocação de memória

**Soluções:**
```bash
# Usar modelo menor
ollama pull phi3  # Apenas 2.3GB, requer 4GB RAM

# Ajustar no .env
OLLAMA_TEXT_MODEL=phi3

# Alternativa: Aumentar RAM do servidor
# Ou usar Gemini como fallback para requisições grandes
```

---

### Problema 4: Timeout nas requisições

**Sintomas:**
```
Error: Request timeout after 30000ms
```

**Soluções:**
```bash
# Aumentar timeout no .env
OLLAMA_TIMEOUT=60000  # 60 segundos

# Verificar carga do servidor
top | grep ollama

# Habilitar GPU (se disponível)
# Ollama automaticamente usa GPU CUDA/Metal se disponível
```

---

### Problema 5: Porta 11434 já está em uso

**Sintomas:**
```
Error: Address already in use
```

**Soluções:**
```bash
# Verificar processo na porta
lsof -i :11434

# Matar processo anterior
pkill ollama

# Ou usar outra porta
ollama serve --port 11435

# Ajustar no .env
OLLAMA_URL=http://localhost:11435
```

---

### Problema 6: Modelos não são baixados

**Sintomas:**
- Comando `ollama pull` trava ou falha
- Erro de rede ou timeout

**Soluções:**
```bash
# Verificar conexão com internet
ping ollama.com

# Usar proxy se necessário
export HTTP_PROXY=http://proxy:porta
ollama pull llama3.2

# Baixar modelo manualmente e importar
# (veja documentação oficial do Ollama)
```

---

## FAQ

### 1. Posso usar Ollama em produção?

**Sim**, mas considere:
- ✅ Hardware adequado (RAM, CPU/GPU)
- ✅ Monitoramento de recursos
- ✅ Backup com fallback para Gemini
- ✅ Load balancing se alto volume

### 2. Qual a diferença de qualidade entre Ollama e Gemini?

**Gemini** geralmente tem respostas mais precisas e naturais (é um modelo proprietário SOTA). **Ollama** com llama3.2/mistral tem qualidade excelente para maioria dos casos, mas pode ser inferior em tarefas muito complexas.

### 3. Posso mudar de provider sem parar o servidor?

**Não.** É necessário:
1. Parar servidor Node.js
2. Alterar `AI_PROVIDER` no `.env`
3. Reiniciar servidor

**Dica:** Use o sistema híbrido para não precisar mudar provider frequentemente.

### 4. O cache funciona entre providers?

**Não.** Cache do Ollama é separado do cache do Gemini. Trocar de provider não aproveita cache anterior.

### 5. Posso usar outros modelos além dos padrão?

**Sim!** Veja modelos disponíveis em [ollama.com/library](https://ollama.com/library).

Exemplo com GPT4All:
```bash
ollama pull gpt4all
```

No `.env`:
```bash
OLLAMA_TEXT_MODEL=gpt4all
```

### 6. Ollama suporta streaming?

**Sim**, mas está desabilitado na implementação atual por simplicidade. Para habilitar streaming, modifique `aiService.ollama.ts` e use `stream: true` nas requisições.

### 7. Como monitorar uso de recursos do Ollama?

```bash
# CPU e memória em tempo real
top | grep ollama

# Logs detalhados
tail -f /tmp/ollama.log

# Estatísticas de uso via API
curl http://localhost:5000/api/ai/stats
```

---

## 🎯 Checklist de Setup Completo

- [ ] Instalar Ollama (`curl -fsSL https://ollama.com/install.sh | sh`)
- [ ] Baixar modelos (`ollama pull llama3.2 llava mistral`)
- [ ] Iniciar servidor (`ollama serve`)
- [ ] Configurar `.env` (AI_PROVIDER=ollama, OLLAMA_URL, etc.)
- [ ] Testar instalação (`./server/scripts/test-ollama.sh`)
- [ ] Iniciar Node.js (`cd server && npm run dev`)
- [ ] Verificar health check (`curl .../api/ai/health`)
- [ ] Testar geração de texto
- [ ] Testar análise de imagem
- [ ] Testar fallback (parar Ollama e verificar se usa Gemini)
- [ ] Monitorar logs e performance

---

## 📚 Recursos Adicionais

- **Ollama Oficial:** https://ollama.com
- **Modelos Disponíveis:** https://ollama.com/library
- **GitHub do Ollama:** https://github.com/ollama/ollama
- **Documentação API:** https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 🆘 Suporte

Se encontrar problemas não listados neste guia:

1. Verifique logs do Ollama: `/tmp/ollama.log`
2. Verifique logs do Node.js: `server/dist/server.js`
3. Consulte issues no GitHub do projeto
4. Abra uma issue descrevendo o problema

---

**Última atualização:** Novembro 2025
**Versão do Ollama:** 0.1.0+
**Versão do Mirai React:** Com suporte híbrido Ollama/Gemini
