#!/bin/bash
# Script de teste do Ollama
# Verifica se o servidor Ollama está rodando e os modelos estão disponíveis

set -e

echo "🧪 =========================================="
echo "   Teste de Instalação do Ollama"
echo "=========================================="
echo ""

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"

# Teste 1: Verificar se servidor está rodando
echo "1️⃣ Testando conexão com servidor..."
if curl -s --max-time 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "✓ Servidor Ollama está rodando em $OLLAMA_URL"
else
    echo "✗ Servidor Ollama não está rodando"
    echo ""
    echo "💡 Para iniciar o servidor:"
    echo "   ollama serve"
    exit 1
fi

echo ""

# Teste 2: Listar modelos instalados
echo "2️⃣ Verificando modelos instalados..."
MODELS=$(curl -s "$OLLAMA_URL/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$MODELS" ]; then
    echo "⚠ Nenhum modelo encontrado"
    echo ""
    echo "💡 Para instalar modelos:"
    echo "   ollama pull llama3.2"
    echo "   ollama pull llava"
else
    echo "✓ Modelos instalados:"
    echo "$MODELS" | while read -r model; do
        echo "  - $model"
    done
fi

echo ""

# Teste 3: Testar geração de texto
echo "3️⃣ Testando geração de texto (llama3.2)..."
TEXT_RESPONSE=$(curl -s --max-time 30 "$OLLAMA_URL/api/generate" -d '{
  "model": "llama3.2",
  "prompt": "Say hello in one word",
  "stream": false
}' 2>&1)

if echo "$TEXT_RESPONSE" | grep -q '"response"'; then
    RESPONSE_TEXT=$(echo "$TEXT_RESPONSE" | grep -o '"response":"[^"]*"' | cut -d'"' -f4)
    echo "✓ Geração de texto funcionando"
    echo "  Resposta: $RESPONSE_TEXT"
else
    echo "⚠ Falha ao gerar texto"
    echo "  Erro: $TEXT_RESPONSE"
    echo ""
    echo "💡 Certifique-se de que o modelo llama3.2 está instalado:"
    echo "   ollama pull llama3.2"
fi

echo ""

# Teste 4: Testar análise de imagem
echo "4️⃣ Testando análise de imagem (llava)..."
# Criar uma imagem base64 simples (1x1 pixel PNG vermelho)
TINY_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

VISION_RESPONSE=$(curl -s --max-time 30 "$OLLAMA_URL/api/generate" -d "{
  \"model\": \"llava\",
  \"prompt\": \"Describe this image briefly\",
  \"images\": [\"$TINY_IMAGE\"],
  \"stream\": false
}" 2>&1)

if echo "$VISION_RESPONSE" | grep -q '"response"'; then
    echo "✓ Análise de imagem funcionando"
    echo "  Modelo llava disponível"
else
    echo "⚠ Falha ao analisar imagem"
    echo "  Erro: $VISION_RESPONSE"
    echo ""
    echo "💡 Certifique-se de que o modelo llava está instalado:"
    echo "   ollama pull llava"
fi

echo ""
echo "=========================================="
echo "📊 Resumo dos Testes"
echo "=========================================="
echo ""

# Verificar se todos os testes passaram
TESTS_PASSED=0
TESTS_TOTAL=4

curl -s --max-time 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1 && ((TESTS_PASSED++))
[ -n "$MODELS" ] && ((TESTS_PASSED++))
echo "$TEXT_RESPONSE" | grep -q '"response"' && ((TESTS_PASSED++))
echo "$VISION_RESPONSE" | grep -q '"response"' && ((TESTS_PASSED++))

echo "✅ Testes passados: $TESTS_PASSED/$TESTS_TOTAL"
echo ""

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo "🎉 Todos os testes passaram!"
    echo ""
    echo "🚀 Ollama está pronto para uso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "  1. Configure AI_PROVIDER=ollama no server/.env"
    echo "  2. Inicie o servidor: cd server && npm run dev"
    echo "  3. Teste a API: curl http://localhost:5000/api/ai/health"
else
    echo "⚠ Alguns testes falharam. Verifique os erros acima."
    echo ""
    echo "💡 Troubleshooting:"
    echo "  - Servidor não responde: Execute 'ollama serve'"
    echo "  - Modelo não encontrado: Execute 'ollama pull <modelo>'"
    echo "  - Timeout: Aguarde alguns segundos e tente novamente"
fi

echo ""
