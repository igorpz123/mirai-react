# 🎓 Sistema de Tours Interativos

Sistema completo de tours guiados usando **Shepherd.js** para ajudar novos usuários a conhecer a plataforma Mirai.

## 📋 Visão Geral

O sistema de tours fornece:
- **7 tours interativos** cobrindo diferentes módulos
- **Tour automático** para novos usuários (primeira vez)
- **Controle de progresso** (tours já vistos)
- **Interface visual** premium com tema dark/light
- **Atalhos de teclado** para navegação
- **Responsivo** e acessível

## 🚀 Tours Disponíveis

### 1. **Bem-vindo ao Mirai** (`first-time`)
Tour de introdução automático para novos usuários
- Menu de navegação
- Busca global (Ctrl+K)
- Notificações em tempo real
- Menu do usuário
- Central de ajuda

### 2. **Dashboard** (`dashboard`)
- Cards de resumo
- Filtros personalizados
- Gráficos e métricas

### 3. **Tarefas** (`tasks`)
- Criar nova tarefa
- Filtros avançados
- Lista e detalhes

### 4. **Propostas** (`proposals`)
- Criar proposta
- Gerenciar status
- Exportar documentos

### 5. **Empresas** (`companies`)
- Cadastro de clientes
- Tarefas automáticas
- Gestão de documentos

### 6. **Agenda** (`agenda`)
- Visualizações (mês/semana/dia)
- Filtro de usuários
- Criar eventos

### 7. **Usuários** (`users`) - Admin
- Cadastro de usuários
- Permissões granulares
- Organização por unidades

## 📁 Estrutura de Arquivos

```
src/
├── contexts/
│   └── TourContext.tsx          # Provider e hook useTour
├── components/
│   └── tour/
│       ├── TourButton.tsx       # Botão dropdown com lista de tours
│       └── FirstTimeTour.tsx    # Inicia tour automático para novos usuários
├── data/
│   └── tours.ts                 # Definições de todos os tours
├── lib/
│   └── tourConfig.ts            # Configuração global e tipos
└── styles/
    └── tour.css                 # Estilos customizados Shepherd
```

## 🔧 Como Usar

### Para Usuários

1. **Tour Automático**
   - Ao fazer login pela primeira vez, o tour de boas-vindas inicia automaticamente após 1,5s

2. **Iniciar Tour Manual**
   - Clique no ícone de 🎓 (gorro de formatura) no header
   - Selecione o tour desejado no dropdown
   - Tours já completados aparecem com ✓ verde

3. **Resetar Tours**
   - No dropdown de tours, clique em "Resetar todos os tours"
   - Confirme a ação
   - Todos os tours ficam disponíveis novamente

### Para Desenvolvedores

#### 1. Adicionar Novo Tour

Edite `src/data/tours.ts`:

```typescript
export const meuNovoTour: TourDefinition = {
  id: 'meu-tour',
  name: 'Meu Tour',
  description: 'Descrição breve do tour',
  steps: [
    {
      id: 'step-1',
      title: 'Título do Step',
      text: 'Descrição em HTML. Use <p>, <strong>, <kbd> etc.',
      attachTo: { element: '[data-tour="elemento"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next]
    },
    {
      id: 'step-2',
      title: 'Último Step',
      text: 'Conteúdo final do tour.',
      buttons: [tourButtons.back, tourButtons.finish]
    }
  ]
}

// Adicionar ao array allTours
export const allTours: TourDefinition[] = [
  // ...tours existentes,
  meuNovoTour
]
```

#### 2. Adicionar Novo TourId

Edite `src/lib/tourConfig.ts`:

```typescript
export type TourId = 
  | 'dashboard'
  | 'tasks'
  // ...existentes
  | 'meu-tour'  // Adicione aqui
```

#### 3. Marcar Elementos da UI

Adicione `data-tour="identificador"` nos elementos:

```tsx
<Button data-tour="novo-botao">
  Clique aqui
</Button>

<div data-tour="meu-container">
  Conteúdo...
</div>
```

#### 4. Iniciar Tour Programaticamente

```typescript
import { useTour } from '@/contexts/TourContext'

function MeuComponente() {
  const { startTour } = useTour()

  return (
    <Button onClick={() => startTour('meu-tour')}>
      Iniciar Tour
    </Button>
  )
}
```

#### 5. Verificar se Usuário Viu Tour

```typescript
import { useTour } from '@/contexts/TourContext'

function MeuComponente() {
  const { hasSeenTour } = useTour()

  if (!hasSeenTour('dashboard')) {
    // Mostrar dica ou sugestão
  }
}
```

## 🎨 Customização Visual

### CSS Personalizado

Edite `src/styles/tour.css` para ajustar cores, fontes e animações:

```css
/* Header do step */
.shepherd-header {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
}

/* Botões primários */
.shepherd-button-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Configuração Global

Edite `src/lib/tourConfig.ts`:

```typescript
export const tourDefaultOptions = {
  useModalOverlay: true,  // Escurece fundo
  defaultStepOptions: {
    classes: 'shepherd-theme-custom',
    scrollTo: { behavior: 'smooth', block: 'center' },
    cancelIcon: { enabled: true }  // X para fechar
  }
}
```

## 🔄 Fluxo de Dados

```
1. Usuário faz login
   ↓
2. FirstTimeTour verifica localStorage
   ↓
3. Se nunca viu 'first-time', aguarda 1.5s
   ↓
4. TourContext.startTour('first-time')
   ↓
5. Shepherd.js cria instância do tour
   ↓
6. Usuário completa ou cancela
   ↓
7. TourContext.markTourAsSeen('first-time')
   ↓
8. localStorage salvo: ['first-time']
```

## 📊 Storage

Tours vistos são salvos no **localStorage**:

```javascript
localStorage.getItem('mirai_tours_seen')
// Retorna: ["first-time", "dashboard", "tasks"]
```

Para limpar manualmente:
```javascript
localStorage.removeItem('mirai_tours_seen')
```

## 🎯 Posicionamento de Steps

Opções para `attachTo.on`:

- `top` - Acima do elemento
- `bottom` - Abaixo do elemento
- `left` - À esquerda
- `right` - À direita
- `center` - Centralizado (sem seta)

```typescript
{
  attachTo: { 
    element: '[data-tour="botao"]', 
    on: 'bottom'  // Tooltip aparece abaixo
  }
}
```

## ⌨️ Atalhos de Teclado

Durante um tour ativo:

- `Esc` - Cancelar tour
- `Enter` - Próximo step (se houver botão next)
- `Tab` - Navegar entre botões

## 🧪 Testando Tours

1. **Limpe o localStorage:**
   ```javascript
   localStorage.removeItem('mirai_tours_seen')
   ```

2. **Recarregue a página**

3. **Tour de primeira vez deve iniciar automaticamente**

4. **Teste navegação:**
   - Clique nos botões
   - Teste Esc para cancelar
   - Verifique posicionamento das tooltips

5. **Verifique tours já vistos:**
   - No dropdown, tours completados têm ✓ verde
   - Ícones cinzas para não vistos

## 🐛 Troubleshooting

### Tour não aparece?

1. **Elemento não encontrado:**
   - Verifique se `data-tour="id"` existe no HTML
   - Abra DevTools → Console → procure por warnings

2. **Elemento oculto:**
   - Tours não funcionam em elementos `display: none`
   - Use `visibility: hidden` se precisar ocultar temporariamente

3. **Tour não inicia automaticamente:**
   - Verifique se `FirstTimeTour` está no `App.tsx`
   - Confirme que está dentro do `TourProvider`
   - Check localStorage: deve estar limpo na primeira vez

### Estilos quebrados?

1. **CSS não carregado:**
   - Confirme import em `main.tsx`: `import './styles/tour.css'`
   - Verifique também: `import 'shepherd.js/dist/css/shepherd.css'`

2. **Tema dark/light:**
   - Tours usam CSS vars do Tailwind (`hsl(var(--primary))`)
   - Troca automática ao mudar tema

## 🚀 Performance

- **Lazy loading:** Tours só carregam quando necessário
- **Memoização:** Context usa `useCallback` para evitar re-renders
- **Cleanup:** Instâncias Shepherd são destruídas após uso
- **Storage:** localStorage é leve (apenas array de IDs)

## 📚 Recursos Adicionais

- **Documentação Shepherd.js:** https://shepherdjs.dev/
- **Exemplos:** https://shepherdjs.dev/docs/examples/

## 🎉 Conclusão

Sistema totalmente funcional e pronto para uso! Novos usuários terão uma experiência guiada desde o primeiro acesso.

**Próximos passos sugeridos:**
- [ ] Adicionar analytics para tracking de tour completion
- [ ] A/B test de diferentes textos/flows
- [ ] Criar tours contextuais (baseados em ações específicas)
- [ ] Adicionar vídeos ou GIFs nos steps

---

✨ **Desenvolvido com Shepherd.js + React + TypeScript**
