# 🔍 Sistema de Busca Global - Mirai React

## Visão Geral

Sistema completo de busca global que permite buscar rapidamente em **tarefas, propostas, empresas e usuários** usando atalho de teclado **Ctrl+K** (ou **⌘K** no Mac).

---

## 🎯 Funcionalidades

### ✨ Busca Inteligente
- **Busca em múltiplas entidades**: Tarefas, propostas, empresas e usuários
- **Ranking de relevância**: Resultados ordenados por importância
- **Busca em campos múltiplos**: Título, descrição, CNPJ, nome, email, etc.
- **Debounce automático**: Aguarda 300ms após parar de digitar para buscar

### ⌨️ Atalhos de Teclado
- **Ctrl+K** / **⌘K**: Abrir/fechar busca
- **↑ / ↓**: Navegar entre resultados
- **Enter**: Selecionar resultado
- **Esc**: Fechar busca

### 📊 Interface
- **Busca visual agrupada**: Resultados separados por tipo
- **Badges de contagem**: Mostra quantos resultados de cada tipo
- **Histórico de buscas**: Últimas 10 buscas salvas
- **Sugestões visuais**: Ícones diferentes para cada tipo de resultado
- **Metadata**: Informações extras (status, responsável, etc.)

---

## 🏗️ Arquitetura

### Backend

#### 1. **SearchService** (`server/services/searchService.ts`)
Serviço principal que realiza buscas em múltiplas tabelas:

```typescript
interface SearchResult {
  id: number | string
  type: 'task' | 'proposal' | 'company' | 'user'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  relevance: number  // 0-200, quanto maior mais relevante
  url: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  categories: {
    tasks: number
    proposals: number
    companies: number
    users: number
  }
}
```

**Cálculo de Relevância:**
- Match no título: +100
- Título começa com query: +50
- Match na descrição: +30
- Match em campos secundários: +20-40
- Status "Pendente" (tarefas): +10 boost
- Status "Aprovado" (propostas): +15 boost

#### 2. **SearchController** (`server/controllers/SearchController.ts`)
Endpoints REST:

```typescript
GET /api/search/global?q=termo&limit=20&offset=0&types=task,company
GET /api/search/recent  // Histórico do usuário (futuro)
```

#### 3. **Rotas** (`server/routes/search.ts`)
Todas as rotas requerem autenticação (JWT).

**Permissões:**
- Qualquer usuário autenticado pode buscar tarefas e empresas
- Apenas admins veem todos os usuários
- Usuários comuns veem apenas colegas da mesma unidade

---

### Frontend

#### 1. **GlobalSearch Component** (`src/components/GlobalSearch.tsx`)
Dialog modal principal com:
- Input de busca com debounce
- Lista de resultados com navegação por teclado
- Histórico de buscas recentes
- Badges de categorias
- Footer com atalhos

#### 2. **Hook useGlobalSearch** (`src/hooks/use-global-search.ts`)
Gerencia estado e atalho global Ctrl+K:

```typescript
const { isOpen, setIsOpen, open, close, toggle } = useGlobalSearch()
```

#### 3. **Search Service** (`src/services/search.ts`)
Client-side API com:
- `searchGlobal()`: Busca principal
- `getRecentItems()`: Itens recentes
- `getSearchHistory()`: Histórico local (localStorage)
- `addToSearchHistory()`: Adicionar ao histórico
- `clearSearchHistory()`: Limpar histórico

---

## 🚀 Como Usar

### Para Usuários

1. **Abrir busca**: Pressione `Ctrl+K` (ou clique no botão na sidebar)
2. **Digite**: Comece a digitar o termo de busca
3. **Navegue**: Use setas ↑/↓ ou mouse para selecionar
4. **Selecione**: Pressione Enter ou clique para abrir

### Para Desenvolvedores

#### Adicionar busca em nova entidade:

**1. Backend** - Adicionar função em `searchService.ts`:
```typescript
async function searchMinhaEntidade(query: string, userId: number): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM minha_tabela WHERE campo LIKE ? LIMIT 50`,
    [searchPattern]
  )

  return rows.map(row => ({
    id: row.id,
    type: 'minha-entidade' as const,
    title: row.titulo,
    subtitle: row.subtitulo,
    relevance: 100, // Calcular baseado em critérios
    url: `/minha-entidade/${row.id}`
  }))
}
```

**2. Adicionar no `globalSearch()`**:
```typescript
if (searchTypes.includes('minha-entidade')) {
  const results = await searchMinhaEntidade(sanitizedQuery, userId)
  results.push(...results)
  counts.minhaEntidade = results.length
}
```

**3. Frontend** - Atualizar tipos em `src/services/search.ts`:
```typescript
export type SearchResultType = 'task' | 'proposal' | 'company' | 'user' | 'minha-entidade'
```

**4. Adicionar ícone em `GlobalSearch.tsx`**:
```typescript
const getTypeIcon = (type: SearchResult['type']) => {
  // ... casos existentes
  case 'minha-entidade':
    return <MeuIcone className="h-4 w-4" />
}
```

---

## 📊 Performance

### Otimizações Implementadas

1. **Debounce de 300ms**: Reduz requisições ao backend
2. **LIMIT nas queries**: Máximo 50 resultados por tabela
3. **Busca em paralelo**: Todas as tabelas consultadas simultaneamente
4. **Cache de histórico**: localStorage evita round-trips
5. **Lazy loading**: Modal só renderiza quando aberto

### Índices Recomendados (MySQL)

```sql
-- Tarefas
CREATE INDEX idx_tarefas_search ON tarefas(titulo, descricao);

-- Propostas
CREATE INDEX idx_propostas_search ON propostas(nome_cliente, cnpj);

-- Empresas
CREATE INDEX idx_empresas_search ON empresas(nome, cnpj, razao_social);

-- Usuários
CREATE INDEX idx_usuarios_search ON usuarios(nome, sobrenome, email);
```

### Benchmark Esperado
- Query simples (1-2 palavras): ~50-200ms
- Query complexa (3+ palavras): ~200-500ms
- Primeira busca (cold): ~500ms
- Buscas subsequentes: ~100-300ms

---

## 🎨 Customização

### Alterar Limite de Resultados

**Backend:**
```typescript
// server/controllers/SearchController.ts
const limit = parseInt(req.query.limit as string) || 50  // Alterar aqui
```

**Frontend:**
```typescript
// src/components/GlobalSearch.tsx
const response = await searchGlobal(searchQuery, { limit: 50 })  // Alterar aqui
```

### Alterar Histórico Máximo

```typescript
// src/services/search.ts
const MAX_HISTORY_ITEMS = 20  // Padrão: 10
```

### Alterar Debounce

```typescript
// src/components/GlobalSearch.tsx
searchTimeoutRef.current = setTimeout(() => {
  performSearch(value)
}, 500)  // Padrão: 300ms
```

---

## 🔒 Segurança

### Proteções Implementadas

1. **Autenticação obrigatória**: Todas as rotas requerem JWT
2. **Sanitização de input**: Remove caracteres de controle
3. **SQL injection**: Queries parametrizadas (`?` placeholders)
4. **Permissões**: Usuários só veem dados de suas unidades
5. **Rate limiting**: Herda do rate limiter global (se configurado)

### Campos Sensíveis

Atualmente não retorna:
- Senhas (óbvio)
- Tokens
- Dados financeiros detalhados
- Anexos privados

Para adicionar campos sensíveis, adicione verificação de permissão:
```typescript
const isAdmin = await permissionService.isAdmin(userId)
if (!isAdmin) {
  // Remover campos sensíveis
  delete result.metadata.campoSensivel
}
```

---

## 🐛 Troubleshooting

### Busca não retorna resultados

1. Verifique se o termo tem pelo menos 2 caracteres
2. Confira se há dados no banco para aquele termo
3. Verifique permissões do usuário (unidades/setores)
4. Olhe o console do browser e do servidor

### Atalho Ctrl+K não funciona

1. Verifique se outro componente/extensão captura o atalho
2. Confirme que `useGlobalSearch()` está no `Layout`
3. Tente usar o botão visual na sidebar

### Performance lenta

1. Adicione os índices MySQL recomendados
2. Reduza limite de resultados
3. Otimize queries com `EXPLAIN`
4. Considere cache no backend (Redis)

### Histórico não salva

1. Verifique localStorage do browser (pode estar cheio)
2. Confirme que não está em modo anônimo
3. Limpe cache e tente novamente

---

## 📈 Melhorias Futuras

### Curto Prazo (1-2 semanas)
- [ ] Busca por filtros (data, status, responsável)
- [ ] Preview de resultados (popup com mais detalhes)
- [ ] Busca fonética (typos, acentos)
- [ ] Salvar buscas favoritas

### Médio Prazo (1 mês)
- [ ] Full-text search (MySQL FULLTEXT ou Elasticsearch)
- [ ] Busca em anexos (OCR de PDFs/imagens)
- [ ] Sugestões autocomplete
- [ ] Analytics de buscas (termos mais buscados)

### Longo Prazo (3+ meses)
- [ ] IA para entender intenção de busca
- [ ] Busca por voz
- [ ] Busca federada (múltiplos sistemas)
- [ ] Cache distribuído (Redis)

---

## 📚 Arquivos Criados/Modificados

### Backend
- ✅ `server/services/searchService.ts` - Serviço de busca
- ✅ `server/controllers/SearchController.ts` - Controller HTTP
- ✅ `server/routes/search.ts` - Rotas da API
- ✅ `server/routes/router.ts` - Adicionado rota `/search`

### Frontend
- ✅ `src/components/GlobalSearch.tsx` - Componente principal
- ✅ `src/hooks/use-global-search.ts` - Hook de estado
- ✅ `src/services/search.ts` - Client API
- ✅ `src/components/layout/Layout.tsx` - Integração do dialog
- ✅ `src/components/layout/app-sidebar.tsx` - Botão de busca

### Documentação
- ✅ `docs/GLOBAL_SEARCH.md` - Este arquivo

---

## 🎓 Exemplos de Uso

### Buscar tarefa por título
```
Digite: "renovação licença"
Resultado: Tarefas com "renovação" e "licença" no título/descrição
```

### Buscar empresa por CNPJ
```
Digite: "12345678000190"
Resultado: Empresa com aquele CNPJ
```

### Buscar usuário por nome
```
Digite: "joão silva"
Resultado: Usuários com nome/sobrenome "joão" ou "silva"
```

### Buscar proposta por cliente
```
Digite: "acme corp"
Resultado: Propostas com cliente "acme corp"
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os comentários no código
3. Verifique logs do servidor (console)
4. Entre em contato com a equipe de desenvolvimento

---

**Data de Implementação:** 03/11/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso

---

## 🏆 Créditos

Desenvolvido com ❤️ para o sistema Mirai React.
