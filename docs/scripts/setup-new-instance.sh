#!/bin/bash

# ============================================
# Script de Setup Completo - Nova Instância
# ============================================
# Uso: bash setup-new-instance.sh
# 
# Este script:
# 1. Instala todas as dependências
# 2. Configura MySQL
# 3. Cria banco de dados
# 4. Configura Node.js e PM2
# 5. Instala e configura Nginx
# 6. Prepara ambiente para deploy
# ============================================

set -e  # Para na primeira falha

echo "🚀 Iniciando setup da nova instância..."
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. ATUALIZAR SISTEMA
# ============================================
echo -e "${GREEN}[1/8] Atualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# ============================================
# 2. INSTALAR NODE.JS
# ============================================
echo ""
echo -e "${GREEN}[2/8] Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js versão: $(node --version)"
echo "NPM versão: $(npm --version)"

# ============================================
# 3. INSTALAR MYSQL
# ============================================
echo ""
echo -e "${GREEN}[3/8] Instalando MySQL Server...${NC}"
sudo apt install -y mysql-server

# Iniciar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

echo -e "${YELLOW}MySQL instalado. Você precisará configurar a senha root.${NC}"

# ============================================
# 4. INSTALAR PM2 (Process Manager)
# ============================================
echo ""
echo -e "${GREEN}[4/8] Instalando PM2...${NC}"
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
sudo pm2 startup systemd -u $USER --hp /home/$USER
sudo systemctl enable pm2-$USER

# ============================================
# 5. INSTALAR NGINX
# ============================================
echo ""
echo -e "${GREEN}[5/8] Instalando Nginx...${NC}"
sudo apt install -y nginx

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ============================================
# 6. INSTALAR FERRAMENTAS ÚTEIS
# ============================================
echo ""
echo -e "${GREEN}[6/8] Instalando ferramentas úteis...${NC}"
sudo apt install -y git curl wget unzip htop

# ============================================
# 7. CONFIGURAR FIREWALL
# ============================================
echo ""
echo -e "${GREEN}[7/8] Configurando firewall...${NC}"
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# ============================================
# 8. CRIAR ESTRUTURA DE PASTAS
# ============================================
echo ""
echo -e "${GREEN}[8/8] Criando estrutura de pastas...${NC}"
sudo mkdir -p /var/www/mirai/frontend
sudo mkdir -p /var/www/mirai/backend
sudo mkdir -p /home/$USER/backups
sudo chown -R $USER:$USER /var/www/mirai
sudo chown -R $USER:$USER /home/$USER/backups

# ============================================
# RESUMO
# ============================================
echo ""
echo "========================================"
echo -e "${GREEN}✅ Setup básico concluído!${NC}"
echo "========================================"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configurar MySQL:"
echo "   sudo mysql_secure_installation"
echo ""
echo "2. Criar banco de dados:"
echo "   bash setup-mysql-database.sh"
echo ""
echo "3. Fazer deploy da aplicação:"
echo "   bash deploy-application.sh"
echo ""
echo "4. Configurar Nginx:"
echo "   bash setup-nginx-config.sh"
echo ""
echo "========================================"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "- Anote a senha root do MySQL que você criar"
echo "- Configure as variáveis de ambiente (.env)"
echo "- Aponte o DNS para o IP desta instância"
echo ""
