# 🐛 Troubleshooting: Tours Interativos

## Problemas Corrigidos

### ✅ Bug: Tour volta para o primeiro step

**Sintoma:** Ao clicar em "Próximo", o tour volta para o primeiro step ao invés de avançar.

**Causa:** As funções `action` nos botões estavam retornando valores, causando comportamento inesperado.

**Solução Aplicada:**
```typescript
// ❌ Antes (com return)
action: function() {
  return this.next()  // ← Este return causa o bug
}

// ✅ Depois (sem return)
action() {
  this.next()  // ← Apenas executa, não retorna
}
```

### ✅ Bug: Card tremendo/shaking

**Sintoma:** O tooltip do tour treme levemente durante a exibição.

**Causa:** Repaints desnecessários e falta de otimização de hardware acceleration.

**Solução Aplicada:**
```css
/* Forçar hardware acceleration */
.shepherd-element {
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  will-change: opacity, transform;
}

/* Remover will-change após animação */
.shepherd-element.shepherd-enabled {
  will-change: auto;
}

/* Estabilizar posicionamento */
.shepherd-element[data-popper-placement] {
  position: fixed !important;
}
```

### ✅ Melhoria: Race conditions

**Problema:** Tours iniciavam antes do anterior ser completamente destruído.

**Solução:**
```typescript
setTimeout(() => {
  // Criar e iniciar novo tour
  const tour = new Shepherd.Tour(...)
  tour.start()
}, 100) // Delay de 100ms previne race conditions
```

### ✅ Melhoria: Cleanup ao desmontar

**Problema:** Tours continuavam ativos após componente desmontar.

**Solução:**
```typescript
useEffect(() => {
  return () => {
    if (currentTour) {
      try {
        currentTour.complete()
      } catch (e) {
        // Ignorar erros de cleanup
      }
    }
  }
}, [currentTour])
```

## Problemas Conhecidos & Soluções

### Elemento não encontrado

**Sintoma:** Console mostra "Elemento não encontrado: [data-tour='...']"

**Diagnóstico:**
```typescript
// Verificar se elemento existe
const el = document.querySelector('[data-tour="meu-elemento"]')
console.log('Elemento encontrado?', el)
```

**Soluções:**
1. **Elemento não existe:** Adicione `data-tour="id"` no componente
2. **Elemento renderizado condicionalmente:** Aguarde render ou pule step
3. **Elemento em modal/dropdown fechado:** Abra antes de iniciar tour

### Tour não inicia

**Sintoma:** Clica no botão mas nada acontece.

**Diagnóstico:**
```typescript
// Verificar se TourProvider está no App
// Verificar console para erros
// Verificar se tourId existe em allTours
console.log('Tours disponíveis:', allTours.map(t => t.id))
```

**Soluções:**
1. Confirmar `<TourProvider>` no `main.tsx`
2. Verificar se tour está em `src/data/tours.ts`
3. Limpar cache do navegador e recarregar

### Tour trava/congela

**Sintoma:** Tour para de responder no meio.

**Diagnóstico:**
```typescript
// Abrir DevTools Console
// Procurar por erros JavaScript
// Verificar se há loops infinitos
```

**Soluções:**
1. **Botões sem action:** Todos os botões precisam de `action()`
2. **Elemento desapareceu:** Step tenta anexar a elemento que foi removido
3. **Conflito de CSS:** Verificar z-index e position

### Posicionamento incorreto

**Sintoma:** Tooltip aparece no lugar errado ou fora da tela.

**Soluções:**
```typescript
// 1. Ajustar posição do attachTo
attachTo: { 
  element: '[data-tour="elemento"]', 
  on: 'bottom'  // Experimente: top, left, right, center
}

// 2. Forçar scroll
scrollTo: { 
  behavior: 'smooth', 
  block: 'center'  // ou 'start', 'end', 'nearest'
}

// 3. Adicionar padding
modalOverlayOpeningPadding: 10  // Aumentar espaço ao redor
```

### Dark mode quebrado

**Sintoma:** Cores erradas ao trocar tema.

**Verificação:**
```css
/* CSS deve usar CSS variables do Tailwind */
.shepherd-header {
  background: hsl(var(--primary));  /* ✅ Correto */
  background: #3b82f6;              /* ❌ Hardcoded */
}
```

**Solução:** Use sempre `hsl(var(--nome-da-variavel))`

### Múltiplos tours ativos

**Sintoma:** Dois tours aparecem ao mesmo tempo.

**Causa:** Tour anterior não foi cancelado.

**Verificação:**
```typescript
// Deve ter apenas 1 tour ativo
const { currentTour } = useTour()
console.log('Tour ativo?', currentTour !== null)
```

**Solução:** TourContext já gerencia isso automaticamente agora.

## Testes Recomendados

### Checklist de Teste

```markdown
- [ ] Tour inicia corretamente
- [ ] Botão "Próximo" avança para próximo step
- [ ] Botão "Voltar" retorna ao step anterior
- [ ] Botão "Concluir" fecha tour e marca como visto
- [ ] Botão X (cancelar) fecha tour sem marcar como visto
- [ ] Esc fecha tour
- [ ] Tour não treme/vibra
- [ ] Funciona em dark mode
- [ ] Funciona em light mode
- [ ] Responsivo no mobile
- [ ] Todos os elementos são encontrados
- [ ] Não há warnings no console
```

### Script de Teste

```javascript
// Executar no Console do DevTools

// 1. Limpar tours vistos
localStorage.removeItem('mirai_tours_seen')

// 2. Verificar elementos data-tour
const elements = document.querySelectorAll('[data-tour]')
console.log(`Encontrados ${elements.length} elementos com data-tour:`)
elements.forEach(el => {
  const id = el.getAttribute('data-tour')
  console.log(`  - [data-tour="${id}"]`, el)
})

// 3. Listar tours disponíveis
// (Só funciona se você tiver acesso ao contexto React)
// const { startTour } = useTour()
// Inicie tour via UI e observe o comportamento

// 4. Monitorar eventos do tour
window.addEventListener('shepherd-tour:start', () => {
  console.log('✅ Tour iniciado')
})
window.addEventListener('shepherd-tour:complete', () => {
  console.log('✅ Tour completado')
})
window.addEventListener('shepherd-tour:cancel', () => {
  console.log('⚠️ Tour cancelado')
})
```

## Performance

### Otimizações Aplicadas

1. **Hardware Acceleration**
   - `transform: translateZ(0)` força GPU rendering
   - Reduz repaints e melhora suavidade

2. **Will-change Strategy**
   - Aplica `will-change` apenas durante animações
   - Remove após animação para economizar memória

3. **Debounce/Delay**
   - 100ms entre tours para prevenir race conditions
   - Garante cleanup completo

4. **Lazy Initialization**
   - Tours só carregam quando necessário
   - Não impacta tempo de carregamento inicial

### Métricas Esperadas

```
Tempo de início do tour: < 150ms
FPS durante animações: 60fps
Uso de memória: +2-3MB por tour ativo
Cleanup: < 50ms
```

## Debug Avançado

### Enable Shepherd Debug Mode

```typescript
// Em TourContext.tsx
const tour = new Shepherd.Tour({
  ...tourDefaultOptions,
  tourName: tourId,
  // Adicione estas opções para debug
  useModalOverlay: true,
  defaultStepOptions: {
    ...tourDefaultOptions.defaultStepOptions,
    // Log eventos
    when: {
      show() {
        console.log(`[Tour ${tourId}] Showing step:`, this.id)
      },
      hide() {
        console.log(`[Tour ${tourId}] Hiding step:`, this.id)
      }
    }
  }
})
```

### Monitorar Estado do Context

```typescript
// Adicionar logs temporários em TourContext
console.log('[TourContext] Current tour:', currentTour)
console.log('[TourContext] Seen tours:', [...seenTours])
```

## Reporte de Bugs

Se encontrar um bug não listado aqui:

1. **Console Errors:** Copie mensagens de erro completas
2. **Repro Steps:** Liste passos exatos para reproduzir
3. **Ambiente:** Browser, OS, tema ativo (dark/light)
4. **Screenshots:** Se houver problema visual
5. **Network Tab:** Verificar se há falhas de carregamento

---

✅ **Última atualização:** Novembro 2025  
🐛 **Bugs conhecidos resolvidos:** 2  
🚀 **Performance:** Otimizado
