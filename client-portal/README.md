# Portal do Cliente - Oeste SST

Portal web dedicado para acesso de clientes da Oeste SST, onde podem visualizar propostas comerciais, documentos, certificados e acompanhar o status de serviços contratados.

## 📋 Visão Geral

O Portal do Cliente é uma aplicação React separada que roda em um domínio diferente do sistema interno (cliente.oestesst.com.br), mas compartilha o mesmo backend via API REST.

### Características

- ✅ Autenticação JWT independente para clientes
- ✅ Dashboard com resumo de atividades
- ✅ Visualização de propostas comerciais
- ✅ Download de documentos e certificados
- ✅ Perfil editável do usuário cliente
- ✅ Design responsivo com tema claro/escuro
- ✅ Isolamento de dados por empresa

## 🚀 Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Backend Mirai rodando na porta 5000
- Banco de dados MySQL com tabelas criadas

### Instalação de Dependências

```bash
cd client-portal
npm install
```

### Variáveis de Ambiente

Não há arquivo `.env` específico no client-portal. As configurações de proxy estão em `vite.config.ts`:

- Dev server: `http://localhost:5174`
- Proxy API: `http://localhost:5000/api`
- Proxy uploads: `http://localhost:5000/uploads`

### Executar em Desenvolvimento

```bash
# Terminal 1: Backend (da raiz do projeto)
cd server
npm run dev

# Terminal 2: Client Portal
cd client-portal
npm run dev
```

Acesse: `http://localhost:5174`

### Build para Produção

```bash
cd client-portal
npm run build
```

Os arquivos serão gerados em `client-portal/dist/`

## 📁 Estrutura de Pastas

```
client-portal/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── ui/         # Componentes UI base (shadcn/ui)
│   │   └── Layout.tsx  # Layout principal com header/nav
│   ├── contexts/       # Contexts do React
│   │   └── ClientAuthContext.tsx  # Autenticação do cliente
│   ├── lib/            # Utilitários
│   │   └── utils.ts    # Funções auxiliares (cn, formatters)
│   ├── pages/          # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Proposals.tsx
│   │   ├── ProposalDetail.tsx
│   │   ├── Documents.tsx
│   │   └── Profile.tsx
│   ├── App.tsx         # Configuração de rotas
│   ├── main.tsx        # Entry point
│   └── index.css       # Estilos globais + Tailwind
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔐 Autenticação

### Fluxo de Login

1. Cliente acessa `/login`
2. Insere email e senha
3. `POST /api/client-portal/login` retorna token JWT + dados do usuário
4. Token armazenado em `localStorage` (`client_token`)
5. Requisições subsequentes incluem header `Authorization: Bearer <token>`

### Estrutura do Token JWT

```json
{
  "id": 1,
  "email": "cliente@empresa.com",
  "empresa_id": 5,
  "type": "client",
  "exp": 1234567890
}
```

**Importante:** O campo `type: "client"` diferencia tokens de clientes dos tokens de usuários internos.

### Proteção de Rotas

O componente `<ProtectedRoute>` em `App.tsx` verifica se o usuário está autenticado antes de renderizar páginas protegidas.

## 📡 Endpoints da API

### Autenticação

#### `POST /api/client-portal/login`
Login de cliente

**Request:**
```json
{
  "email": "cliente@empresa.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "empresa_id": 5,
    "empresa_nome": "Empresa LTDA",
    "empresa_cnpj": "12.345.678/0001-90",
    "email": "cliente@empresa.com",
    "nome": "João Silva",
    "telefone": "(11) 98765-4321"
  }
}
```

#### `GET /api/client-portal/me`
Obter dados do usuário atual

**Headers:** `Authorization: Bearer <token>`

**Response:** (mesmo objeto `user` do login)

### Propostas

#### `GET /api/client-portal/proposals`
Lista todas as propostas da empresa do cliente

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 10,
    "titulo": "Proposta Comercial - SST Básico",
    "descricao": "Serviços básicos de SST",
    "status": "aprovada",
    "valor_total": 5500.00,
    "data_criacao": "2025-01-15 10:30:00",
    "data_atualizacao": "2025-01-15 14:20:00"
  }
]
```

#### `GET /api/client-portal/proposals/:id`
Detalhes de uma proposta específica

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 10,
  "titulo": "Proposta Comercial - SST Básico",
  "descricao": "...",
  "status": "aprovada",
  "valor_total": 5500.00,
  "data_criacao": "2025-01-15 10:30:00",
  "empresa_nome": "Empresa LTDA",
  "itens": [
    {
      "id": 1,
      "descricao": "PCMSO - Programa de Controle Médico",
      "quantidade": 1,
      "valor_unitario": 2000.00,
      "valor_total": 2000.00
    }
  ]
}
```

### Documentos

#### `GET /api/client-portal/documents`
Lista todos os documentos da empresa

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 5,
    "nome": "PCMSO - Programa.pdf",
    "tipo": "PDF",
    "tamanho": "2.5 MB",
    "categoria": "Programas",
    "data_upload": "2025-01-15 08:00:00",
    "arquivo_path": "/uploads/documents/..."
  }
]
```

#### `GET /api/client-portal/documents/:id/download`
Download de um documento específico

**Headers:** `Authorization: Bearer <token>`

**Response:** Arquivo binário (PDF, DOCX, etc.)

## 🗄️ Banco de Dados

### Tabelas Necessárias

Execute o script SQL em `server/migrations/create_client_portal_tables.sql` para criar:

#### `client_users`
Armazena usuários do portal do cliente

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Primary key |
| empresa_id | INT | Foreign key → empresas.id |
| email | VARCHAR(255) | E-mail único para login |
| password_hash | VARCHAR(255) | Hash bcrypt da senha |
| nome | VARCHAR(255) | Nome completo do usuário |
| telefone | VARCHAR(20) | Telefone de contato |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |
| last_login | TIMESTAMP | Último acesso |

#### `documentos_cliente`
Armazena documentos disponíveis para clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Primary key |
| empresa_id | INT | Foreign key → empresas.id |
| nome | VARCHAR(255) | Nome do arquivo |
| tipo | VARCHAR(50) | Extensão (PDF, DOCX, etc.) |
| tamanho | VARCHAR(50) | Tamanho formatado |
| categoria | VARCHAR(100) | Categoria do documento |
| arquivo_path | VARCHAR(500) | Caminho físico do arquivo |
| data_upload | TIMESTAMP | Data de upload |
| uploaded_by | INT | Usuário interno que fez upload |

### Criar Usuário Cliente de Teste

```sql
-- Gerar hash bcrypt para senha "cliente123"
-- Usar: https://bcrypt-generator.com/ com 10 rounds

INSERT INTO client_users (empresa_id, email, password_hash, nome, telefone)
VALUES (
  1, -- ID da empresa
  'teste@empresa.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGa1lfX6H6HNVR9eK6', -- cliente123
  'Usuário Teste',
  '(11) 98765-4321'
);
```

## 🎨 Design System

### Componentes UI

Baseado em **shadcn/ui** com Radix UI primitives:

- `Button` - Botões com variantes
- `Card` - Container de conteúdo
- `Input` - Campos de formulário
- `Label` - Labels para inputs

### Cores (Tailwind + CSS Variables)

Tema azul com suporte a dark mode:

- **Primary:** `hsl(221.2 83.2% 53.3%)` (azul)
- **Secundary:** Gradientes azul/roxo
- **Sucesso:** Verde
- **Erro:** Vermelho
- **Warning:** Laranja

### Ícones

**Tabler Icons** (`@tabler/icons-react`)

Exemplos: `IconFileText`, `IconFiles`, `IconUser`, `IconLogout`, `IconClock`

## 🚀 Deploy em Produção

### 1. Build do Client Portal

```bash
cd client-portal
npm run build
```

### 2. Configurar Domínio

No Nginx, adicione configuração para `cliente.oestesst.com.br`:

```nginx
server {
    listen 80;
    server_name cliente.oestesst.com.br;

    root /var/www/mirai/client-portal/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy para uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

### 3. SSL/HTTPS com Certbot

```bash
sudo certbot --nginx -d cliente.oestesst.com.br
```

### 4. Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

## 🔧 Desenvolvimento

### Adicionar Nova Página

1. Criar arquivo em `src/pages/NovaPage.tsx`
2. Adicionar rota em `App.tsx`:
```tsx
<Route
  path="/nova-rota"
  element={
    <ProtectedRoute>
      <NovaPage />
    </ProtectedRoute>
  }
/>
```
3. Adicionar item de menu em `Layout.tsx` (menuItems array)

### Adicionar Novo Endpoint

1. Criar função em `server/controllers/ClientPortalController.ts`
2. Adicionar rota em `server/routes/client-portal.ts`
3. Testar com Postman/Insomnia incluindo header `Authorization`

### Formatação de Dados

Utilitários disponíveis em `src/lib/utils.ts`:

```tsx
import { formatCNPJ, formatCurrency, formatDate } from '@/lib/utils'

formatCNPJ('12345678000190')        // "12.345.678/0001-90"
formatCurrency(5500)                 // "R$ 5.500,00"
formatDate(new Date())               // "15/01/2025"
```

## 🐛 Troubleshooting

### Erro 401 - Token inválido

- Verificar se token está sendo enviado no header `Authorization: Bearer <token>`
- Verificar se token não expirou (validade: 7 dias)
- Limpar localStorage e fazer login novamente

### Erro 403 - Acesso negado

- Verificar se campo `type: "client"` está presente no token JWT
- Usuários internos não podem acessar endpoints de cliente

### Propostas/Documentos vazios

- Verificar se `empresa_id` está correto na tabela `client_users`
- Verificar se existem registros nas tabelas vinculados ao `empresa_id`
- Checar logs do backend para erros SQL

### Proxy não funciona em dev

- Confirmar que backend está rodando em `localhost:5000`
- Verificar configuração em `vite.config.ts`
- Reiniciar dev server do Vite

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do backend: `server/` terminal
2. Verificar console do navegador (F12)
3. Consultar documentação principal em `docs/INDEX.md`

---

**Desenvolvido por:** Equipe Mirai/Oeste SST  
**Última atualização:** Janeiro 2025
