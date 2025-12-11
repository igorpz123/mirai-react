# Guia de Deploy - Número de Referência para Propostas

## Objetivo
Adicionar um campo `numero_referencia` na tabela de propostas com numeração sequencial por ano (formato: NNNN/YYYY).

## Passos de Deploy

### 1. Backup do Banco de Dados
Antes de qualquer alteração, faça backup:

```bash
mysqldump -u mirai_user -p mirai_db > backup_propostas_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Executar Migration SQL
```bash
# Conectar ao MySQL
mysql -u mirai_user -p mirai_db

# Executar a migration
source /home/ubuntu/mirai/server/migrations/add_numero_referencia_propostas.sql
```

Ou diretamente:
```bash
mysql -u mirai_user -p mirai_db < /home/ubuntu/mirai/server/migrations/add_numero_referencia_propostas.sql
```

### 3. Verificar a Migration
```sql
-- Verificar se a coluna foi criada
DESCRIBE propostas;

-- Verificar se os números foram gerados corretamente
SELECT numero_referencia, titulo, data 
FROM propostas 
ORDER BY data DESC 
LIMIT 10;

-- Verificar contagem de propostas por ano
SELECT 
  YEAR(data) as ano,
  COUNT(*) as total,
  MIN(numero_referencia) as primeiro,
  MAX(numero_referencia) as ultimo
FROM propostas 
GROUP BY YEAR(data)
ORDER BY ano DESC;
```

### 4. Build e Deploy do Backend
```powershell
# No seu computador local, no diretório raiz do projeto

# 1. Fazer build do servidor
npm --prefix server run build

# 2. Enviar dist/ compilado para o servidor
scp -i C:\LightsailDefaultKey-us-east-1.pem -r server/dist ubuntu@34.234.188.215:/home/ubuntu/mirai/server/

# 3. Reiniciar o serviço no servidor
ssh -i C:\LightsailDefaultKey-us-east-1.pem ubuntu@34.234.188.215 "sudo systemctl restart mirai-backend"

# 4. Verificar logs
ssh -i C:\LightsailDefaultKey-us-east-1.pem ubuntu@34.234.188.215 "journalctl -u mirai-backend -f"
```

### 5. Build e Deploy do Frontend (opcional, se houver mudanças na UI)
```powershell
# No diretório raiz do projeto

# 1. Build do frontend
npm run build

# 2. Enviar para o servidor
scp -i C:\LightsailDefaultKey-us-east-1.pem -r dist/* ubuntu@34.234.188.215:/var/www/mirai/frontend/

# 3. Limpar cache do Nginx (opcional)
ssh -i C:\LightsailDefaultKey-us-east-1.pem ubuntu@34.234.188.215 "sudo nginx -s reload"
```

## Validação

### Testar Criação de Nova Proposta
1. Acesse https://mirai.oestesst.com.br
2. Crie uma nova proposta
3. Verifique se o campo `numero_referencia` aparece no formato NNNN/YYYY (ex: 0001/2025)

### Verificar Backend
```bash
# No servidor
mysql -u mirai_user -p mirai_db -e "SELECT numero_referencia, titulo FROM propostas ORDER BY id DESC LIMIT 5;"
```

## Rollback (em caso de problemas)

### 1. Restaurar Backup
```bash
mysql -u mirai_user -p mirai_db < backup_propostas_YYYYMMDD_HHMMSS.sql
```

### 2. Remover Coluna (se necessário)
```sql
ALTER TABLE propostas DROP COLUMN numero_referencia;
ALTER TABLE propostas DROP INDEX idx_numero_referencia;
```

## Notas Importantes

1. **Atomicidade**: A geração de números usa transação SQL para evitar duplicatas
2. **Formato**: NNNN/YYYY (ex: 0001/2025, 0002/2025, 0001/2026)
3. **Reset Anual**: A contagem reinicia a cada ano
4. **Backfill**: A migration popula automaticamente as propostas existentes
5. **Ordem**: Propostas existentes são numeradas por ordem de criação (data ASC, id ASC)

## Troubleshooting

### Erro: "Duplicate entry for key 'idx_numero_referencia'"
- Significa que já existe uma proposta com o mesmo número
- Verifique: `SELECT numero_referencia, COUNT(*) FROM propostas GROUP BY numero_referencia HAVING COUNT(*) > 1;`
- Solução: Re-executar a parte de UPDATE da migration

### Números não estão sequenciais
- Verifique a lógica no ProposalController.ts linha ~1015
- Confirme que a query está ordenando por `YEAR(data)` e pegando o MAX corretamente

### Performance lenta
- Verifique se o índice foi criado: `SHOW INDEX FROM propostas;`
- Deve existir: `idx_numero_referencia`
