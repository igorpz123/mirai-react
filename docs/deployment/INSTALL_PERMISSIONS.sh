#!/bin/bash

echo "🔐 Instalação do Sistema de Permissões - Mirai React"
echo "===================================================="
echo ""

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se migration existe
if [ ! -f "server/migrations/create_permissions_system.sql" ]; then
    echo "❌ Erro: Arquivo de migration não encontrado"
    exit 1
fi

echo "📋 Pré-requisitos:"
echo "  ✓ MySQL instalado e rodando"
echo "  ✓ Banco de dados criado"
echo "  ✓ Credenciais corretas no server/.env"
echo ""

# Solicitar credenciais do banco
read -p "Nome do banco de dados: " DB_NAME
read -p "Usuário do MySQL: " DB_USER
read -sp "Senha do MySQL: " DB_PASS
echo ""
echo ""

echo "🗄️  Executando migration no banco de dados..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < server/migrations/create_permissions_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration executada com sucesso!"
else
    echo "❌ Erro ao executar migration"
    exit 1
fi

echo ""
echo "🔍 Verificando instalação..."
PERM_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM permissoes;")
CARGO_PERM_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM cargo_permissoes;")

echo "  ✓ Permissões criadas: $PERM_COUNT"
echo "  ✓ Mapeamentos cargo-permissão: $CARGO_PERM_COUNT"

echo ""
echo "📊 Visualizando cargos com permissões:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT * FROM vw_cargo_permissoes;"

echo ""
echo "✅ Instalação concluída com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "  1. Reinicie o servidor: cd server && npm run dev"
echo "  2. Faça login novamente no frontend"
echo "  3. Acesse /admin/permissoes para gerenciar permissões"
echo ""
echo "📚 Documentação completa: docs/PERMISSIONS_SYSTEM.md"
echo "📋 Resumo de implementação: docs/PERMISSIONS_IMPLEMENTATION_SUMMARY.md"

