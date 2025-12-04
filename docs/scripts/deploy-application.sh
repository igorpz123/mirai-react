#!/bin/bash

# ============================================
# Script de Deploy da Aplicação
# ============================================
# Uso: bash deploy-application.sh
# 
# Este script:
# 1. Para a aplicação anterior (se existir)
# 2. Instala dependências
# 3. Builda frontend e backend
# 4. Inicia aplicação com PM2
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Deploy da Aplicação Mirai"
echo "========================================"
echo ""

# ============================================
# 1. VARIÁVEIS
# ============================================
FRONTEND_PATH="/var/www/mirai/frontend"
BACKEND_PATH="/var/www/mirai/backend"
REPO_URL="https://github.com/igorpz123/mirai-react.git"  # ⚠️ AJUSTE AQUI
BRANCH="main"

# ============================================
# 2. CLONAR/ATUALIZAR REPOSITÓRIO
# ============================================
echo -e "${GREEN}[1/6] Obtendo código do repositório...${NC}"

if [ -d "/home/$USER/mirai" ]; then
    echo "Repositório já existe, atualizando..."
    cd /home/$USER/mirai
    git pull origin $BRANCH
else
    echo "Clonando repositório..."
    cd /home/$USER
    git clone $REPO_URL mirai
    cd mirai
    git checkout $BRANCH
fi

echo "✅ Código atualizado"

# ============================================
# 3. INSTALAR DEPENDÊNCIAS DO BACKEND
# ============================================
echo ""
echo -e "${GREEN}[2/6] Instalando dependências do backend...${NC}"

cd /home/$USER/mirai/server

# Instalar TODAS as dependências (incluindo devDependencies para build)
npm install

echo "✅ Dependências do backend instaladas"

# ============================================
# 4. BUILDAR BACKEND
# ============================================
echo ""
echo -e "${GREEN}[3/6] Buildando backend...${NC}"

cd /home/$USER/mirai/server

# Verificar se TypeScript está instalado
if ! command -v tsc &> /dev/null && ! npx tsc --version &> /dev/null; then
    echo -e "${YELLOW}TypeScript não encontrado, instalando...${NC}"
    npm install --save-dev typescript @types/node
fi

npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao buildar backend${NC}"
    echo "Tentando instalar TypeScript globalmente..."
    sudo npm install -g typescript
    npm run build
fi

echo "✅ Backend buildado"

# ============================================
# 5. INSTALAR E BUILDAR FRONTEND
# ============================================
echo ""
echo -e "${GREEN}[4/6] Buildando frontend...${NC}"

cd /home/$USER/mirai
npm install
npm run build

echo "✅ Frontend buildado"

# ============================================
# 6. COPIAR ARQUIVOS PARA DESTINO
# ============================================
echo ""
echo -e "${GREEN}[5/6] Copiando arquivos...${NC}"

# Backend
sudo rm -rf $BACKEND_PATH/*
sudo cp -r /home/$USER/mirai/server/dist/* $BACKEND_PATH/
sudo cp -r /home/$USER/mirai/server/node_modules $BACKEND_PATH/
sudo cp /home/$USER/mirai/server/package.json $BACKEND_PATH/
sudo cp /home/$USER/mirai-backend.env $BACKEND_PATH/.env

# Frontend
sudo rm -rf $FRONTEND_PATH/*
sudo cp -r /home/$USER/mirai/dist/* $FRONTEND_PATH/

# Ajustar permissões
sudo chown -R $USER:$USER $BACKEND_PATH
sudo chown -R www-data:www-data $FRONTEND_PATH

echo "✅ Arquivos copiados"

# ============================================
# 7. INICIAR APLICAÇÃO COM PM2
# ============================================
echo ""
echo -e "${GREEN}[6/6] Iniciando aplicação...${NC}"

# Parar se já estiver rodando
pm2 stop mirai-backend 2>/dev/null || true
pm2 delete mirai-backend 2>/dev/null || true

# Iniciar
cd $BACKEND_PATH
pm2 start server.js --name mirai-backend --env production

# Salvar configuração PM2
pm2 save

echo "✅ Aplicação iniciada"

# ============================================
# 8. VERIFICAR STATUS
# ============================================
echo ""
echo -e "${GREEN}Verificando status...${NC}"

sleep 3
pm2 status
pm2 logs mirai-backend --lines 10 --nostream

# ============================================
# RESUMO
# ============================================
echo ""
echo "========================================"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo "========================================"
echo ""
echo "📋 Informações:"
echo "   Frontend: $FRONTEND_PATH"
echo "   Backend: $BACKEND_PATH"
echo "   Process: mirai-backend"
echo ""
echo "📊 Comandos úteis:"
echo "   pm2 status              - Ver status"
echo "   pm2 logs mirai-backend  - Ver logs"
echo "   pm2 restart mirai-backend - Reiniciar"
echo "   pm2 stop mirai-backend  - Parar"
echo ""
echo "🚀 Próximo passo:"
echo "   bash setup-nginx-config.sh"
echo ""
