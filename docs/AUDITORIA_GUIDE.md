# 🔒 Sistema de Auditoria - Guia de Instalação e Uso

## 📋 Índice
1. [Instalação](#instalação)
2. [Primeiros Passos](#primeiros-passos)
3. [Como Usar](#como-usar)
4. [Exemplos Práticos](#exemplos-práticos)
5. [FAQ](#faq)

---

## 🚀 Instalação

### 1. Criar Tabela no Banco de Dados

Execute a migration no MySQL:

```bash
mysql -u root -p mirai < server/migrations/create_audit_logs.sql
```

Ou manualmente no MySQL Workbench/phpMyAdmin:
- Abra o arquivo `server/migrations/create_audit_logs.sql`
- Execute todo o conteúdo no banco `mirai`

### 2. Verificar Instalação

```sql
-- Verificar se a tabela foi criada
SHOW TABLES LIKE 'audit_logs';

-- Verificar estrutura
DESCRIBE audit_logs;

-- Deve ter um log inicial do sistema
SELECT * FROM audit_logs WHERE entity_type = 'audit_system';
```

### 3. Reiniciar Servidor

```bash
# Backend
cd server
npm run dev

# Frontend
npm run dev
```

### 4. Acessar Interface

- Faça login como **administrador**
- Acesse: **Menu Gerenciar → Auditoria**
- Ou URL direta: `http://localhost:5173/admin/auditoria`

---

## 🎯 Primeiros Passos

### Visualizar Logs

1. Acesse a página de Auditoria
2. Por padrão, mostra os 50 logs mais recentes
3. Use os filtros para refinar a busca

### Filtros Disponíveis

| Filtro | Descrição | Exemplo |
|--------|-----------|---------|
| **Buscar** | Texto livre em descrição/usuário | "criou tarefa", "João Silva" |
| **Ação** | Tipo de ação | CREATE, UPDATE, DELETE, LOGIN |
| **Entidade** | Tipo de registro | task, proposal, company, user |
| **Status** | Resultado | success, failure, error |
| **Data Início/Fim** | Período | 2025-12-01 até 2025-12-31 |

### Exportar Logs

1. Configure os filtros desejados
2. Clique em **"Exportar CSV"**
3. Arquivo será baixado automaticamente
4. Abra no Excel/Google Sheets

---

## 📖 Como Usar

### Para Administradores

#### Consultar Atividade de Usuário

```typescript
// Filtro por usuário específico
GET /api/auditoria?userId=5&limit=100
```

Ou na interface:
1. Aba **Logs**
2. Campo **Buscar**: digite nome ou email do usuário
3. Ajuste período se necessário

#### Ver Histórico de uma Entidade

```typescript
// Exemplo: ver todo histórico da tarefa #123
GET /api/auditoria/history/task/123
```

Mostra:
- Quem criou
- Todas as atualizações
- Mudanças de status
- Quando foi concluída/cancelada

#### Estatísticas do Sistema

1. Acesse aba **Estatísticas**
2. Veja:
   - Total de logs registrados
   - Taxa de sucesso (%)
   - Ações mais comuns
   - Usuários mais ativos

#### Arquivar Logs Antigos

```bash
# Manter apenas últimos 2 anos (730 dias)
POST /api/auditoria/archive
Body: { "daysToKeep": 730 }
```

⚠️ **Atenção:** Logs arquivados são deletados permanentemente. Use apenas se necessário por questões de performance.

---

## 💡 Exemplos Práticos

### 1. Investigar Mudança em Tarefa

**Cenário:** Cliente reclama que tarefa mudou de status sem avisar.

**Solução:**
1. Acesse Auditoria
2. Filtro **Entidade**: `task`
3. Campo **Buscar**: `#456` (ID da tarefa)
4. Veja histórico completo com:
   - Quem mudou
   - Quando mudou
   - De qual status para qual

### 2. Verificar Logins Suspeitos

**Cenário:** Verificar se houve acesso não autorizado.

**Solução:**
1. Filtro **Ação**: `LOGIN`
2. Filtro **Data**: últimos 7 dias
3. Revise coluna **IP** e **Data/Hora**
4. Identifique padrões anormais

### 3. Audit Trail para Compliance

**Cenário:** Auditoria externa pede prova de alterações em dados.

**Solução:**
1. Configure filtros:
   - **Entidade**: `proposal` (ou outra)
   - **Período**: período solicitado
   - **Status**: `success` (apenas ações bem-sucedidas)
2. Clique **Exportar CSV**
3. Envie arquivo para auditor

### 4. Rastrear Deletions

**Cenário:** Descobrir quem deletou registro importante.

**Solução:**
1. Filtro **Ação**: `DELETE`
2. Campo **Buscar**: nome da entidade ou ID
3. Identifique:
   - Usuário responsável
   - Data/hora exata
   - IP de origem

---

## 🛠️ Para Desenvolvedores

### Adicionar Auditoria em Novo Controller

#### Opção 1: Registro Manual (Recomendado para ações críticas)

```typescript
import { auditService } from '../services/auditService';

export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const oldTask = await getTaskById(taskId); // Buscar estado atual
    
    // Atualizar tarefa
    await updateTaskInDB(taskId, req.body);
    const newTask = await getTaskById(taskId);
    
    // Registrar auditoria com mudanças
    await auditService.logFromRequest(req, 'UPDATE', 'task', 
      `Tarefa #${taskId} atualizada`,
      {
        entityId: taskId,
        changes: auditService.detectChanges(oldTask, newTask),
        metadata: { priority: newTask.priority }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    // ... tratamento de erro
  }
};
```

#### Opção 2: Middleware Automático (Para CRUDs simples)

```typescript
import { auditMiddleware } from '../middleware/audit';

const router = Router();

// Aplica auditoria automática em todas as rotas de tarefas
router.use(auditMiddleware('task'));

// Ações serão registradas automaticamente baseado no método HTTP
router.post('/', createTask);      // → Registra CREATE
router.put('/:id', updateTask);     // → Registra UPDATE
router.delete('/:id', deleteTask);  // → Registra DELETE
```

### Tipos Customizados

```typescript
// Adicionar novo tipo de ação
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE'
  | 'MY_CUSTOM_ACTION'  // ← Adicione aqui
  | ...

// Adicionar novo tipo de entidade
export type EntityType = 
  | 'task'
  | 'my_new_entity'  // ← Adicione aqui
  | ...
```

### Consultar Logs Programaticamente

```typescript
import { auditService } from '../services/auditService';

// Buscar logs com filtros
const { logs, total } = await auditService.getLogs({
  userId: 5,
  action: 'DELETE',
  startDate: '2025-12-01',
  limit: 100
});

// Buscar histórico de entidade
const history = await auditService.getEntityHistory('task', 123);

// Buscar estatísticas
const stats = await auditService.getStats({
  startDate: '2025-12-01',
  endDate: '2025-12-31'
});
```

---

## ❓ FAQ

### Como desabilitar auditoria temporariamente?

Não recomendado, mas se necessário:
1. Comente a linha do middleware nas rotas
2. Ou adicione verificação no `auditService.log()`:

```typescript
async log(entry: AuditLogEntry) {
  if (process.env.DISABLE_AUDIT === 'true') return 0;
  // ... resto do código
}
```

### Logs de READ são necessários?

**Depende do caso:**
- ✅ **SIM** para dados sensíveis (usuários, permissões)
- ❌ **NÃO** para listagens comuns (causam muito volume)

Configure seletivamente:
```typescript
// Apenas CREATE, UPDATE, DELETE
router.use((req, res, next) => {
  if (req.method === 'GET') return next();
  return auditMiddleware('task')(req, res, next);
});
```

### Como limitar volume de logs?

1. **Arquivamento periódico** (recomendado a cada 6 meses):
   ```sql
   CALL archive_old_audit_logs(180);  -- Mantém últimos 6 meses
   ```

2. **Filtrar ações menos importantes:**
   - Não registrar GETs de listagens
   - Focar em CREATE, UPDATE, DELETE críticos

3. **Monitorar tamanho da tabela:**
   ```sql
   SELECT 
     COUNT(*) as total_logs,
     ROUND(SUM(LENGTH(changes) + LENGTH(metadata)) / 1024 / 1024, 2) as size_mb
   FROM audit_logs;
   ```

### Posso deletar logs?

**Tecnicamente sim, mas NÃO recomendado:**
- Viola princípio de auditoria (imutabilidade)
- Pode comprometer compliance (LGPD, ISO 27001)
- Use arquivamento ao invés de deleção

**Exceção:** Dados pessoais após fim da relação contratual (direito ao esquecimento).

### Como auditar mudanças em campos específicos?

```typescript
// Detectar mudanças apenas em campos críticos
const criticalFields = ['status', 'responsavel_id', 'prazo'];
const changes = auditService.detectChanges(
  pick(oldTask, criticalFields),
  pick(newTask, criticalFields)
);

if (changes) {
  await auditService.logFromRequest(req, 'UPDATE', 'task',
    'Campos críticos alterados',
    { entityId: taskId, changes }
  );
}
```

### Performance está afetada?

**Impacto mínimo** se bem implementado:
- ✅ Logs são assíncronos (não bloqueiam)
- ✅ Índices otimizados no banco
- ✅ Cache para permissões

**Se houver lentidão:**
1. Verifique quantidade de logs (> 1 milhão)
2. Execute arquivamento
3. Otimize queries com `EXPLAIN`

---

## 🎓 Melhores Práticas

### ✅ DO (Faça)

- Registre ações críticas: CREATE, UPDATE, DELETE
- Inclua contexto útil no campo `metadata`
- Use `detectChanges()` para capturar before/after
- Configure arquivamento periódico
- Exporte logs regularmente para backup

### ❌ DON'T (Não Faça)

- Não registre senhas ou dados sensíveis em `changes`
- Não delete logs manualmente
- Não registre TODAS as ações GET (gera volume desnecessário)
- Não ignore erros no registro (use try/catch silencioso)

---

## 📞 Suporte

**Problemas?**
1. Verifique logs do servidor: `npm --prefix server run dev`
2. Verifique console do navegador (F12)
3. Consulte documentação completa: `docs/FEATURES.md`

**Dúvidas sobre implementação?**
- Ver exemplos em: `server/controllers/AuthController.ts`
- Ver middleware em: `server/middleware/audit.ts`
- Ver service em: `server/services/auditService.ts`

---

📅 **Criado em:** Dezembro 2025  
🔄 **Versão:** 1.0  
✅ **Status:** Produção
