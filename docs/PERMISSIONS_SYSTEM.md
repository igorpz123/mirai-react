# 🔐 Sistema de Permissões - Mirai React

## 📋 Visão Geral

Sistema flexível de permissões baseado em banco de dados que substitui as verificações hardcoded de `cargoId`. Permite gerenciamento dinâmico de permissões por cargo sem necessidade de alterar código.

---

## 🎯 Permissões Disponíveis

### 1. **admin**
- Acesso administrativo completo
- Gerenciar usuários, configurações e todos os módulos
- Dashboards administrativos (técnico e comercial)
- Relatórios completos

### 2. **comercial**
- Acesso ao módulo comercial
- Gerenciar propostas e itens comerciais
- Visualizar relatórios comerciais
- Livro de registros e controle de prática

### 3. **tecnico**
- Acesso ao módulo técnico
- Gerenciar tarefas, agenda e calendário
- Checklists e fluxogramas
- Mapa de tarefas

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `permissoes`
```sql
CREATE TABLE `permissoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL UNIQUE,
  `descricao` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabela: `cargo_permissoes`
```sql
CREATE TABLE `cargo_permissoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cargo_id` INT NOT NULL,
  `permissao_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permissao_id`) REFERENCES `permissoes` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_cargo_permissao` (`cargo_id`, `permissao_id`)
);
```

### View: `vw_usuario_permissoes`
View útil para ver permissões por usuário com joins automáticos.

---

## 🚀 Instalação

### 1. Executar Migration do Banco
```bash
# Na pasta do projeto
mysql -u root -p nome_do_banco < server/migrations/create_permissions_system.sql
```

Ou copie e cole o conteúdo do arquivo no seu cliente MySQL.

### 2. Mapear Cargos Existentes
O script SQL já mapeia automaticamente:
- Cargos 1, 2, 3 → permissão `admin`
- Cargo 13 → permissão `comercial`
- Cargos 4, 5 → permissão `tecnico`

Ajuste os IDs conforme sua tabela `cargos`.

### 3. Reiniciar Servidor
```bash
cd server
npm run dev
```

---

## 💻 Uso no Backend

### Verificar Permissões em Controllers

```typescript
import * as permissionService from '../services/permissionService'

// Verificar se é admin
const isAdmin = await permissionService.isAdmin(userId)

// Verificar permissão específica
const hasAccess = await permissionService.hasPermission(userId, 'comercial')

// Verificar qualquer permissão (OR)
const canAccess = await permissionService.hasAnyPermission(userId, ['admin', 'comercial'])

// Verificar todas as permissões (AND)
const hasAll = await permissionService.hasAllPermissions(userId, ['admin', 'comercial'])
```

### Usar Middlewares

```typescript
import { requireAdmin, requireComercial, requireTecnico, requirePermission } from '../middleware/permissions'

// Rota apenas para admin
router.get('/admin-only', extractUserId, requireAdmin, controller.adminFunction)

// Rota para admin OU comercial
router.get('/comercial', extractUserId, requireComercial, controller.comercialFunction)

// Rota para permissão específica
router.get('/custom', extractUserId, requirePermission('custom_perm'), controller.customFunction)

// Rota para qualquer uma das permissões
router.get('/multi', extractUserId, requireAnyPermission(['admin', 'comercial']), controller.multiFunction)
```

### Buscar Permissões do Usuário

```typescript
const userPerms = await permissionService.getUserPermissions(userId)
// Retorna: { userId: 1, cargoId: 1, permissions: ['admin', 'comercial', 'tecnico'] }
```

---

## 🎨 Uso no Frontend

### Hook: usePermissions

```tsx
import { usePermissions } from '@/hooks/use-permissions'

function MyComponent() {
  const { 
    isAdmin, 
    hasComercialAccess, 
    hasTecnicoAccess,
    hasPermission,
    hasAnyPermission 
  } = usePermissions()

  if (isAdmin) {
    return <AdminPanel />
  }

  if (hasComercialAccess) {
    return <ComercialPanel />
  }

  return <DefaultPanel />
}
```

### Proteger Rotas

```tsx
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PermissionRoute, ComercialRoute, TecnicoRoute } from '@/components/auth/PermissionRoute'

// Rota apenas para admin
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

// Rota para admin OU comercial
<Route path="/comercial" element={<ComercialRoute><ComercialPanel /></ComercialRoute>} />

// Rota para admin OU tecnico
<Route path="/tecnico" element={<TecnicoRoute><TecnicoPanel /></TecnicoRoute>} />

// Rota customizada
<Route path="/custom" element={
  <PermissionRoute permission="custom_perm">
    <CustomPanel />
  </PermissionRoute>
} />
```

### Ocultar/Mostrar Conteúdo

```tsx
import { PermissionGuard } from '@/components/auth/PermissionRoute'

function MyComponent() {
  return (
    <div>
      <h1>Página Pública</h1>
      
      {/* Só mostra para admin */}
      <PermissionGuard permission="admin">
        <AdminActions />
      </PermissionGuard>
      
      {/* Mostra para admin OU comercial */}
      <PermissionGuard permissions={['admin', 'comercial']}>
        <ComercialActions />
      </PermissionGuard>
      
      {/* Com fallback */}
      <PermissionGuard 
        permission="admin" 
        fallback={<p>Você não tem acesso</p>}
      >
        <AdminContent />
      </PermissionGuard>
    </div>
  )
}
```

---

## 🛠️ Gerenciamento de Permissões

### Interface Web
Acesse `/admin/permissoes` (apenas admins) para:
- Visualizar matriz de permissões por cargo
- Adicionar/remover permissões de cargos
- Ver suas próprias permissões
- Limpar cache de permissões

### API Endpoints

#### Ver Minhas Permissões
```http
GET /api/permissoes/me
Authorization: Bearer <token>
```

#### Listar Todas as Permissões (Admin)
```http
GET /api/permissoes
Authorization: Bearer <token>
```

#### Listar Cargos com Permissões (Admin)
```http
GET /api/permissoes/cargos
Authorization: Bearer <token>
```

#### Atualizar Permissões de um Cargo (Admin)
```http
PUT /api/permissoes/cargo/:cargoId
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["admin", "comercial"]
}
```

#### Adicionar Permissão a um Cargo (Admin)
```http
POST /api/permissoes/cargo/:cargoId/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "comercial"
}
```

#### Remover Permissão de um Cargo (Admin)
```http
DELETE /api/permissoes/cargo/:cargoId/:permission
Authorization: Bearer <token>
```

#### Limpar Cache (Admin)
```http
DELETE /api/permissoes/cache
Authorization: Bearer <token>

// Opcional: limpar cache de usuário específico
{
  "userId": 123
}
```

---

## ⚡ Cache

### Como Funciona
- Permissões são cacheadas em memória por **5 minutos**
- Reduz consultas ao banco de dados
- Atualizado automaticamente ao alterar permissões

### Limpar Cache
```typescript
// Backend
import { clearPermissionsCache } from '../services/permissionService'

// Limpar cache de um usuário
clearPermissionsCache(userId)

// Limpar cache de todos os usuários
clearPermissionsCache()
```

---

## 🔄 Migração do Sistema Antigo

### Retrocompatibilidade
O sistema mantém compatibilidade com verificações antigas de `cargoId`:

```typescript
// Código antigo (ainda funciona)
if (user.cargoId === 1 || user.cargoId === 2 || user.cargoId === 3) {
  // Admin
}

// Novo código (recomendado)
if (isAdmin) {
  // Admin
}
```

### Substituir Verificações Antigas

#### Antes:
```typescript
const isAdmin = cargoId === 1 || cargoId === 2 || cargoId === 3
```

#### Depois:
```typescript
const isAdmin = await permissionService.isAdmin(userId)
```

#### Antes (Frontend):
```tsx
const isAdmin = user?.cargoId === 1 || user?.cargoId === 2 || user?.cargoId === 3
```

#### Depois (Frontend):
```tsx
const { isAdmin } = usePermissions()
```

---

## 📊 Queries Úteis

### Ver Permissões de um Usuário
```sql
SELECT * FROM vw_usuario_permissoes WHERE usuario_id = 1;
```

### Ver Todos os Cargos e Permissões
```sql
SELECT * FROM vw_cargo_permissoes;
```

### Ver Usuários com Permissão Específica
```sql
SELECT DISTINCT u.id, u.nome, u.email, c.nome AS cargo
FROM usuarios u
INNER JOIN cargo_permissoes cp ON u.cargo_id = cp.cargo_id
INNER JOIN permissoes p ON cp.permissao_id = p.id
WHERE p.nome = 'admin';
```

### Adicionar Nova Permissão
```sql
INSERT INTO permissoes (nome, descricao) VALUES
('custom_perm', 'Descrição da permissão customizada');
```

### Adicionar Permissão a um Cargo
```sql
INSERT INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 5, id FROM permissoes WHERE nome = 'tecnico';
```

---

## 🎓 Exemplos Práticos

### Exemplo 1: Controller com Verificação
```typescript
export const getSensitiveData = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const isAdmin = await permissionService.isAdmin(req.userId)
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  const data = await fetchSensitiveData()
  res.json(data)
}
```

### Exemplo 2: Frontend Condicional
```tsx
function Dashboard() {
  const { isAdmin, hasComercialAccess, hasTecnicoAccess } = usePermissions()

  return (
    <div>
      {isAdmin && <AdminStats />}
      {hasComercialAccess && <ComercialStats />}
      {hasTecnicoAccess && <TecnicoStats />}
    </div>
  )
}
```

### Exemplo 3: Rota com Múltiplas Permissões
```typescript
// Permitir admin, comercial OU custom_role
router.get('/special', 
  extractUserId, 
  requireAnyPermission(['admin', 'comercial', 'custom_role']), 
  controller.specialFunction
)
```

---

## 🚨 Troubleshooting

### Permissões não atualizam
1. Limpe o cache: `DELETE /api/permissoes/cache`
2. Faça logout e login novamente
3. Aguarde 5 minutos (TTL do cache)

### Usuário não tem permissões
1. Verifique se o cargo tem permissões: `SELECT * FROM vw_cargo_permissoes WHERE cargo_id = X`
2. Execute a migration novamente se necessário
3. Adicione permissões via interface web em `/admin/permissoes`

### Erro 403 "Acesso negado"
1. Verifique suas permissões em `/api/permissoes/me`
2. Peça a um admin para adicionar a permissão necessária
3. Faça logout/login para atualizar o token

---

## 📚 Arquivos Criados

### Backend
- `server/migrations/create_permissions_system.sql` - Migration do banco
- `server/services/permissionService.ts` - Serviço de permissões
- `server/middleware/permissions.ts` - Middlewares de autorização
- `server/controllers/PermissionController.ts` - Controller HTTP
- `server/routes/permissoes.ts` - Rotas da API

### Frontend
- `src/hooks/use-permissions.ts` - Hook de permissões
- `src/components/auth/PermissionRoute.tsx` - Componentes de rota
- `src/pages/AdminPermissions.tsx` - Interface de gerenciamento

### Arquivos Atualizados
- `server/services/authService.ts` - Incluir permissões no token
- `src/services/auth.ts` - Interface User com permissions
- `src/contexts/AuthContext.tsx` - Carregar permissões do token
- `src/components/auth/AdminRoute.tsx` - Usar permissões
- `src/App.tsx` - Rota de gerenciamento e HomeRedirect com permissões
- `src/components/layout/app-sidebar.tsx` - Link de gerenciamento

---

## 🎯 Próximos Passos

1. **Executar a migration** no banco de dados
2. **Reiniciar o servidor** backend
3. **Testar login** para verificar se permissões aparecem
4. **Acessar `/admin/permissoes`** para gerenciar permissões
5. **Atualizar código antigo** gradualmente para usar novo sistema
6. **Criar novas permissões** conforme necessário

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os comentários no código
3. Verifique os logs do servidor
4. Use a interface de gerenciamento em `/admin/permissoes`

---

**Data:** 28/10/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso em produção
