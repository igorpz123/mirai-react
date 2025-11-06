// src/components/GlobalSearch.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Clock, FileText, Building2, User, Briefcase } from 'lucide-react'
import { searchGlobal, getSearchHistory, addToSearchHistory, clearSearchHistory, type SearchResult } from '@/services/search'
import { cn } from '@/lib/utils'
import { useUnit } from '@/contexts/UnitContext'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const { unitId } = useUnit()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [categories, setCategories] = useState({ tasks: 0, proposals: 0, companies: 0, users: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Carregar histórico ao abrir
  useEffect(() => {
    if (open) {
      setSearchHistory(getSearchHistory())
      // Foco no input
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Resetar ao fechar
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Busca com debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setCategories({ tasks: 0, proposals: 0, companies: 0, users: 0 })
      return
    }

    setIsLoading(true)
    try {
      const response = await searchGlobal(searchQuery, { 
        limit: 30,
        unitId: unitId || undefined
      })
      setResults(response.results)
      setCategories(response.categories)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [unitId])

  // Handler de mudança no input com debounce
  const handleQueryChange = (value: string) => {
    setQuery(value)
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Navegar para resultado
  const navigateToResult = (result: SearchResult) => {
    addToSearchHistory(query)
    setSearchHistory(getSearchHistory())
    navigate(result.url)
    onOpenChange(false)
  }

  // Usar item do histórico
  const useHistoryItem = (historyQuery: string) => {
    setQuery(historyQuery)
    performSearch(historyQuery)
  }

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        navigateToResult(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex])

  // Ícone por tipo
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return <FileText className="h-4 w-4" />
      case 'proposal':
        return <Briefcase className="h-4 w-4" />
      case 'company':
        return <Building2 className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
    }
  }

  // Label por tipo
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return 'Tarefa'
      case 'proposal':
        return 'Proposta'
      case 'company':
        return 'Empresa'
      case 'user':
        return 'Usuário'
    }
  }

  // Badge de categoria
  const CategoryBadge = ({ type, count }: { type: string; count: number }) => {
    if (count === 0) return null
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
        {type}: {count}
      </span>
    )
  }

  // Formatar status para exibição
  const formatStatus = (status: string): string => {
    const statusLower = status.toLowerCase()
    
    // Mapeamento de status para português
    if (statusLower === 'progress' || statusLower === 'in progress') {
      return 'Em Andamento'
    }
    if (statusLower === 'pending' || statusLower === 'pendente') {
      return 'Pendente'
    }
    if (statusLower === 'completed' || statusLower === 'concluída' || statusLower === 'concluído') {
      return 'Concluída'
    }
    if (statusLower === 'canceled' || statusLower === 'cancelled' || statusLower === 'cancelada' || statusLower === 'cancelado') {
      return 'Cancelada'
    }
    
    // Retorna o status original se não encontrar mapeamento
    return status
  }

  // Badge de status
  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null
    
    const statusLower = status.toLowerCase()
    let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    
    if (statusLower.includes('concluí') || statusLower.includes('finaliz') || statusLower.includes('completed')) {
      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    } else if (statusLower.includes('pendent') || statusLower.includes('atras') || statusLower.includes('pending')) {
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    } else if (statusLower.includes('andamento') || statusLower.includes('progress')) {
      colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    } else if (statusLower.includes('cancel')) {
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
        {formatStatus(status)}
      </span>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Busca Global</DialogTitle>
        <DialogDescription className="sr-only">
          Busque por tarefas, propostas, empresas e usuários
        </DialogDescription>

        {/* Input de busca */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar tarefas, propostas, empresas, usuários..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        {/* Badges de categorias */}
        {query.length >= 2 && (categories.tasks + categories.proposals + categories.companies + categories.users) > 0 && (
          <div className="flex gap-2 px-4 py-2 border-b bg-muted/50">
            <CategoryBadge type="Tarefas" count={categories.tasks} />
            <CategoryBadge type="Propostas" count={categories.proposals} />
            <CategoryBadge type="Empresas" count={categories.companies} />
            <CategoryBadge type="Usuários" count={categories.users} />
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {/* Comandos rápidos - mostrar quando não há número na query */}
          {(() => {
            const hasNumber = /\d/.test(query)
            const q = query.toLowerCase()
            const showNewTask = !hasNumber && (q.length === 0 || q.includes('nova') || q.includes('criar') || q.includes('tarefa'))
            const showNewProposal = !hasNumber && (q.length === 0 || q.includes('nova') || q.includes('criar') || q.includes('proposta'))
            // const showNewEvent = !hasNumber && (q.length === 0 || q.includes('novo') || q.includes('criar') || q.includes('evento') || q.includes('agenda'))
            const showAnyCommand = showNewTask || showNewProposal // || showNewEvent

            return showAnyCommand ? (
              <div className="p-2">
                <div className="px-2 py-1 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Ações Rápidas</span>
                </div>
                {showNewTask && (
                  <button
                    onClick={() => {
                      navigate('/nova-tarefa')
                      onOpenChange(false)
                    }}
                    className="flex items-center w-full px-3 py-2 rounded hover:bg-accent text-left text-sm"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground mr-3" />
                    <div>
                      <div className="font-medium">Nova Tarefa</div>
                      <div className="text-xs text-muted-foreground">Criar uma nova tarefa</div>
                    </div>
                  </button>
                )}
                {showNewProposal && (
                  <button
                    onClick={() => {
                      navigate('/comercial/proposta/nova')
                      onOpenChange(false)
                    }}
                    className="flex items-center w-full px-3 py-2 rounded hover:bg-accent text-left text-sm"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground mr-3" />
                    <div>
                      <div className="font-medium">Nova Proposta</div>
                      <div className="text-xs text-muted-foreground">Criar uma proposta comercial</div>
                    </div>
                  </button>
                )}
                {/* {showNewEvent && (
                  <button
                    onClick={() => {
                      navigate('/technical/agenda')
                      onOpenChange(false)
                    }}
                    className="flex items-center w-full px-3 py-2 rounded hover:bg-accent text-left text-sm"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground mr-3" />
                    <div>
                      <div className="font-medium">Novo Evento</div>
                      <div className="text-xs text-muted-foreground">Adicionar evento na agenda</div>
                    </div>
                  </button>
                )} */}
              </div>
            ) : null
          })()}

          {/* Histórico de buscas */}
          {query.length === 0 && searchHistory.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Buscas recentes</span>
                <button
                  onClick={() => {
                    clearSearchHistory()
                    setSearchHistory([])
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => useHistoryItem(historyQuery)}
                  className="flex items-center w-full px-2 py-2 rounded hover:bg-accent text-left text-sm"
                >
                  <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                  <span>{historyQuery}</span>
                </button>
              ))}
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigateToResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-start w-full px-3 py-3 rounded text-left transition-colors',
                    'hover:bg-accent',
                    selectedIndex === index && 'bg-accent'
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5 text-muted-foreground mr-3">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.type === 'task' && result.metadata?.status && (
                        <StatusBadge status={result.metadata.status} />
                      )}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground mb-1 truncate">
                        {result.subtitle}
                      </div>
                    )}
                    {result.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Estado vazio */}
          {query.length >= 2 && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}

          {/* Instruções iniciais */}
          {query.length === 0 && searchHistory.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-2">Digite para buscar</p>
              <p className="text-xs">Tarefas, propostas, empresas e usuários</p>
            </div>
          )}
        </div>

        {/* Footer com atalhos */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/50">
          <div className="flex gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs ml-1">↓</kbd>
              {' '}navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Enter</kbd>
              {' '}selecionar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Esc</kbd>
              {' '}fechar
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
