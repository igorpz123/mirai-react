# ✨ Funcionalidades Implementadas - Mirai React

Documentação consolidada de todas as funcionalidades principais do sistema.

---

## 🔐 Sistema de Permissões

Sistema completo baseado em banco de dados que substitui verificações hardcoded de `cargoId`.

### Permissões Disponíveis
- **admin** - Acesso administrativo completo
- **comercial** - Módulo comercial e propostas
- **tecnico** - Módulo técnico e tarefas

### Arquivos Principais
- `server/services/permissionService.ts` - Lógica de permissões com cache
- `server/middleware/permissions.ts` - Middlewares de proteção de rotas
- `server/controllers/PermissionController.ts` - API de gerenciamento
- `src/hooks/use-permissions.ts` - Hook React para frontend
- `src/components/auth/ProtectedRoute.tsx` - Proteção de rotas frontend

### Como Usar

#### Backend - Proteger Rota
```typescript
import { requirePermission, requireAnyPermission, requireAdmin } from '../middleware/permissions'

// Requer permissão específica
router.get('/comercial', requirePermission('comercial'), controller.getComercial)

// Requer qualquer uma das permissões (OR)
router.get('/dashboard', requireAnyPermission(['admin', 'comercial']), controller.getDashboard)

// Alias para admin
router.delete('/usuarios/:id', requireAdmin, controller.deleteUser)
```

#### Frontend - Verificar Permissão
```tsx
import { usePermissions } from '@/hooks/use-permissions'

function MyComponent() {
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions()
  
  if (hasPermission('comercial')) {
    return <ComercialModule />
  }
  
  return <AccessDenied />
}
```

### Gerenciamento (Admin)
- **GET** `/api/permissoes/me` - Minhas permissões
- **GET** `/api/permissoes` - Listar todas
- **GET** `/api/permissoes/cargo/:cargoId` - Permissões de cargo
- **PUT** `/api/permissoes/cargo/:cargoId` - Atualizar permissões

### Cache
- Cache em memória (5 minutos TTL, 500 entradas máx)
- Invalidação automática ao atualizar permissões
- Endpoint para limpar cache: `DELETE /api/permissoes/cache`

### Documentação Detalhada
- **Técnica Completa:** Ver arquivos originais se necessário contexto adicional
- **Migration:** `server/migrations/create_permissions_system.sql`

---

## 📚 Sistema de Ajuda Contextual

Sistema integrado de páginas de ajuda para cada módulo com detecção automática de contexto.

### Características
- **7 módulos completos** com 30+ seções de ajuda
- **Detecção automática** de módulo baseado na rota atual
- **Busca em tempo real** em todo conteúdo
- **Interface premium** com navegação intuitiva
- **100+ dicas** e tutoriais passo a passo

### Arquivos Principais
- `src/data/helpContent.ts` - Conteúdo estruturado (500+ linhas)
- `src/components/help/HelpDialog.tsx` - Modal com busca e navegação
- `src/components/help/HelpButton.tsx` - Botão com detecção automática
- `src/components/layout/site-header.tsx` - Integração no header global

### Como Funciona
O `HelpButton` está integrado no header global e detecta automaticamente o módulo baseado na URL:
- `/empresas` → Abre ajuda de Empresas
- `/tarefas` → Abre ajuda de Tarefas
- `/propostas` → Abre ajuda de Propostas
- Rota não mapeada → Mostra lista de todos os módulos

### Módulos Disponíveis
1. **Empresas** (5 seções): Criar, editar, tarefas automáticas, documentos
2. **Tarefas** (4 seções): Criar, editar, priorizar, anexos
3. **Propostas** (5 seções): Criar, adicionar itens, exportar, acompanhar
4. **Usuários** (4 seções): Cadastrar, editar permissões, gerenciar unidades
5. **Dashboard** (3 seções): Visualizar dados, filtrar, exportar relatórios
6. **Busca Global** (1 seção): Atalhos e dicas de busca
7. **Notificações** (2 seções): Configurar, gerenciar alertas

### Uso Avançado
```tsx
// Detecção automática (recomendado - já está no header)
<HelpButton autoDetect />

// Módulo específico
<HelpButton moduleId="empresas" />

// Variantes
<HelpButton autoDetect variant="ghost" size="icon" />
```

### Adicionar Novo Conteúdo
1. Editar `src/data/helpContent.ts`
2. Adicionar módulo/seção com título, descrição, steps, tips
3. Adicionar mapeamento de rota em `HelpButton.tsx` se necessário

### Documentação Detalhada
- **Guia Técnico Completo:** Ver arquivos originais para contexto adicional
- **Detecção Automática:** Ver arquivos originais para rotas mapeadas

---

## 🔍 Busca Global (Ctrl+K)

Sistema completo de busca rápida em múltiplas entidades com atalhos de teclado.

### Características
- **Atalho universal:** `Ctrl+K` (Windows/Linux) ou `⌘K` (Mac)
- **4 entidades:** Tarefas, Propostas, Empresas, Usuários
- **Busca inteligente** com ranking de relevância
- **Navegação por teclado:** ↑/↓/Enter/Esc
- **Histórico** das últimas 10 buscas
- **Debounce automático** (300ms)

### Arquivos Principais
- `server/services/searchService.ts` - Lógica de busca com scoring
- `server/controllers/SearchController.ts` - API endpoints
- `src/components/GlobalSearch.tsx` - Interface React
- `src/components/layout/app-sidebar.tsx` - Botão visual de busca

### API Endpoints
```typescript
GET /api/search/global?q=termo&limit=50&types=task,proposal
```

### Sistema de Relevância
- **Título exato:** +50 pontos
- **Título parcial:** +30 pontos
- **Descrição/outros campos:** +10 pontos
- **Tarefas pendentes:** +20 pontos bônus
- **Máximo:** 200 pontos

### Permissões
- **Usuários comuns:** Veem apenas dados de suas unidades
- **Admins:** Veem todos os dados do sistema

### Como Usar
1. Pressione `Ctrl+K` em qualquer tela
2. Digite termo de busca (mín. 2 caracteres)
3. Use `↑` e `↓` para navegar
4. Pressione `Enter` para abrir resultado

### Exemplos de Busca
- "renovação licença" → Encontra tarefas e propostas
- "12345678000190" → Busca por CNPJ
- "João Silva" → Encontra usuários e empresas
- "PPRA" → Busca propostas por tipo

### Documentação Detalhada
- **Guia Técnico:** Ver arquivos originais para implementação completa
- **Guia Rápido:** Ver arquivos originais para dicas de uso

---

## 👥 Agenda de Usuários

Sistema de configuração individual de agenda e horários de trabalho.

### Características
- **Configuração por usuário:** Horários personalizados
- **Integração com tarefas:** Sugestões de horários
- **Flexibilidade:** Diferentes horários por dia da semana

### Arquivos Principais
- `server/services/agendaUsersService.ts` - Lógica de agenda
- `server/controllers/AgendaUsersController.ts` - API
- `server/migrations/create_agenda_users_config.sql` - Tabela

### Campos Configuráveis
- Horário de início da manhã
- Horário de término da manhã
- Horário de início da tarde
- Horário de término da tarde
- Dias de trabalho na semana

### API Endpoints
```typescript
GET /api/agenda-users/me - Minha configuração
PUT /api/agenda-users - Atualizar minha agenda
GET /api/agenda-users/:userId - Agenda de outro usuário (admin)
PUT /api/agenda-users/:userId - Atualizar agenda (admin)
```

### Documentação Detalhada
- **Sistema Completo:** Ver arquivos originais se necessário

---

## 🔄 Async Jobs

Sistema de processamento assíncrono para tarefas de longa duração.

### Características
- **Jobs em background:** Não bloqueia requisições
- **Polling de status:** Cliente verifica progresso
- **Tratamento de erros:** Captura falhas e reporta

### Arquivos Principais
- `server/services/autoTasksService.ts` - Geração de tarefas automáticas
- `server/controllers/CompanyController.ts` - Jobs de empresas

### Casos de Uso
1. **Geração de tarefas automáticas** para empresa/unidade
2. **Importação em massa** de dados
3. **Exportação de relatórios** grandes
4. **Processamento de imagens** via IA

### Como Funciona
1. Cliente solicita job: `POST /api/empresas/:id/gerar-tarefas-futuro`
2. Servidor retorna `jobId`: `{ jobId: 'uuid-123' }`
3. Cliente faz polling: `GET /api/empresas/job-status/:jobId`
4. Servidor retorna status: `{ status: 'processing|completed|failed', result?, error? }`

### Exemplo de Implementação
```typescript
// Backend
const jobId = uuidv4()
jobs.set(jobId, { status: 'processing' })

// Processar em background
processJobAsync(jobId).then(result => {
  jobs.set(jobId, { status: 'completed', result })
}).catch(error => {
  jobs.set(jobId, { status: 'failed', error: error.message })
})

return res.json({ jobId })
```

### Documentação Detalhada
- **Ver arquivo original** se necessário contexto adicional

---

## 🎨 Multi-Select

Componentes avançados de seleção múltipla com busca e badges.

### Características
- **Busca integrada** para filtrar opções
- **Badges visuais** para seleções
- **Select All / Clear All** com um clique
- **Responsivo** e acessível (Radix UI)

### Arquivos Principais
- `src/components/ui/multi-select.tsx` - Componente base
- Usado em páginas de Tarefas, Propostas, Usuários

### Como Usar
```tsx
import { MultiSelect } from '@/components/ui/multi-select'

<MultiSelect
  options={[
    { label: 'Opção 1', value: '1' },
    { label: 'Opção 2', value: '2' }
  ]}
  selected={selectedIds}
  onChange={setSelectedIds}
  placeholder="Selecione..."
  searchPlaceholder="Buscar..."
/>
```

### Funcionalidades
- **Busca em tempo real** nas opções
- **Contador** de seleções
- **Botões rápidos:** "Selecionar Todos" / "Limpar"
- **Scroll virtual** para grandes listas
- **Keyboard navigation** completa

### Documentação Detalhada
- **Ver arquivo original** para props completas

---

## 🛠️ Utilitários de Backend

### Error Handler (`server/utils/errorHandler.ts`)
Tratamento centralizado de erros com detecção automática de erros MySQL.

```typescript
import { handleControllerError } from '../utils/errorHandler'

try {
  // lógica
} catch (error) {
  handleControllerError(error, res, 'myController', 'Mensagem amigável')
}
```

### Validation Utils (`server/utils/validation.ts`)
Validações reutilizáveis de entrada.

```typescript
import { validateRequiredFields, validateRequiredString } from '../utils/validation'

const error = validateRequiredFields(data, ['nome', 'email'])
if (error) return res.status(400).json({ message: error })
```

### CRUD Controller Factory (`server/utils/crudController.ts`)
Factory para criar CRUD completo de entidades simples.

```typescript
import { createCrudController } from '../utils/crudController'

const crud = createCrudController(pool, {
  tableName: 'setor',
  entityName: 'setor',
  entityNamePlural: 'setores'
})

export const getSetores = crud.getAll
export const createSetor = crud.create
// ... etc
```

### Documentação Detalhada
- **Guia de Refatoração:** Ver `DEVELOPMENT.md#refatoração`

---

## 🔌 Socket.IO & Realtime

### Presença Online
Sistema de detecção de usuários online em tempo real.

**Eventos:**
- `presence:snapshot` - Lista inicial de usuários online
- `presence:update` - Mudança de status de usuário
- `presence:ping` - Heartbeat a cada 10s

**Arquivos:**
- `server/server.ts` - Servidor Socket.IO
- `src/contexts/RealtimeContext.tsx` - Cliente React
- `src/lib/socketUtils.ts` - Utilitários de conexão

### Notificações Realtime
Notificações push instantâneas via WebSocket.

**Eventos:**
- `notification:new` - Nova notificação para usuário
- Entregue no room `user:<userId>`

**Arquivos:**
- `server/services/notificationService.ts` - Criação e envio
- `src/contexts/RealtimeContext.tsx` - Recebimento frontend
- `src/lib/customToast.tsx` - Toast visual com Sonner

---

## 🎓 Tours Interativos

Sistema completo de tours guiados usando Shepherd.js para onboarding de novos usuários.

### Características
- **7 tours interativos** cobrindo todos os módulos principais
- **Tour automático** iniciado na primeira vez que o usuário faz login
- **Controle de progresso** salvo em localStorage
- **Interface premium** com tema dark/light integrado
- **Navegação por teclado** (Esc, Enter, Tab)
- **Responsivo** e acessível (Radix UI + Shepherd.js)

### Arquivos Principais
- `src/contexts/TourContext.tsx` - Provider e hook `useTour`
- `src/components/tour/TourButton.tsx` - Botão dropdown com lista de tours
- `src/components/tour/FirstTimeTour.tsx` - Inicia tour automático
- `src/data/tours.ts` - Definições de todos os 7 tours
- `src/lib/tourConfig.ts` - Configuração global e tipos
- `src/styles/tour.css` - Estilos customizados do Shepherd

### Tours Disponíveis
1. **Bem-vindo ao Mirai** - Tour introdutório automático (sidebar, busca, notificações)
2. **Dashboard** - Cards, filtros e gráficos
3. **Tarefas** - Criar, filtrar e gerenciar tarefas
4. **Propostas** - Criar propostas e exportar documentos
5. **Empresas** - Cadastro, tarefas automáticas e documentos
6. **Agenda** - Visualizações e filtros de usuários
7. **Usuários** - Gerenciamento e permissões (admin)

### Como Usar

#### Usuário Final
- Tour automático inicia após 1,5s no primeiro login
- Clique no ícone 🎓 no header para ver todos os tours
- Tours completados aparecem com ✓ verde
- "Resetar todos os tours" para refazer

#### Desenvolvedor
```typescript
// Iniciar tour programaticamente
import { useTour } from '@/contexts/TourContext'

function MeuComponente() {
  const { startTour, hasSeenTour } = useTour()

  if (!hasSeenTour('dashboard')) {
    // Sugerir tour
  }

  return (
    <Button onClick={() => startTour('tasks')}>
      Ver Tour de Tarefas
    </Button>
  )
}
```

#### Adicionar Novo Tour
1. Edite `src/data/tours.ts` e adicione definição
2. Marque elementos da UI com `data-tour="id"`
3. Tour será automaticamente listado no dropdown

### Exemplo de Tour Step
```typescript
{
  id: 'step-1',
  title: '📊 Título do Step',
  text: '<p>Use HTML para formatar. Suporta <strong>negrito</strong>, <kbd>Ctrl+K</kbd>, etc.</p>',
  attachTo: { element: '[data-tour="meu-elemento"]', on: 'bottom' },
  buttons: [tourButtons.back, tourButtons.next]
}
```

### Storage
- Tours vistos salvos em `localStorage`: `mirai_tours_seen`
- Array de TourIds: `["first-time", "dashboard", "tasks"]`
- Resetar limpa o localStorage

### Documentação Completa
- **Guia Técnico Detalhado:** `docs/TOURS.md`
- **Customização:** Ver `src/styles/tour.css` e `src/lib/tourConfig.ts`

---

## 📊 Performance

### Otimizações Implementadas
- **Indexes no banco:** Criados em campos de busca frequente
- **Cache de permissões:** 5 minutos TTL, reduz consultas ao DB
- **Debounce em buscas:** 300ms para evitar requisições desnecessárias
- **Lazy loading:** Componentes carregados sob demanda
- **Memoização:** `useMemo` e `useCallback` em contextos
- **Virtual scrolling:** Para listas grandes (TODO: implementar)

### Migrations de Performance
- `server/migrations/add_performance_indexes.sql` - Indexes otimizados

---

## 🚀 Próximas Funcionalidades

### Em Planejamento
- [ ] Sistema de notificações por email
- [ ] Relatórios avançados com gráficos
- [ ] Integração com calendário externo (Google Calendar)
- [ ] App mobile (React Native)
- [ ] Dashboard executivo com KPIs
- [ ] Sistema de backup automático
- [ ] Logs de auditoria completos
- [ ] Versionamento de documentos

### ✅ Recém Implementado
- [x] **Tours Interativos** - Sistema completo de onboarding (Novembro 2025)

---

## 📝 Contribuindo com Novas Features

Ao adicionar uma nova funcionalidade:

1. **Implemente** backend e frontend
2. **Documente neste arquivo** com:
   - Descrição clara da funcionalidade
   - Arquivos principais envolvidos
   - Como usar (exemplos de código)
   - API endpoints (se houver)
   - Link para documentação técnica detalhada
3. **Atualize** `README.md` com link para esta seção
4. **Adicione** em `CHANGELOG_USUARIO.md` se impactar usuários finais

---

📅 **Última atualização:** Novembro 2025  
🎯 **Status:** Todas as funcionalidades listadas estão em produção
