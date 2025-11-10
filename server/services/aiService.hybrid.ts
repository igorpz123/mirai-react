// server/services/aiService.hybrid.ts
import * as GeminiService from './aiService'
import * as OllamaService from './aiService.ollama'
import { ChatMessage } from './aiService'

// Tipo de provider
export type AIProvider = 'ollama' | 'gemini'

// Interface comum de resposta com metadata
export interface AIResponse<T> {
  data: T
  cached: boolean
  provider: AIProvider
  usedFallback?: boolean
  responseTime: number
}

// Configuração do provider atual
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini') as AIProvider
const FALLBACK_ENABLED = AI_PROVIDER === 'ollama' // Fallback só ativo quando provider principal é Ollama

// Estatísticas de uso
interface UsageStats {
  totalRequests: number
  ollamaRequests: number
  geminiRequests: number
  fallbackCount: number
  ollamaResponseTimes: number[]
  geminiResponseTimes: number[]
}

const usageStats: UsageStats = {
  totalRequests: 0,
  ollamaRequests: 0,
  geminiRequests: 0,
  fallbackCount: 0,
  ollamaResponseTimes: [],
  geminiResponseTimes: []
}

// Controle de concorrência para Ollama (máximo 3 requisições simultâneas)
class Semaphore {
  private queue: Array<() => void> = []
  private running = 0

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++
      return Promise.resolve()
    }

    return new Promise<void>(resolve => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    this.running--
    const next = this.queue.shift()
    if (next) {
      this.running++
      next()
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

const ollamaSemaphore = new Semaphore(3)

// ============================================================================
// Helper: Executar com provider específico e fallback
// ============================================================================
async function executeWithFallback<T>(
  method: string,
  ollamaFn: () => Promise<T>,
  geminiFn: () => Promise<T>
): Promise<AIResponse<T>> {
  const startTime = Date.now()
  usageStats.totalRequests++

  // Se provider for Gemini, usar apenas Gemini
  if (AI_PROVIDER === 'gemini') {
    console.log(`[AI Hybrid] Usando Gemini para ${method}`)
    try {
      const data = await geminiFn()
      const responseTime = Date.now() - startTime
      usageStats.geminiRequests++
      usageStats.geminiResponseTimes.push(responseTime)
      
      // Limitar array de response times a 1000 entradas
      if (usageStats.geminiResponseTimes.length > 1000) {
        usageStats.geminiResponseTimes.shift()
      }
      
      return {
        data,
        cached: (data as any).cached || false,
        provider: 'gemini',
        responseTime
      }
    } catch (error) {
      console.error(`[AI Hybrid] Erro no Gemini para ${method}:`, error)
      throw error
    }
  }

  // Se provider for Ollama, tentar Ollama primeiro com fallback para Gemini
  console.log(`[AI Hybrid] Usando Ollama para ${method}`)
  
  try {
    // Executar Ollama com controle de concorrência
    const data = await ollamaSemaphore.run(() => ollamaFn())
    const responseTime = Date.now() - startTime
    usageStats.ollamaRequests++
    usageStats.ollamaResponseTimes.push(responseTime)
    
    // Limitar array de response times
    if (usageStats.ollamaResponseTimes.length > 1000) {
      usageStats.ollamaResponseTimes.shift()
    }
    
    return {
      data,
      cached: (data as any).cached || false,
      provider: 'ollama',
      responseTime
    }
  } catch (ollamaError: any) {
    const ollamaErrorInfo = OllamaService.handleOllamaError(ollamaError)
    
    // Verificar se deve fazer fallback
    const shouldFallback = FALLBACK_ENABLED && (
      ollamaErrorInfo.code === 'ECONNREFUSED' ||
      ollamaErrorInfo.code === 'ETIMEDOUT' ||
      ollamaErrorInfo.status === 500
    )
    
    if (!shouldFallback) {
      console.error(`[AI Hybrid] Erro no Ollama sem fallback:`, ollamaErrorInfo.message)
      throw ollamaError
    }
    
    // Fazer fallback para Gemini
    console.warn(`[AI Hybrid] Falha no Ollama (${ollamaErrorInfo.code}), usando fallback para Gemini`)
    usageStats.fallbackCount++
    
    try {
      const data = await geminiFn()
      const responseTime = Date.now() - startTime
      usageStats.geminiRequests++
      usageStats.geminiResponseTimes.push(responseTime)
      
      if (usageStats.geminiResponseTimes.length > 1000) {
        usageStats.geminiResponseTimes.shift()
      }
      
      return {
        data,
        cached: (data as any).cached || false,
        provider: 'gemini',
        usedFallback: true,
        responseTime
      }
    } catch (geminiError) {
      console.error(`[AI Hybrid] Fallback para Gemini também falhou:`, geminiError)
      // Lançar erro original do Ollama
      throw ollamaError
    }
  }
}

// ============================================================================
// Método 1: Gerar texto simples (generateText)
// ============================================================================
export async function generateText(
  userId: number,
  prompt: string
): Promise<AIResponse<{ text: string; cached: boolean }>> {
  return executeWithFallback(
    'generateText',
    () => OllamaService.generateText(userId, prompt),
    () => GeminiService.generateText(userId, prompt)
  )
}

// ============================================================================
// Método 2: Analisar imagem em base64 (analyzeImage)
// ============================================================================
export interface ImageAnalysisResult {
  description: string
  detected: string[]
  confidence?: string
  cached: boolean
}

export async function analyzeImage(
  userId: number,
  base64Image: string,
  prompt?: string
): Promise<AIResponse<ImageAnalysisResult>> {
  return executeWithFallback(
    'analyzeImage',
    () => OllamaService.analyzeImage(userId, base64Image, prompt),
    () => GeminiService.analyzeImage(userId, base64Image, prompt)
  )
}

// ============================================================================
// Método 3: Chat multi-turno com histórico
// ============================================================================
export interface ChatResponse {
  reply: string
  history: ChatMessage[]
  cached: boolean
}

export async function chatMultiTurn(
  userId: number,
  message: string,
  history: ChatMessage[] = []
): Promise<AIResponse<ChatResponse>> {
  return executeWithFallback(
    'chatMultiTurn',
    () => OllamaService.chatMultiTurn(userId, message, history),
    () => GeminiService.chatMultiTurn(userId, message, history)
  )
}

// ============================================================================
// Métodos auxiliares para monitoramento
// ============================================================================
export function getTokenLogs(userId?: number, limit = 100) {
  // Combinar logs de ambos os providers
  const geminiLogs = GeminiService.getTokenLogs(userId, limit)
  const ollamaLogs = OllamaService.getTokenLogs(userId, limit)
  
  const allLogs = [...geminiLogs, ...ollamaLogs]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-limit)
  
  return allLogs
}

export function getCacheStats() {
  return {
    gemini: GeminiService.getCacheStats(),
    ollama: OllamaService.getCacheStats()
  }
}

export function clearCache() {
  GeminiService.clearCache()
  OllamaService.clearCache()
  console.log('[AI Hybrid] Cache limpo em todos os providers')
}

export function getUsageStats() {
  // Calcular médias de tempo de resposta
  const avgOllamaTime = usageStats.ollamaResponseTimes.length > 0
    ? Math.round(usageStats.ollamaResponseTimes.reduce((a, b) => a + b, 0) / usageStats.ollamaResponseTimes.length)
    : 0

  const avgGeminiTime = usageStats.geminiResponseTimes.length > 0
    ? Math.round(usageStats.geminiResponseTimes.reduce((a, b) => a + b, 0) / usageStats.geminiResponseTimes.length)
    : 0

  return {
    totalRequests: usageStats.totalRequests,
    ollamaRequests: usageStats.ollamaRequests,
    geminiRequests: usageStats.geminiRequests,
    fallbackCount: usageStats.fallbackCount,
    averageResponseTime: {
      ollama: avgOllamaTime,
      gemini: avgGeminiTime
    },
    currentProvider: AI_PROVIDER,
    fallbackEnabled: FALLBACK_ENABLED
  }
}

// ============================================================================
// Health check
// ============================================================================
export async function checkHealth() {
  const geminiConfigured = !!process.env.GEMINI_API_KEY
  
  // Verificar Ollama
  const ollamaHealth = await OllamaService.checkHealth()
  
  return {
    ollama: ollamaHealth,
    gemini: {
      available: geminiConfigured,
      configured: geminiConfigured
    },
    currentProvider: AI_PROVIDER,
    fallbackEnabled: FALLBACK_ENABLED
  }
}
