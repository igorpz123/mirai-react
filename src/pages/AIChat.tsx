// src/pages/AIChat.tsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { IconSend, IconTrash, IconSparkles, IconLoader2, IconAlertCircle } from '@tabler/icons-react'
import { toastError, toastWarning } from '@/lib/customToast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'model'
  text: string
  timestamp: string
  cached?: boolean
}

export default function AIChat() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number; resetAt?: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focar no input ao carregar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Processar headers de rate limit
  const updateRateLimitInfo = (headers: Headers) => {
    const limit = headers.get('X-RateLimit-Limit')
    const remaining = headers.get('X-RateLimit-Remaining')
    const resetAt = headers.get('X-RateLimit-Reset')
    
    if (limit && remaining) {
      setRateLimitInfo({
        limit: Number(limit),
        remaining: Number(remaining),
        resetAt: resetAt || undefined
      })
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Preparar histórico para API (converter para formato esperado)
      const history = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.text,
          history
        })
      })

      // Atualizar info de rate limit
      updateRateLimitInfo(response.headers)

      if (!response.ok) {
        const error = await response.json()
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          toastWarning(`Taxa de requisições excedida. Tente novamente em ${retryAfter || '60'} segundos.`)
        } else {
          toastError(error.message || 'Erro ao enviar mensagem')
        }
        
        // Remover mensagem do usuário se falhou
        setMessages(prev => prev.slice(0, -1))
        setInput(userMessage.text) // Restaurar input
        return
      }

      const data = await response.json()

      const aiMessage: Message = {
        role: 'model',
        text: data.reply,
        timestamp: data.timestamp,
        cached: data.cached
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      toastError('Erro de conexão. Verifique sua internet.')
      
      // Remover mensagem do usuário se falhou
      setMessages(prev => prev.slice(0, -1))
      setInput(userMessage.text) // Restaurar input
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    if (messages.length === 0) return
    if (confirm('Deseja limpar todo o histórico de conversa?')) {
      setMessages([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <IconSparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Assistente IA</h1>
            <p className="text-sm text-muted-foreground">Powered by Google Gemini Flash</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {rateLimitInfo && (
            <div className="text-sm text-muted-foreground">
              <span className={rateLimitInfo.remaining < 10 ? 'text-amber-500 font-medium' : ''}>
                {rateLimitInfo.remaining}/{rateLimitInfo.limit} requisições
              </span>
            </div>
          )}
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <IconTrash className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <IconSparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Como posso ajudar?</h2>
            <p className="text-muted-foreground max-w-md">
              Faça perguntas, peça sugestões ou solicite análises. Estou aqui para ajudar!
            </p>
            
            {/* Sugestões de prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl w-full">
              {[
                'Me ajude a escrever um e-mail profissional',
                'Explique um conceito técnico de forma simples',
                'Sugira melhorias para meu texto',
                'Analise dados e forneça insights'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-3 text-sm text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:mt-3 prose-headings:mb-2
                    prose-p:my-1
                    prose-ul:my-2 prose-ol:my-2
                    prose-li:my-0
                    prose-pre:bg-background/50 prose-pre:text-foreground
                    prose-code:text-foreground prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-strong:font-bold prose-strong:text-foreground
                    prose-em:italic
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <span>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.cached && (
                    <span className="flex items-center gap-1 text-green-500">
                      <IconSparkles className="w-3 h-3" />
                      Cache
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground flex items-center gap-2">
              <IconLoader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {rateLimitInfo && rateLimitInfo.remaining < 10 && (
            <div className="mb-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg">
              <IconAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Você tem apenas {rateLimitInfo.remaining} requisições restantes neste minuto.
              </span>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                disabled={loading}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  minHeight: '52px',
                  maxHeight: '200px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = '52px'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
              />
              <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {input.length}/10000
              </div>
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || input.length > 10000}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {loading ? (
                <IconLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <IconSend className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <p className="mt-2 text-xs text-muted-foreground text-center">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
