#!/bin/bash

# ============================================
# Script de Configuração do Nginx
# ============================================
# Uso: bash setup-nginx-config.sh
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🌐 Configuração do Nginx"
echo "========================================"
echo ""

# ============================================
# VARIÁVEIS
# ============================================
read -p "Digite seu domínio (ex: mirai.com.br): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domínio é obrigatório${NC}"
    exit 1
fi

echo ""
echo "Configurando para: $DOMAIN"
echo ""

# ============================================
# CRIAR CONFIGURAÇÃO NGINX
# ============================================
echo -e "${GREEN}Criando configuração do Nginx...${NC}"

sudo tee /etc/nginx/sites-available/mirai > /dev/null <<NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (React build)
    root /var/www/mirai/frontend;
    index index.html;

    # Logs
    access_log /var/log/nginx/mirai_access.log;
    error_log /var/log/nginx/mirai_error.log;

    # Frontend - SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API - Proxy para Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        alias /var/www/mirai/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
NGINX_EOF

# ============================================
# ATIVAR CONFIGURAÇÃO
# ============================================
echo ""
echo -e "${GREEN}Ativando configuração...${NC}"

# Remover default
sudo rm -f /etc/nginx/sites-enabled/default

# Criar link simbólico
sudo ln -sf /etc/nginx/sites-available/mirai /etc/nginx/sites-enabled/

# Testar configuração
echo ""
echo "Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida"
    
    # Recarregar Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado"
else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    exit 1
fi

# ============================================
# CONFIGURAR SSL (CERTBOT)
# ============================================
echo ""
echo -e "${YELLOW}Deseja configurar SSL (HTTPS) agora? (s/n)${NC}"
read -p "> " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${GREEN}Instalando Certbot...${NC}"
    
    sudo apt install -y certbot python3-certbot-nginx
    
    echo ""
    echo -e "${GREEN}Obtendo certificado SSL...${NC}"
    echo -e "${YELLOW}Certifique-se de que o DNS está apontado para este servidor!${NC}"
    echo ""
    
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SSL configurado com sucesso!"
        echo "   Renovação automática está ativa"
    else
        echo ""
        echo -e "${RED}❌ Erro ao configurar SSL${NC}"
        echo "   Verifique se o DNS está correto e tente novamente:"
        echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
else
    echo ""
    echo -e "${YELLOW}SSL não configurado.${NC}"
    echo "   Para configurar depois:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# ============================================
# RESUMO
# ============================================
echo ""
echo "========================================"
echo -e "${GREEN}✅ Nginx configurado!${NC}"
echo "========================================"
echo ""
echo "🌐 Domínio: $DOMAIN"
echo "📁 Frontend: /var/www/mirai/frontend"
echo "⚙️  Backend: http://localhost:5000"
echo ""
echo "📊 Comandos úteis:"
echo "   sudo systemctl status nginx    - Ver status"
echo "   sudo systemctl reload nginx    - Recarregar"
echo "   sudo nginx -t                  - Testar config"
echo "   sudo tail -f /var/log/nginx/mirai_access.log"
echo ""
echo "🔐 SSL:"
echo "   sudo certbot renew --dry-run   - Testar renovação"
echo "   sudo certbot certificates      - Ver certificados"
echo ""
echo "✅ Acesse: http://$DOMAIN"
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "✅ HTTPS: https://$DOMAIN"
fi
echo ""
