# Sistema de Jobs Assíncronos

## Visão Geral

Este documento descreve o sistema de jobs em background implementado para resolver problemas de timeout em operações longas, como a geração de tarefas automáticas para múltiplas empresas.

## Problema Resolvido

**Erro 504 Gateway Timeout**: Ao gerar tarefas automáticas para todas as empresas de uma unidade, a operação demorava muito tempo (vários minutos) processando cada empresa sequencialmente. Isso causava timeout no proxy/gateway (geralmente 60 segundos).

## Arquitetura da Solução

### 1. Background Job Service (`server/services/backgroundJobService.ts`)

Serviço singleton em memória que gerencia o ciclo de vida dos jobs assíncronos:

```typescript
interface Job {
  id: string                    // UUID gerado com crypto.randomUUID()
  type: string                  // Tipo do job (ex: 'generate-auto-tasks-unit')
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: {
    current: number             // Empresas processadas
    total: number              // Total de empresas
    percentage: number         // % de progresso
  }
  result?: JobResult           // Resultado final quando completed
  error?: string              // Mensagem de erro quando failed
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  userId?: number             // Para notificações
}
```

**Características:**
- Jobs são mantidos em memória (Map)
- Limpeza automática de jobs completados após 1 hora
- Thread-safe para acesso concorrente

### 2. API Endpoints

#### `POST /api/empresas/unidade/:unidade_id/auto-tarefas`

**Nova resposta (202 Accepted):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processamento iniciado. Use o jobId para consultar o progresso.",
  "totalEmpresas": 150
}
```

- Retorna imediatamente (< 1 segundo)
- Inicia processamento em background via `setImmediate()`
- Extrai `userId` do token JWT para notificações

#### `GET /api/empresas/jobs/:jobId`

Consulta o status e progresso de um job:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "generate-auto-tasks-unit",
  "status": "running",
  "progress": {
    "current": 75,
    "total": 150,
    "percentage": 50
  },
  "createdAt": "2025-11-03T10:00:00.000Z",
  "startedAt": "2025-11-03T10:00:01.000Z"
}
```

**Estados possíveis:**
- `pending`: Job criado, aguardando início
- `running`: Em processamento (mostra progresso)
- `completed`: Finalizado com sucesso (mostra resultado)
- `failed`: Falhou com erro (mostra mensagem)

### 3. Notificações ao Usuário

Quando o job termina (sucesso ou erro), uma notificação é enviada via `notificationService`:

**Sucesso:**
```json
{
  "type": "auto-tasks-generated",
  "title": "Tarefas Automáticas Geradas",
  "body": "450 tarefas automáticas foram geradas para 150 empresas da unidade.",
  "entity_type": "unit",
  "entity_id": 1
}
```

**Erro:**
```json
{
  "type": "auto-tasks-error",
  "title": "Erro ao Gerar Tarefas Automáticas",
  "body": "Ocorreu um erro ao gerar tarefas automáticas. Por favor, tente novamente."
}
```

Notificações aparecem em:
1. Toast no frontend (via Socket.IO push)
2. Bell icon com contador
3. Painel de notificações

### 4. Frontend - Polling de Status

O componente `Empresas.tsx` foi atualizado para:

1. **Iniciar job**: Chama `generateAutoTasksForUnit()` e recebe `jobId`
2. **Mostrar feedback imediato**: Toast informando que o processamento foi iniciado
3. **Polling automático**: Consulta status a cada 2 segundos via `getJobStatus(jobId)`
4. **Timeout de segurança**: Para polling após 10 minutos
5. **Atualiza UI**: Mostra resultado final quando job completa

```typescript
async function confirmGenerateAutoTasks() {
  // Iniciar job
  const jobData = await generateAutoTasksForUnit(unitId, futureYears)
  toastSuccess(`Processamento iniciado para ${jobData.totalEmpresas} empresas...`)
  
  // Polling a cada 2s
  const pollInterval = setInterval(async () => {
    const status = await getJobStatus(jobData.jobId)
    
    if (status.status === 'completed') {
      clearInterval(pollInterval)
      toastSuccess(`${status.result.createdTotal} tarefas criadas!`)
    } else if (status.status === 'failed') {
      clearInterval(pollInterval)
      toastError(status.error)
    }
  }, 2000)
}
```

## Vantagens

1. **Sem timeout**: API retorna imediatamente (202 Accepted)
2. **Feedback ao usuário**: Progresso em tempo real + notificação final
3. **Escalável**: Pode processar centenas de empresas sem problemas
4. **Resiliente**: Se frontend fechar, job continua e notificação será recebida ao reabrir
5. **Reutilizável**: `backgroundJobService` pode ser usado para outros jobs longos

## Limitações Atuais

1. **Memória volátil**: Jobs são perdidos se servidor reiniciar (poderia usar Redis)
2. **Single-process**: Não funciona em cluster multi-process (seria necessário Redis/DB)
3. **Polling**: Frontend consulta periodicamente (poderia usar WebSockets push)

## Como Estender

### Adicionar novo tipo de job:

1. **Controller**: Criar job e iniciar processamento
```typescript
const jobId = backgroundJobService.createJob('meu-novo-job', userId)
setImmediate(async () => {
  try {
    backgroundJobService.updateJobStatus(jobId, 'running')
    // ... processar ...
    backgroundJobService.setJobResult(jobId, resultado)
  } catch (error) {
    backgroundJobService.setJobError(jobId, error.message)
  }
})
res.status(202).json({ jobId })
```

2. **Frontend**: Usar mesmo padrão de polling
```typescript
const { jobId } = await minhaAPI()
// ... polling igual ao exemplo acima ...
```

## Monitoramento

Para debug/monitoramento, você pode:

1. **Ver todos os jobs ativos** (adicionar endpoint):
```typescript
router.get('/jobs', (req, res) => {
  const jobs = backgroundJobService.getAllJobs()
  res.json(jobs)
})
```

2. **Logs no servidor**: O job loga início e fim no console

## Referências

- `server/services/backgroundJobService.ts` - Serviço de jobs
- `server/controllers/CompanyController.ts` - Implementação no controller
- `src/services/companies.ts` - API client
- `src/pages/Empresas.tsx` - UI com polling
