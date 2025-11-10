# Client Portal - Quick Start

## 🚀 Início Rápido (5 minutos)

### 1. Instalar Dependências
```bash
cd client-portal
npm install
```

### 2. Configurar Banco de Dados
```bash
# Execute o SQL migration
mysql -u root -p nome_do_banco < ../server/migrations/create_client_portal_tables.sql
```

### 3. Criar Usuário de Teste
```bash
# Opção A: Script interativo
cd ../server
node create-client-user.js

# Opção B: SQL manual
# Senha: "cliente123"
INSERT INTO client_users (empresa_id, email, password_hash, nome, telefone)
VALUES (
  1,
  'teste@cliente.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGa1lfX6H6HNVR9eK6',
  'Cliente Teste',
  '(11) 98765-4321'
);
```

### 4. Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client Portal:**
```bash
cd client-portal
npm run dev
```

### 5. Acessar Portal
- URL: http://localhost:5174
- Email: `teste@cliente.com`
- Senha: `cliente123`

## ✅ Verificação

Após login, você deve ver:
- ✅ Dashboard com cards de estatísticas
- ✅ Menu de navegação (Dashboard, Propostas, Documentos, Perfil)
- ✅ Informações da empresa no header
- ✅ Botão de logout funcionando

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
```bash
cd client-portal
npm install
```

### Erro: "ECONNREFUSED localhost:5000"
Backend não está rodando. Inicie com:
```bash
cd server
npm run dev
```

### Erro 401: "Token não fornecido"
Faça login novamente. O token pode ter expirado.

### Página em branco
Verifique o console do navegador (F12) para erros JavaScript.

## 📖 Documentação Completa
Ver `README.md` na raiz do client-portal/

## 🎯 Próximos Passos
1. Criar usuários reais para seus clientes
2. Vincular propostas às empresas
3. Upload de documentos
4. Deploy em produção (ver README.md)
