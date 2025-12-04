#!/bin/bash

# ============================================
# Script de Configuração do MySQL
# ============================================
# Uso: bash setup-mysql-database.sh
# 
# Este script:
# 1. Configura o MySQL com senha segura
# 2. Cria o banco de dados
# 3. Cria usuário da aplicação
# 4. Configura permissões
# 5. Importa schema (se existir)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🗄️  Configuração do MySQL"
echo "========================================"
echo ""

# ============================================
# 1. VARIÁVEIS (CUSTOMIZE AQUI)
# ============================================
DB_NAME="mirai_db"
DB_USER="mirai_user"
DB_PASSWORD="123Mirai@321"  # ⚠️ MUDE ISSO!
ROOT_PASSWORD="123Mirai@321!" # ⚠️ MUDE ISSO!

echo -e "${YELLOW}⚠️  Configurações atuais:${NC}"
echo "   Database: $DB_NAME"
echo "   Usuário: $DB_USER"
echo "   Senha: [oculta]"
echo ""
read -p "Deseja continuar com estas configurações? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Abortado. Edite o script para mudar as configurações."
    exit 1
fi

# ============================================
# 2. CONFIGURAR SENHA ROOT
# ============================================
echo ""
echo -e "${GREEN}[1/5] Configurando senha root do MySQL...${NC}"

# Configurar senha root
sudo mysql <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$ROOT_PASSWORD';
FLUSH PRIVILEGES;
EOF

echo "✅ Senha root configurada"

# ============================================
# 3. CRIAR BANCO DE DADOS
# ============================================
echo ""
echo -e "${GREEN}[2/5] Criando banco de dados...${NC}"

mysql -u root -p"$ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
EOF

echo "✅ Banco de dados '$DB_NAME' criado"

# ============================================
# 4. CRIAR USUÁRIO DA APLICAÇÃO
# ============================================
echo ""
echo -e "${GREEN}[3/5] Criando usuário da aplicação...${NC}"

mysql -u root -p"$ROOT_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Usuário '$DB_USER' criado com permissões"

# ============================================
# 5. TESTAR CONEXÃO
# ============================================
echo ""
echo -e "${GREEN}[4/5] Testando conexão...${NC}"

mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 'Conexão OK!' as status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Conexão com banco de dados funcionando!"
else
    echo -e "${RED}❌ Erro ao conectar no banco de dados${NC}"
    exit 1
fi

# ============================================
# 7. CONFIGURAR BACKUP AUTOMÁTICO
# ============================================
echo ""
echo -e "${GREEN}Configurando backup automático...${NC}"

# Criar script de backup
cat > /home/$USER/backup-mysql.sh <<'BACKUP_EOF'
#!/bin/bash
DB_NAME="mirai_db"
DB_USER="mirai_user"
DB_PASS="123Mirai@321"  # ⚠️ USE A MESMA SENHA
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/mirai_$DATE.sql.gz
find $BACKUP_DIR -name "mirai_*.sql.gz" -mtime +7 -delete
echo "Backup concluído: mirai_$DATE.sql.gz"
BACKUP_EOF

# Substituir senha no script
sed -i "s/SuaSenhaForteAqui123!/$DB_PASSWORD/g" /home/$USER/backup-mysql.sh

chmod +x /home/$USER/backup-mysql.sh

# Agendar backup diário às 3h da manhã
(crontab -l 2>/dev/null; echo "0 3 * * * /home/$USER/backup-mysql.sh >> /var/log/backup-mysql.log 2>&1") | crontab -

echo "✅ Backup automático configurado (diariamente às 3h)"

# ============================================
# 8. CRIAR ARQUIVO .ENV
# ============================================
echo ""
echo -e "${GREEN}Criando arquivo .env de exemplo...${NC}"

cat > /home/$USER/mirai-backend.env <<ENV_EOF
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=$DB_USER
MYSQL_PASSWORD=$DB_PASSWORD
MYSQL_DATABASE=$DB_NAME

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend Configuration
SERVE_FRONT=true
FRONT_DIST_PATH=../dist

# Optional: Gemini API
# GEMINI_API_KEY=sua_chave_aqui
ENV_EOF

chmod 600 /home/$USER/mirai-backend.env

echo "✅ Arquivo .env criado em: /home/$USER/mirai-backend.env"

# ============================================
# RESUMO
# ============================================
echo ""
echo "========================================"
echo -e "${GREEN}✅ MySQL configurado com sucesso!${NC}"
echo "========================================"
echo ""
echo "📋 Informações importantes:"
echo ""
echo "   Database: $DB_NAME"
echo "   Usuário: $DB_USER"
echo "   Host: localhost"
echo "   Porta: 3306"
echo ""
echo "📁 Arquivos criados:"
echo "   - /home/$USER/backup-mysql.sh (script de backup)"
echo "   - /home/$USER/mirai-backend.env (variáveis de ambiente)"
echo ""
echo "🔐 Conexão:"
echo "   mysql -u $DB_USER -p $DB_NAME"
echo ""
echo "💾 Backup manual:"
echo "   /home/$USER/backup-mysql.sh"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Anote estas credenciais em local seguro"
echo "   - Use o arquivo .env no servidor backend"
echo "   - Backups automáticos às 3h da manhã"
echo ""
echo "🚀 Próximo passo:"
echo "   bash deploy-application.sh"
echo ""
