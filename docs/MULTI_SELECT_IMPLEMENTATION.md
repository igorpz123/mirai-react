# Multi-Select para Unidades e Setores - Documentação

## Resumo das Alterações

Foi implementado suporte para seleção múltipla de **Unidades** e **Setores** na criação de usuários, utilizando o componente `Select` nativo com a propriedade `multiple`.

---

## Arquivos Modificados

### Frontend

#### 1. **`src/components/ui/select.tsx`** (MODIFICADO)
O componente `Select` foi estendido para suportar seleção múltipla através da propriedade `multiple`.

**Funcionalidades adicionadas:**
- Propriedade `multiple` para habilitar seleção múltipla
- Context API para gerenciar estado de múltipla seleção
- Badges interativos mostrando itens selecionados
- Remoção individual com botão X
- Checkboxes visuais nos itens
- Labels dinâmicos (mostra o nome real ao invés do ID)

**Como usar:**
```tsx
<Select 
  multiple 
  value={selectedIds}  // string[]
  onValueChange={(values: string[]) => handleChange(values)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione múltiplos..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Item 1</SelectItem>
    <SelectItem value="2">Item 2</SelectItem>
  </SelectContent>
</Select>
```

#### 2. **`src/pages/AdminUsers.tsx`** (MODIFICADO)
Substituiu o componente `MultiSelect` customizado pelo `Select` nativo com `multiple`.

**Mudanças no estado do formulário:**
```typescript
// ANTES
{ unidadeId: 0, setorId: 0 }

// DEPOIS
{ unidadeIds: [], setorIds: [] }
```

**Implementação:**
```tsx
<Select 
  multiple 
  value={form.unidadeIds.map(String)} 
  onValueChange={(values: string[]) => 
    setForm(f => ({ ...f, unidadeIds: values.map(Number) }))
  }
>
  <SelectTrigger className='w-full'>
    <SelectValue placeholder="Selecione unidades" />
  </SelectTrigger>
  <SelectContent>
    {unidades.map(u => 
      <SelectItem key={u.id} value={String(u.id)}>
        {u.nome}
      </SelectItem>
    )}
  </SelectContent>
</Select>
```

#### 3. **`src/services/users.ts`** (MODIFICADO)
Atualização da interface `CreateUserData`:

```typescript
export interface CreateUserData {
  // ... outros campos
  unidadeIds: number[]  // MUDOU de unidadeId: number
  setorIds: number[]    // MUDOU de setorId: number
}
```

---

### Backend

#### 5. **`server/controllers/UserController.ts`** (MODIFICADO)
Função `createUser()` atualizada para processar arrays de IDs.

**Mudanças principais:**
```typescript
const { unidadeIds, setorIds } = req.body

// Inserção em lote com INSERT IGNORE para evitar duplicatas
if (Array.isArray(setorIds) && setorIds.length > 0) {
  const setorValues = setorIds.map(sid => [newId, Number(sid)])
  await pool.query(
    'INSERT IGNORE INTO usuario_setores (usuario_id, setor_id) VALUES ?', 
    [setorValues]
  )
}

if (Array.isArray(unidadeIds) && unidadeIds.length > 0) {
  const unidadeValues = unidadeIds.map(uid => [newId, Number(uid)])
  await pool.query(
    'INSERT IGNORE INTO usuario_unidades (usuario_id, unidade_id) VALUES ?', 
    [unidadeValues]
  )
}
```

---

## Dependências

Nenhuma dependência adicional foi necessária. O componente usa apenas:
- `@radix-ui/react-select` (já existente)
- `lucide-react` para ícones (já existente)
- `Badge` component (já existente)

---

## Estrutura de Banco de Dados

As tabelas `usuario_setores` e `usuario_unidades` já suportavam múltiplos vínculos:

```sql
-- Tabela de relação N:N (usuário pode ter múltiplos setores)
CREATE TABLE usuario_setores (
  usuario_id INT,
  setor_id INT,
  PRIMARY KEY (usuario_id, setor_id)
);

-- Tabela de relação N:N (usuário pode ter múltiplas unidades)
CREATE TABLE usuario_unidades (
  usuario_id INT,
  unidade_id INT,
  PRIMARY KEY (usuario_id, unidade_id)
);
```

---

## Como Usar

1. **Abrir página de Usuários:** `/admin/users`
2. **Clicar em "Novo usuário"**
3. **Selecionar múltiplas unidades/setores:**
   - Clicar no campo para abrir dropdown
   - Clicar em cada opção para selecionar/desselecionar (checkbox visual)
   - Remover seleções clicando no X do badge no campo

**Características visuais:**
- Badges com o nome real (não ID) exibidos no campo
- Checkmark ao lado de itens selecionados no dropdown
- Dropdown permanece aberto para múltiplas seleções
- Design consistente com o restante do sistema

---

## Compatibilidade Retroativa

✅ **Backend:** Continua aceitando `setorId` e `unidadeId` únicos (serão ignorados se arrays estiverem presentes)

✅ **Frontend:** Componentes antigos não foram afetados (apenas AdminUsers foi atualizado)

---

## Próximos Passos (Opcional)

- [ ] Aplicar `multiple` em outras telas de edição de usuário
- [ ] Adicionar validação de limite máximo de seleções
- [ ] Implementar "Selecionar todos" / "Limpar todos" (se necessário)
- [ ] Aplicar pattern de multiple select em outros formulários do sistema

---

## Troubleshooting

**Erro ao criar usuário no backend:**
- Verifique se `unidadeIds` e `setorIds` estão sendo enviados como arrays
- Confirme que os IDs existem nas tabelas `unidades` e `setor`

**Seleções não aparecem:**
- Verifique se `form.unidadeIds` e `form.setorIds` estão inicializados como arrays vazios `[]`
- Certifique-se de que os valores são convertidos para string no `value` prop do Select

**Badges mostram IDs ao invés de nomes:**
- O SelectItem registra automaticamente o label quando é renderizado
- Certifique-se de que os SelectItems estão dentro do SelectContent
