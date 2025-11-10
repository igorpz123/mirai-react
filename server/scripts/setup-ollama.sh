#!/bin/bash
# Script de instalação e configuração do Ollama
# Este script instala o Ollama e baixa os modelos necessários para o sistema Mirai React

set -e  # Parar em caso de erro

echo "🤖 =========================================="
echo "   Instalação do Ollama para Mirai React"
echo "=========================================="
echo ""

# Detectar sistema operacional
OS="$(uname -s)"
echo "📋 Sistema operacional detectado: $OS"
echo ""

# Instalar Ollama
if command -v ollama &> /dev/null; then
    echo "✓ Ollama já está instalado"
    ollama --version
else
    echo "📦 Instalando Ollama..."
    
    if [[ "$OS" == "Linux" ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OS" == "Darwin" ]]; then
        echo "No macOS, baixe o instalador em: https://ollama.com/download"
        echo "Ou instale via Homebrew: brew install ollama"
        exit 1
    else
        echo "Sistema operacional não suportado. Visite: https://ollama.com/download"
        exit 1
    fi
    
    echo "✓ Ollama instalado com sucesso!"
fi

echo ""
echo "=========================================="
echo "📥 Baixando modelos necessários..."
echo "=========================================="
echo ""

# Baixar modelo de texto (llama3.2 - ~2GB)
echo "1/3 Baixando llama3.2 (modelo de texto)..."
echo "   Tamanho: ~2GB"
ollama pull llama3.2
echo "✓ llama3.2 baixado!"
echo ""

# Baixar modelo de visão (llava - ~4.7GB)
echo "2/3 Baixando llava (modelo de visão)..."
echo "   Tamanho: ~4.7GB"
ollama pull llava
echo "✓ llava baixado!"
echo ""

# Baixar modelo alternativo (mistral - ~4GB)
echo "3/3 Baixando mistral (modelo alternativo)..."
echo "   Tamanho: ~4GB"
ollama pull mistral
echo "✓ mistral baixado!"
echo ""

# Iniciar servidor Ollama (se não estiver rodando)
echo "=========================================="
echo "🚀 Iniciando servidor Ollama..."
echo "=========================================="
echo ""

if pgrep -x "ollama" > /dev/null; then
    echo "✓ Servidor Ollama já está rodando"
else
    echo "Iniciando servidor em background..."
    ollama serve > /tmp/ollama.log 2>&1 &
    
    # Aguardar servidor iniciar
    sleep 3
    
    if pgrep -x "ollama" > /dev/null; then
        echo "✓ Servidor Ollama iniciado com sucesso!"
        echo "   Logs em: /tmp/ollama.log"
    else
        echo "⚠ Falha ao iniciar servidor automaticamente"
        echo "   Execute manualmente: ollama serve"
    fi
fi

echo ""
echo "=========================================="
echo "✅ Instalação concluída!"
echo "=========================================="
echo ""
echo "🎯 Próximos passos:"
echo ""
echo "1. Configure as variáveis de ambiente no server/.env:"
echo "   AI_PROVIDER=ollama"
echo "   OLLAMA_URL=http://localhost:11434"
echo "   OLLAMA_TEXT_MODEL=llama3.2"
echo "   OLLAMA_VISION_MODEL=llava"
echo ""
echo "2. Teste a instalação:"
echo "   ./server/scripts/test-ollama.sh"
echo ""
echo "3. Inicie seu servidor Node.js:"
echo "   cd server && npm run dev"
echo ""
echo "4. Verifique o health check:"
echo "   curl http://localhost:5000/api/ai/health"
echo ""
echo "📚 Documentação completa em: docs/ai/OLLAMA_SETUP.md"
echo ""
echo "🌐 Servidor Ollama rodando em: http://localhost:11434"
echo "   Para parar: pkill ollama"
echo ""
