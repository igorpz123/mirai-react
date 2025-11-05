# 🛠️ Guia de Desenvolvimento - Mirai React

Guia completo para desenvolvedores trabalhando no projeto Mirai React.

---

## 🏗️ Arquitetura do Projeto

### Stack Tecnológica
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI
- **Backend:** Node.js + Express + TypeScript
- **Banco de Dados:** MySQL com `mysql2/promise`
- **Realtime:** Socket.IO para presença e notificações
- **IA:** Google Gemini API (generação de texto e análise de imagens)
- **Auth:** JWT com verificação de tokens
- **Upload:** Multer para arquivos (tarefas, propostas, perfis)

### Estrutura de Pastas

```
mirai-react/
├── src/                        # Frontend React
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Shadcn/Radix UI components
│   │   ├── auth/             # Proteção de rotas
│   │   ├── help/             # Sistema de ajuda
│   │   └── layout/           # Layout e header
│   ├── contexts/             # Contextos React (Auth, Realtime, etc)
│   ├── pages/                # Páginas da aplicação
│   ├── services/             # Chamadas à API
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilitários frontend
│   └── data/                 # Dados estáticos (help content)
│
├── server/                     # Backend Express
│   ├── config/               # DB e auth config
│   ├── controllers/          # Request handlers
│   ├── services/             # Lógica de negócio
│   ├── middleware/           # Auth, permissions, upload
│   ├── routes/               # Definição de rotas
│   ├── migrations/           # SQL migrations
│   ├── utils/                # Utilitários backend
│   ├── uploads/              # Arquivos enviados
│   └── server.ts             # Ponto de entrada
│
├── docs/                       # Documentação
├── scripts/                    # Scripts de deploy (PowerShell)
└── config/                     # .env.example e components.json
```

---

## 🔧 Setup do Ambiente

### Pré-requisitos
- Node.js 18+ e npm
- MySQL 8.0+
- Git

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd mirai-react

# Instale dependências (root + server)
npm run install:all

# Configure variáveis de ambiente
cp config/.env.example server/.env
# Edite server/.env com suas credenciais

# Execute migrations do banco
mysql -u root -p < server/migrations/create_permissions_system.sql
mysql -u root -p < server/migrations/create_agenda_users_config.sql
mysql -u root -p < server/migrations/add_performance_indexes.sql
```

### Desenvolvimento

```powershell
# Terminal 1 - Frontend (Vite dev server)
npm run dev
# Roda em http://localhost:5173
# Proxy de /api e /uploads → localhost:5000

# Terminal 2 - Backend (ts-node-dev com live reload)
cd server
npm run dev
# Roda em http://localhost:5000
```

### Build de Produção

```bash
# Build completo (frontend + backend)
npm run build:full

# Apenas frontend
npm run build

# Apenas backend
npm run build:server
```

### Executar em Produção

```bash
# Backend serve frontend compilado
cd server
SERVE_FRONT=true FRONT_DIST_PATH=../dist npm start
```

---

## 📝 Convenções de Código

### TypeScript
- **Strict mode** habilitado
- **Sem `any`** - sempre tipar explicitamente
- **Interfaces** para objetos complexos
- **Types** para unions e primitivos

### Backend
- **Async/await** para todas operações assíncronas
- **Try/catch** em todos os controllers com `handleControllerError`
- **Validação** de entrada com `validateRequiredFields`
- **Snake_case** para colunas do banco
- **CamelCase** para JavaScript/TypeScript

### Frontend
- **Hooks** para lógica reutilizável
- **Contexts** para estado global (Auth, Realtime, etc)
- **CamelCase** para tudo
- **Path alias** `@/` mapeado para `src/`
- **Componentes** em PascalCase

### SQL
- **Prepared statements** sempre (proteção contra SQL injection)
- **`dateStrings: true`** no pool MySQL para evitar problemas de timezone
- **Transactions** para operações múltiplas relacionadas

---

## 🔨 Padrões de Refatoração

### Backend - CRUD Controller Factory

Para entidades simples com apenas `id` e `nome`:

```typescript
// Antes (91 linhas)
export const getSetores = async (req: Request, res: Response): Promise<void> => { ... }
export const getSetorById = async (req: Request, res: Response): Promise<void> => { ... }
export const createSetor = async (req: Request, res: Response): Promise<void> => { ... }
export const updateSetor = async (req: Request, res: Response): Promise<void> => { ... }
export const deleteSetor = async (req: Request, res: Response): Promise<void> => { ... }

// Depois (8 linhas - redução de 91%)
import { createCrudController } from '../utils/crudController'

const crudController = createCrudController(pool, {
  tableName: 'setor',
  entityName: 'setor',
  entityNamePlural: 'setores'
})

export const getSetores = crudController.getAll
export const getSetorById = crudController.getById
export const createSetor = crudController.create
export const updateSetor = crudController.update
export const deleteSetor = crudController.delete
```

**Quando usar:**
- ✅ Entidade tem apenas `id` e `nome`
- ✅ Operações CRUD padrão sem lógica especial
- ❌ Entidade tem campos complexos ou relacionamentos
- ❌ Precisa de lógica de negócio customizada

### Backend - Error Handler

Tratamento centralizado de erros:

```typescript
import { handleControllerError } from '../utils/errorHandler'

export const myController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lógica do controller
    const result = await myService.doSomething()
    res.json(result)
  } catch (error) {
    // Detecta automaticamente erros MySQL (foreign key, duplicate entry)
    handleControllerError(error, res, 'myController', 'Erro ao processar requisição')
  }
}
```

**Benefícios:**
- Detecção automática de `ER_ROW_IS_REFERENCED` (foreign key constraint)
- Detecção automática de `ER_DUP_ENTRY` (duplicate entry)
- Logging consistente com contexto
- Mensagens amigáveis ao usuário

### Backend - Validação

Validações reutilizáveis:

```typescript
import { validateRequiredFields, validateRequiredString } from '../utils/validation'

// Validar múltiplos campos obrigatórios
const error = validateRequiredFields(req.body, ['nome', 'email', 'telefone'])
if (error) {
  return res.status(400).json({ message: error })
}

// Validar campo único com mensagem customizada
const validation = validateRequiredString(req.body.titulo, 'Título da proposta')
if (!validation.valid) {
  return res.status(400).json({ message: validation.error })
}
```

### Frontend - Socket.IO

Conexão padronizada com Socket.IO:

```typescript
import { createSocket, setupPresencePing } from '@/lib/socketUtils'

// Criar socket com config padrão
const socket = createSocket()

// Setup presence ping com cleanup automático
const cleanupPing = setupPresencePing(socket, token)

// Cleanup
useEffect(() => {
  return () => {
    cleanupPing()
    socket.disconnect()
  }
}, [])
```

### Frontend - API Client

Chamadas à API com auth automático:

```typescript
import { ApiClient } from '@/lib/apiClient'

// Criar cliente autenticado
const client = new ApiClient({ token })

// Fazer requisições
const data = await client.get<MyType>('/endpoint')
const result = await client.post('/endpoint', { name: 'value' })
await client.put('/endpoint/123', { name: 'updated' })
await client.delete('/endpoint/123')
```

**Benefícios:**
- Não precisa mais construir `Authorization: Bearer ${token}` manualmente
- Type-safe com generics TypeScript
- Tratamento de erros consistente
- JSON parsing automático

---

## 🎨 Componentes UI

### Shadcn/Radix UI

Usamos Shadcn CLI para instalar componentes Radix UI:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add scroll-area
# etc
```

Componentes instalados ficam em `src/components/ui/` e podem ser customizados.

### Tailwind CSS v4

Usando Tailwind v4 via plugin Vite:

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

plugins: [
  react(),
  tailwindcss()
]
```

**Classes úteis:**
- `container-main` - Container padrão das páginas
- `text-muted-foreground` - Texto secundário
- `bg-card` - Background de cards
- `border` - Border padrão
- `rounded-lg` - Border radius large

---

## 🔒 Autenticação & Autorização

### JWT Tokens

Tokens JWT assinados com `JWT_SECRET`:

```typescript
// Backend - Gerar token
import { generateToken } from './config/auth'
const token = generateToken({ id: user.id, email: user.email, cargoId: user.cargo_id })

// Frontend - Decodificar token
import { jwtDecode } from 'jwt-decode'
const decoded = jwtDecode<JWTPayload>(token)
```

### Sistema de Permissões

Ver **[FEATURES.md#permissões](./FEATURES.md#permissões)** para uso completo.

**Backend:**
```typescript
import { requirePermission, requireAnyPermission, requireAdmin } from '../middleware/permissions'

router.get('/comercial', requirePermission('comercial'), controller)
router.get('/dashboard', requireAnyPermission(['admin', 'comercial']), controller)
router.delete('/usuarios/:id', requireAdmin, controller)
```

**Frontend:**
```tsx
import { usePermissions } from '@/hooks/use-permissions'

function MyComponent() {
  const { hasPermission, isAdmin } = usePermissions()
  
  if (!hasPermission('comercial')) {
    return <AccessDenied />
  }
  
  return <ComercialModule />
}
```

---

## 🔄 Realtime (Socket.IO)

### Eventos do Servidor

```typescript
// Enviar notificação para usuário específico
import { getIO } from './server'
getIO().to(`user:${userId}`).emit('notification:new', notification)

// Broadcast de presença
getIO().emit('presence:update', { userId, state: 'online' })
```

### Eventos do Cliente

```typescript
// Conectar ao servidor
const socket = createSocket()

// Autenticar
socket.emit('auth:init', { token })

// Ouvir eventos
socket.on('notification:new', (notification) => {
  toastNotification(notification)
})

socket.on('presence:update', ({ userId, state }) => {
  updatePresence(userId, state)
})
```

### Presença Online

Sistema de heartbeat para detectar usuários online:

- Cliente envia `presence:ping` a cada 10s
- Servidor atualiza `last_seen` no banco e marca usuário como online
- Se usuário não pingar por 30s, é marcado como offline
- Servidor envia `presence:update` para todos os clientes

---

## 🤖 Integração com IA (Google Gemini)

### Setup

Ver **[ai/AI_SETUP.md](./ai/AI_SETUP.md)** para instalação completa.

### Uso no Backend

```typescript
import { generateText, analyzeImage, chatMultiTurn } from './services/aiService'

// Gerar texto
const response = await generateText('Explique o que é PPRA')

// Analisar imagem
const analysis = await analyzeImage('base64-image-data', 'Descreva os equipamentos de segurança')

// Chat multi-turno
const chatResponse = await chatMultiTurn([
  { role: 'user', parts: [{ text: 'Olá' }] },
  { role: 'model', parts: [{ text: 'Olá! Como posso ajudar?' }] },
  { role: 'user', parts: [{ text: 'Me explique NR-12' }] }
])
```

### Rate Limiting

- **100 requisições por minuto** por usuário
- Middleware: `server/middleware/rateLimiter.ts`
- Headers de resposta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Cache

- Cache de 15 minutos para respostas idênticas
- Economiza tokens e melhora performance
- Limpar cache: `DELETE /api/ai/cache/clear`

---

## 📁 Upload de Arquivos

### Multer Middleware

Três instâncias configuradas em `server/middleware/upload.ts`:

```typescript
import { uploadTarefa, uploadProposta, uploadUser } from '../middleware/upload'

// Upload para tarefas
router.post('/tarefas/:id/anexo', uploadTarefa.single('arquivo'), controller)

// Upload para propostas
router.post('/propostas/:id/anexo', uploadProposta.single('arquivo'), controller)

// Upload de foto de perfil
router.post('/usuarios/:id/foto', uploadUser.single('foto'), controller)
```

### Estrutura de Pastas

```
server/uploads/
├── task-123/
│   ├── 1699999999999-foto.jpg
│   └── 1699999999998-documento.pdf
├── proposal-456/
│   └── 1699999999997-proposta.pdf
└── user-789/
    └── 1699999999996-avatar.jpg
```

### Servir Arquivos

Arquivos são servidos estaticamente em `/uploads/*`:

```typescript
// Backend (server.ts)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Frontend
<img src={`${import.meta.env.VITE_API_URL}/uploads/user-1/avatar.jpg`} />
```

---

## 🧪 Testing (TODO)

Atualmente **não há testes automatizados** implementados. Sugestões:

### Backend
- **Jest** para testes unitários de services
- **Supertest** para testes de integração de APIs
- **Coverage** mínimo de 70%

### Frontend
- **Vitest** para testes unitários de hooks e utils
- **React Testing Library** para componentes
- **Playwright** ou **Cypress** para testes E2E

---

## 🚀 Deploy

Ver **[deployment/DEPLOY_LIGHTSAIL.md](./deployment/DEPLOY_LIGHTSAIL.md)** para guia completo.

### Scripts Disponíveis

```powershell
# Deploy completo (frontend + backend + uploads)
.\scripts\deploy-all.ps1

# Deploy apenas backend
.\scripts\deploy-backend.ps1

# Deploy apenas frontend
.\scripts\deploy-frontend.ps1

# Deploy apenas uploads
.\scripts\deploy-uploads.ps1
```

### Variáveis de Ambiente - Produção

```env
# Backend
NODE_ENV=production
PORT=5000
SERVE_FRONT=true
FRONT_DIST_PATH=../dist

# Database
MYSQL_HOST=localhost
MYSQL_USER=mirai
MYSQL_PASSWORD=<secure-password>
MYSQL_DATABASE=mirai_db

# Auth
JWT_SECRET=<generate-secure-secret>

# IA
GEMINI_API_KEY=<your-api-key>

# Frontend (build time)
VITE_API_URL=https://seu-dominio.com
VITE_API_WS_URL=wss://seu-dominio.com
```

---

## 🐛 Debugging

### Backend

```bash
# Logs no console
console.log('[myController]', data)

# Debug com breakpoints
# Adicione em .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "cwd": "${workspaceFolder}/server",
  "skipFiles": ["<node_internals>/**"]
}
```

### Frontend

```bash
# React DevTools (extensão do Chrome/Firefox)
# Redux DevTools se usar Redux (não usamos)

# Console
console.log('Debug:', data)

# Breakpoints no navegador (Sources tab)
debugger // força pausa
```

### Banco de Dados

```sql
-- Ver queries lentas
SHOW FULL PROCESSLIST;

-- Ver tamanho das tabelas
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = "mirai_db"
ORDER BY (data_length + index_length) DESC;

-- Ver índices de uma tabela
SHOW INDEX FROM usuarios;
```

---

## 📊 Performance

### Frontend

**Otimizações:**
- `React.memo()` para componentes pesados
- `useMemo()` para cálculos caros
- `useCallback()` para funções em deps de effects
- Lazy loading de rotas: `React.lazy(() => import('./Page'))`
- Debounce em inputs de busca (300ms)

**Ferramentas:**
- Chrome DevTools > Performance tab
- React DevTools > Profiler tab
- Lighthouse audit

### Backend

**Otimizações:**
- Indexes no banco (ver `add_performance_indexes.sql`)
- Cache de permissões (5 min TTL)
- Connection pool MySQL (max 10 conexões)
- Compression middleware para respostas

**Ferramentas:**
- `console.time()` / `console.timeEnd()`
- MySQL slow query log
- Node.js profiler

---

## 📚 Recursos Adicionais

### Documentação Externa
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Guide](https://vitejs.dev/guide/)
- [Express.js Docs](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)

### Documentação Interna
- **[Copilot Instructions](../.github/copilot-instructions.md)** - Arquitetura completa
- **[FEATURES.md](./FEATURES.md)** - Funcionalidades implementadas
- **[README.md](./README.md)** - Índice central de docs

---

## 🆘 Precisa de Ajuda?

- **Dúvidas de código:** Consulte este documento ou `copilot-instructions.md`
- **Dúvidas de funcionalidade:** Consulte `FEATURES.md`
- **Dúvidas de deploy:** Consulte `deployment/DEPLOY_LIGHTSAIL.md`
- **Dúvidas de IA:** Consulte `ai/AI_SETUP.md`

---

📅 **Última atualização:** Novembro 2025  
👨‍💻 **Mantenedores:** Equipe Mirai
