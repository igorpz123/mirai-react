# 🔒 Sistema de Auditoria - Quick Install

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Criar Tabela no Banco

```bash
# No terminal, execute:
mysql -u root -p mirai < server/migrations/create_audit_logs.sql
```

### 2️⃣ Verificar Instalação

```sql
-- No MySQL, verifique:
USE mirai;
SHOW TABLES LIKE 'audit_logs';
SELECT * FROM audit_logs LIMIT 1;
```

### 3️⃣ Testar Sistema

1. Reinicie o backend: `npm --prefix server run dev`
2. Faça login no sistema
3. Acesse: **Menu Gerenciar → Auditoria**
4. Deve aparecer pelo menos 1 log (do sistema)

## ✅ Pronto!

O sistema já está registrando:
- ✅ Logins e logouts
- ✅ Todas as ações futuras nos controllers que adicionarem `auditService`

## 📚 Próximos Passos

**Para adicionar auditoria em controllers:**

```typescript
import { auditService } from '../services/auditService';

// Registrar ação manualmente
await auditService.logFromRequest(req, 'UPDATE', 'task', 
  'Tarefa atualizada',
  { entityId: 123 }
);
```

**Ou usar middleware automático:**

```typescript
import { auditMiddleware } from '../middleware/audit';

router.use('/tarefas', auditMiddleware('task'));
```

## 📖 Documentação Completa

- **Guia Completo:** `docs/AUDITORIA_GUIDE.md`
- **Documentação Técnica:** `docs/FEATURES.md` (seção Logs de Auditoria)
- **Exemplos:** `server/controllers/AuthController.ts` (login com auditoria)

## 🐛 Troubleshooting

**Erro: Tabela já existe**
```sql
DROP TABLE IF EXISTS audit_logs;
-- Depois execute a migration novamente
```

**Erro: Não consigo acessar página de Auditoria**
- Verifique se você é **admin** (cargoId 1, 2 ou 3)
- Página é restrita apenas para administradores

**Logs não aparecem**
- Verifique se a rota está registrada em `server/routes/router.ts`
- Deve ter: `router.use('/auditoria', auditoriaRoutes)`

---

🚀 **Sistema pronto para uso!** Qualquer ação importante no sistema agora será rastreada.
