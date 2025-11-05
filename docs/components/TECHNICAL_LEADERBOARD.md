# Technical Leaderboard Component

## 📋 Descrição

O componente `TechnicalLeaderboard` exibe um ranking de usuários baseado no número de tarefas concluídas em um período de tempo selecionável.

## ✨ Funcionalidades

- ✅ Ranking de usuários por tarefas concluídas
- ✅ Seletor de período (7 dias, 15 dias, 30 dias)
- ✅ Destaque visual para o Top 3
- ✅ Exibição de avatar, cargo e unidade
- ✅ Taxa de conclusão (% de tarefas concluídas)
- ✅ Ícones especiais para medalhas (🏆 🥈 🥉)
- ✅ Filtragem por unidade (opcional)
- ✅ Atualização automática ao mudar período

## 🚀 Uso Básico

```tsx
import { TechnicalLeaderboard } from '@/components/technical-leaderboard'

export default function MyDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <TechnicalLeaderboard />
    </div>
  )
}
```

## 📖 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `maxUsers` | `number` | `10` | Número máximo de usuários a exibir no ranking |
| `highlightTop3` | `boolean` | `true` | Se deve destacar visualmente o Top 3 |
| `unidadeId` | `number` | `undefined` | ID da unidade para filtrar o ranking (opcional) |

## 💡 Exemplos de Uso

### Exemplo 1: Leaderboard com Top 5

```tsx
<TechnicalLeaderboard maxUsers={5} />
```

### Exemplo 2: Leaderboard filtrado por unidade

```tsx
import { useUnit } from '@/contexts/UnitContext'

export default function UnitDashboard() {
  const { unitId } = useUnit()
  
  return (
    <TechnicalLeaderboard 
      unidadeId={unitId || undefined}
      maxUsers={10}
    />
  )
}
```

### Exemplo 3: Leaderboard sem destaque do Top 3

```tsx
<TechnicalLeaderboard highlightTop3={false} />
```

### Exemplo 4: Em um grid com outros componentes

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <TechnicalDashboardCards stats={stats} />
  <TechnicalLeaderboard maxUsers={5} />
</div>
```

## 🎨 Visual

O componente exibe:

- **Cabeçalho**: Título "Ranking de Produtividade" e seletor de período
- **Entradas do ranking**:
  - Posição (número ou ícone para Top 3)
  - Avatar do usuário
  - Nome completo
  - Badge "Top X" para os 3 primeiros
  - Cargo e unidade (se disponíveis)
  - Número de tarefas concluídas (destacado)
  - Porcentagem de conclusão

### Cores dos Ícones

- 🏆 **1º lugar**: Dourado (`text-yellow-500`)
- 🥈 **2º lugar**: Prata (`text-gray-400`)
- 🥉 **3º lugar**: Bronze (`text-amber-600`)

## 🔌 Backend Endpoint

O componente consome o endpoint:

```
GET /api/tarefas/leaderboard?period=7days|15days|30days&unidade_id=X
```

### Resposta do Endpoint

```json
{
  "period": "30days",
  "startDate": "2025-10-06 00:00:00",
  "leaderboard": [
    {
      "position": 1,
      "userId": 123,
      "userName": "João Silva",
      "userPhoto": "https://example.com/photo.jpg",
      "cargo": "Técnico",
      "unidade": "Matriz",
      "completedTasks": 45,
      "totalTasks": 50,
      "completionRate": 90.0
    }
  ]
}
```

## 🎯 Hook Personalizado

O componente utiliza o hook `useTasksLeaderboard`:

```tsx
import { useTasksLeaderboard } from '@/hooks/use-tasks-leaderboard'

const { data, loading, error, refetch } = useTasksLeaderboard({
  period: '30days',
  unidade_id: 1,
  autoFetch: true
})
```

## 📦 Dependências

- `@/components/ui/card`
- `@/components/ui/select`
- `@/components/ui/avatar`
- `@/components/ui/badge`
- `@tabler/icons-react`
- `@/hooks/use-tasks-leaderboard`
- `@/services/tasks`

## 🔄 Estados

O componente gerencia automaticamente:

- ✅ **Loading**: Exibe "Carregando ranking..."
- ❌ **Error**: Exibe mensagem de erro em vermelho
- 📭 **Empty**: Exibe "Nenhum dado disponível para o período selecionado"
- ✅ **Success**: Exibe o ranking com os dados

## 🎨 Customização

Para customizar o visual, você pode:

1. Modificar as classes Tailwind no componente
2. Ajustar os ícones das medalhas
3. Alterar as cores dos badges
4. Modificar o layout dos cards do ranking

## 📝 Notas

- O ranking é ordenado automaticamente pelo backend (maior número de tarefas concluídas primeiro)
- Apenas usuários com pelo menos 1 tarefa concluída aparecem no ranking
- O período é contado a partir da data de criação da tarefa (`created_at`)
- Tarefas com status "Automático" são excluídas do cálculo
