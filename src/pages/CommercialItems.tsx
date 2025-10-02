import React from 'react'
import { fetchCommercialItems, type CommercialItem, fetchProgramPriceRules, type ProgramPriceRule, fetchProductPriceRules } from '@/services/commercialItems'
import { SiteHeader } from '@/components/layout/site-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const ITEM_TYPES = [
  { value: 'produtos', label: 'Produtos' },
  { value: 'quimicos', label: 'Químicos' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'programas', label: 'Programas' },
]

export default function CommercialItemsPage() {
  const [tipo, setTipo] = React.useState('produtos')
  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<CommercialItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const controllerRef = React.useRef<AbortController | null>(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      controllerRef.current?.abort()
      controllerRef.current = new AbortController()
      const res = await fetchCommercialItems(tipo, query || undefined)
      setItems(res.items)
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') return
      setError(e?.message || 'Erro ao carregar itens')
    } finally {
      setLoading(false)
    }
  }, [tipo, query])

  React.useEffect(() => { load() }, [load])

  const showPrice = ['produtos', 'quimicos', 'cursos', 'programas'].includes(tipo)
  const colCount = showPrice ? 3 : 2
  const formatCurrency = (v: unknown) => {
    if (v === null || v === undefined || v === '') return '—'
    const n = Number(v as any)
    if (!Number.isFinite(n)) return '—'
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  type SortField = 'nome' | 'valor_unitario'
  const [sortField, setSortField] = React.useState<SortField>('nome')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')

  const toggleSort = (field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      } else {
        setSortDir('asc')
        return field
      }
    })
  }

  const sortedItems = React.useMemo(() => {
    const arr = [...items]
    arr.sort((a, b) => {
      if (sortField === 'nome') {
        const an = (a.nome || '').toLocaleLowerCase()
        const bn = (b.nome || '').toLocaleLowerCase()
        const cmp = an.localeCompare(bn, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      }
      // valor_unitario
      const av = typeof a.valor_unitario === 'number' ? a.valor_unitario! : Number.POSITIVE_INFINITY
      const bv = typeof b.valor_unitario === 'number' ? b.valor_unitario! : Number.POSITIVE_INFINITY
      const cmp = av === bv ? 0 : (av < bv ? -1 : 1)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [items, sortField, sortDir])

  const exportCSV = () => {
    const headers = ['nome', 'tipo', ...(showPrice ? ['valor_unitario'] : [])]
    const lines = [headers.join(';')]
    sortedItems.forEach(it => {
      const row = [
        '"' + (it.nome?.replace(/"/g, '""') || '') + '"',
        it.tipo,
        ...(showPrice ? [
          typeof it.valor_unitario === 'number' ? it.valor_unitario.toString().replace('.', ',') : ''
        ] : [])
      ]
      lines.push(row.join(';'))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    a.download = `itens-${tipo}-${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Expanded row state for programs/courses
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null)
  const [rules, setRules] = React.useState<Record<string, { loading: boolean; error: string | null; data: ProgramPriceRule[] | null }>>({})

  const toggleExpand = async (it: CommercialItem) => {
    const key = `${it.tipo}-${it.id ?? it.nome}`
    if (expandedKey === key) {
      setExpandedKey(null)
      return
    }
    setExpandedKey(key)
    // Fetch rules for Programas or Produtos when expanding for the first time
    const isPrograma = it.tipo === 'programa' || it.tipo === 'programas'
    const isProduto = it.tipo === 'produto' || it.tipo === 'produtos'
    if ((isPrograma || isProduto) && !rules[key]?.data && !rules[key]?.loading) {
      setRules(prev => ({ ...prev, [key]: { loading: true, error: null, data: null } }))
      try {
        const id = typeof it.id === 'number' || typeof it.id === 'string' ? it.id : (it.raw?.id ?? it.raw?.ID)
        const data = isPrograma ? await fetchProgramPriceRules(id) : await fetchProductPriceRules(id)
        setRules(prev => ({ ...prev, [key]: { loading: false, error: null, data } }))
      } catch (e: any) {
        setRules(prev => ({ ...prev, [key]: { loading: false, error: e?.message || 'Erro ao carregar regras', data: null } }))
      }
    }
  }

  return (
    <div className="container-main px-6 py-4">
      <SiteHeader title="Itens Comerciais" />

      <div className="mt-4 grid gap-4 md:grid-cols-4 sm:grid-cols-2">
        {ITEM_TYPES.map(t => (
          <Button
            key={t.value}
            variant={t.value === tipo ? 'default' : 'outline'}
            onClick={() => setTipo(t.value)}
          >{t.label}</Button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          placeholder="Buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="secondary" onClick={() => load()} disabled={loading}>Filtrar</Button>
        <Button variant="outline" onClick={exportCSV} disabled={loading || items.length === 0}>Exportar CSV</Button>
      </div>

      <div className="mt-6 rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th
                className="text-left px-3 py-2 select-none cursor-pointer"
                onClick={() => toggleSort('nome')}
                aria-sort={sortField === 'nome' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <span className="inline-flex items-center gap-1">
                  Nome
                  {sortField === 'nome' && (
                    <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th className="text-left px-3 py-2">Tipo</th>
              {showPrice && (
                <th
                  className="text-left px-3 py-2 select-none cursor-pointer"
                  onClick={() => toggleSort('valor_unitario')}
                  aria-sort={sortField === 'valor_unitario' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className="inline-flex items-center gap-1">
                    Valor Unitário
                    {sortField === 'valor_unitario' && (
                      <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={colCount} className="px-3 py-4 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {(!loading && error) && (
              <tr><td colSpan={colCount} className="px-3 py-4 text-center text-destructive">{error}</td></tr>
            )}
            {(!loading && !error && items.length === 0) && (
              <tr><td colSpan={colCount} className="px-3 py-4 text-center text-muted-foreground">Nenhum item encontrado.</td></tr>
            )}
            {sortedItems.map(it => {
              const key = `${it.tipo}-${it.id ?? it.nome}`
              const isPrograma = it.tipo === 'programa' || it.tipo === 'programas'
              const isProduto = it.tipo === 'produto' || it.tipo === 'produtos'
              const isExpanded = expandedKey === key
              const rState = rules[key]
              return (
                <React.Fragment key={key}>
                  <tr className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        {(isPrograma || isProduto) && (
                          <Button size="sm" variant="ghost" onClick={() => toggleExpand(it)} aria-expanded={isExpanded} aria-controls={`rules-${key}`} title={isExpanded ? 'Ocultar regras' : 'Ver regras'}>
                            {isExpanded ? '−' : '+'}
                          </Button>
                        )}
                        <span>{it.nome}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{it.tipo}</td>
                    {showPrice && (
                      <td className="px-3 py-2 tabular-nums">{formatCurrency(it.valor_unitario as any)}</td>
                    )}
                  </tr>
                  {(isPrograma || isProduto) && isExpanded && (
                    <tr className="bg-muted/10" id={`rules-${key}`}>
                      <td colSpan={colCount} className="px-6 py-3">
                        {rState?.loading && <div className="text-sm text-muted-foreground">Carregando regras...</div>}
                        {rState?.error && <div className="text-sm text-destructive">{rState.error}</div>}
                        {rState?.data && rState.data.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border">
                              <thead className="bg-muted/40">
                                <tr>
                                  <th className="text-left px-2 py-1">Qtd mín</th>
                                  <th className="text-left px-2 py-1">Qtd máx</th>
                                  <th className="text-left px-2 py-1">Preço unitário</th>
                                  <th className="text-left px-2 py-1">Preço adicional</th>
                                  <th className="text-left px-2 py-1">Linear?</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rState.data.map((r, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-2 py-1 tabular-nums">{Number(r.min_quantidade)}</td>
                                    <td className="px-2 py-1 tabular-nums">{Number(r.max_quantidade)}</td>
                                    <td className="px-2 py-1 tabular-nums">{formatCurrency(r.preco_unitario)}</td>
                                    <td className="px-2 py-1 tabular-nums">{formatCurrency(r.preco_adicional)}</td>
                                    <td className="px-2 py-1">{Number(r.preco_linear) ? 'Sim' : 'Não'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {rState?.data && rState.data.length === 0 && (
                          <div className="text-sm text-muted-foreground">Sem regras cadastradas para este programa.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
