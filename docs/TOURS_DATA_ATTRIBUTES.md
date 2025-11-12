# 📝 Guia: Adicionando data-tour em Componentes

Este guia mostra como adicionar atributos `data-tour` em componentes existentes para que os tours possam identificá-los.

## 🎯 Conceito

O atributo `data-tour` é um identificador único que permite que os tours do Shepherd.js encontrem e destaquem elementos específicos da interface.

## ✅ Exemplos Práticos

### 1. Botões de Ação

```tsx
// ❌ Antes
<Button onClick={handleNewTask}>
  Nova Tarefa
</Button>

// ✅ Depois
<Button onClick={handleNewTask} data-tour="new-task">
  Nova Tarefa
</Button>
```

### 2. Containers/Cards

```tsx
// ❌ Antes
<div className="stats-cards">
  {/* conteúdo */}
</div>

// ✅ Depois
<div className="stats-cards" data-tour="stats-cards">
  {/* conteúdo */}
</div>
```

### 3. Filtros

```tsx
// ❌ Antes
<div className="filters">
  <Select>...</Select>
  <DatePicker>...</DatePicker>
</div>

// ✅ Depois
<div className="filters" data-tour="dashboard-filters">
  <Select>...</Select>
  <DatePicker>...</DatePicker>
</div>
```

### 4. Listas

```tsx
// ❌ Antes
<ul className="task-list">
  {tasks.map(task => (
    <li key={task.id}>{task.title}</li>
  ))}
</ul>

// ✅ Depois
<ul className="task-list" data-tour="tasks-list">
  {tasks.map(task => (
    <li key={task.id}>{task.title}</li>
  ))}
</ul>
```

### 5. Gráficos

```tsx
// ❌ Antes
<div className="charts-container">
  <LineChart data={chartData} />
</div>

// ✅ Depois
<div className="charts-container" data-tour="dashboard-charts">
  <LineChart data={chartData} />
</div>
```

### 6. Dropdowns/Menus

```tsx
// ❌ Antes
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Opções</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* items */}
  </DropdownMenuContent>
</DropdownMenu>

// ✅ Depois
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button data-tour="export-proposal">Opções</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* items */}
  </DropdownMenuContent>
</DropdownMenu>
```

## 🏷️ Convenções de Nomenclatura

### Padrões Recomendados

```typescript
// Ações principais
data-tour="new-[entidade]"          // new-task, new-proposal, new-company
data-tour="edit-[entidade]"         // edit-task, edit-user
data-tour="delete-[entidade]"       // delete-proposal

// Visualizações
data-tour="[página]-list"           // tasks-list, users-list
data-tour="[página]-cards"          // dashboard-cards
data-tour="[página]-filters"        // tasks-filters, proposals-filters
data-tour="[página]-charts"         // dashboard-charts

// Navegação
data-tour="sidebar"
data-tour="search"
data-tour="notifications"
data-tour="user-menu"
data-tour="help-button"

// Formulários
data-tour="[form]-submit"           // proposal-submit
data-tour="[form]-cancel"           // task-cancel
data-tour="[form]-field-[nome]"     // task-field-title
```

### ❌ Evite

```tsx
// Nomes genéricos
data-tour="button"
data-tour="div"
data-tour="container"

// Nomes muito longos
data-tour="commercial-proposal-creation-form-submit-button"

// Espaços ou caracteres especiais
data-tour="new task"
data-tour="export/proposal"
```

### ✅ Prefira

```tsx
// Nomes descritivos e concisos
data-tour="new-task"
data-tour="proposal-form"
data-tour="export-btn"

// Kebab-case (palavras separadas por hífen)
data-tour="user-settings"
data-tour="task-priority"
data-tour="calendar-view"
```

## 🎯 Onde Adicionar

### Prioridade Alta (Essencial)

Elementos que aparecem em tours existentes:

```tsx
// Dashboard
data-tour="stats-cards"
data-tour="dashboard-filters"
data-tour="dashboard-charts"

// Tarefas
data-tour="new-task"
data-tour="tasks-filters"
data-tour="tasks-list"

// Propostas
data-tour="new-proposal"
data-tour="proposals-status"
data-tour="export-proposal"

// Empresas
data-tour="new-company"
data-tour="auto-tasks"
data-tour="documents"

// Agenda
data-tour="agenda-views"
data-tour="agenda-users"
data-tour="calendar"

// Admin
data-tour="new-user"
data-tour="permissions"
data-tour="units"
```

### Prioridade Média (Recomendado)

Elementos que podem ser úteis em futuros tours:

- Botões de submissão de formulários
- Campos importantes de formulários
- Abas/tabs de navegação
- Modais principais
- Tooltips informativos

### Prioridade Baixa (Opcional)

- Elementos decorativos
- Textos estáticos
- Rodapés
- Elementos secundários

## 🔄 Fluxo de Trabalho

### 1. Planeje o Tour

Antes de adicionar `data-tour`, defina:
- Qual história você quer contar?
- Quais elementos são críticos?
- Em que ordem devem aparecer?

### 2. Adicione os Atributos

```tsx
// Componente: TasksPage.tsx
export function TasksPage() {
  return (
    <div>
      <Button data-tour="new-task" onClick={handleNew}>
        Nova Tarefa
      </Button>
      
      <div data-tour="tasks-filters">
        <TaskFilters />
      </div>
      
      <div data-tour="tasks-list">
        <TaskList tasks={tasks} />
      </div>
    </div>
  )
}
```

### 3. Crie o Tour

Em `src/data/tours.ts`:

```typescript
export const tasksTour: TourDefinition = {
  id: 'tasks',
  name: 'Tour de Tarefas',
  description: 'Aprenda a gerenciar tarefas',
  steps: [
    {
      id: 'new-task',
      title: 'Criar Tarefa',
      text: 'Clique aqui para criar uma nova tarefa.',
      attachTo: { element: '[data-tour="new-task"]', on: 'bottom' },
      buttons: [tourButtons.next]
    },
    {
      id: 'filters',
      title: 'Filtros',
      text: 'Use os filtros para encontrar tarefas específicas.',
      attachTo: { element: '[data-tour="tasks-filters"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'list',
      title: 'Lista',
      text: 'Aqui você vê todas as tarefas.',
      attachTo: { element: '[data-tour="tasks-list"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}
```

### 4. Teste

```typescript
// Abra DevTools Console
document.querySelectorAll('[data-tour]').forEach(el => {
  console.log(el.getAttribute('data-tour'), el)
})
```

## 🐛 Troubleshooting

### Elemento não encontrado

**Problema:** Tour não destaca o elemento

**Solução:**
```typescript
// 1. Verifique se o atributo existe
<Button data-tour="meu-botao">Clique</Button>

// 2. Verifique o seletor no tour
attachTo: { element: '[data-tour="meu-botao"]', on: 'bottom' }

// 3. Confirme que o elemento está visível (não display: none)
```

### Elemento renderizado condicionalmente

**Problema:** Elemento só existe em certos estados

**Solução:**
```typescript
// Use `when.show` para verificar existência
{
  id: 'conditional-step',
  title: 'Step Condicional',
  text: 'Este elemento pode não existir',
  attachTo: { element: '[data-tour="maybe-exists"]', on: 'bottom' },
  when: {
    show: function() {
      const el = document.querySelector('[data-tour="maybe-exists"]')
      if (!el) {
        console.warn('Elemento não encontrado, pulando step')
        this.next()
      }
    }
  },
  buttons: [tourButtons.next]
}
```

### Múltiplos elementos com mesmo data-tour

**Problema:** Vários elementos com mesmo ID

**Solução:**
```typescript
// ❌ Evite duplicatas
{tasks.map(task => (
  <div key={task.id} data-tour="task-item">
    {task.title}
  </div>
))}

// ✅ Use IDs únicos ou marque apenas o container
<div data-tour="tasks-list">
  {tasks.map(task => (
    <div key={task.id}>{task.title}</div>
  ))}
</div>
```

## 📚 Recursos

- **Documentação Shepherd:** https://shepherdjs.dev/docs/Step.html
- **Seletores CSS:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- **Data Attributes:** https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes

## ✅ Checklist

Antes de criar um novo tour:

- [ ] Todos os elementos têm `data-tour` único
- [ ] Nomes seguem convenção kebab-case
- [ ] Elementos estão sempre visíveis (ou tratados condicionalmente)
- [ ] Testado em dark/light mode
- [ ] Testado em mobile/desktop
- [ ] Tour está documentado em `docs/TOURS.md`

---

**Dica Final:** Comece simples! Adicione tours básicos primeiro e itere baseado no feedback dos usuários. 🚀
