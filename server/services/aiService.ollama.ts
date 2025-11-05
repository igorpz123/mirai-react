// server/services/aiService.ollama.ts
import { ChatMessage } from './aiService'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'llama3.2'
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llava'
const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10)

// --- Cache de prompts repetidos ---
interface CacheEntry {
  response: string
  timestamp: number
  tokens: { input: number; output: number }
}
const promptCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 1000 * 60 * 15 // 15 minutos

// --- Logs de consumo de tokens ---
export interface TokenUsage {
  userId: number
  timestamp: string
  method: string
  inputTokens: number
  outputTokens: number
  cached: boolean
  provider: 'ollama'
}
const tokenLogs: TokenUsage[] = []

// --- Sanitização de inputs ---
function sanitizeInput(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .trim()
    .slice(0, 30000) // Limite de ~30k caracteres
}

// --- Retry com backoff exponencial ---
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: any
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Não fazer retry em erros de validação
      if (error?.code === 'INVALID_INPUT') {
        throw error
      }

      // Último retry: lança erro
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Backoff exponencial: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt)
      console.warn(`[Ollama] Tentativa ${attempt + 1} falhou. Retrying em ${delay}ms...`, {
        error: error?.message,
        code: error?.code
      })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// --- Tratamento de erros específicos ---
export function handleOllamaError(error: any): { message: string; code: string; status: number } {
  if (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED') {
    return {
      message: 'Ollama não está disponível. Verifique se o servidor está rodando.',
      code: 'ECONNREFUSED',
      status: 503
    }
  }
  
  if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
    return {
      message: 'Requisição demorou muito. Tente novamente.',
      code: 'ETIMEDOUT',
      status: 504
    }
  }
  
  if (error?.message?.includes('model') && error?.message?.includes('not found')) {
    return {
      message: `Modelo não encontrado. Execute: ollama pull ${TEXT_MODEL}`,
      code: 'MODEL_NOT_FOUND',
      status: 500
    }
  }
  
  if (error?.message?.includes('out of memory') || error?.message?.includes('OOM')) {
    return {
      message: 'Memória insuficiente para processar. Tente um prompt menor.',
      code: 'OUT_OF_MEMORY',
      status: 500
    }
  }
  
  console.error('[Ollama] Erro inesperado:', error)
  return {
    message: 'Erro ao processar solicitação com Ollama.',
    code: 'UNKNOWN_ERROR',
    status: 500
  }
}

// --- Log de consumo de tokens ---
function logTokenUsage(
  userId: number,
  method: string,
  inputTokens: number,
  outputTokens: number,
  cached: boolean
) {
  const log: TokenUsage = {
    userId,
    timestamp: new Date().toISOString(),
    method,
    inputTokens,
    outputTokens,
    cached,
    provider: 'ollama'
  }
  tokenLogs.push(log)
  
  // Manter apenas últimos 10000 logs em memória
  if (tokenLogs.length > 10000) {
    tokenLogs.splice(0, tokenLogs.length - 10000)
  }
  
  console.log('[Ollama] Token usage:', log)
}

// --- Cache helpers ---
function getCacheKey(method: string, input: string): string {
  return `ollama:${method}:${Buffer.from(input).toString('base64').slice(0, 100)}`
}

function getCachedResponse(cacheKey: string): string | null {
  const entry = promptCache.get(cacheKey)
  if (!entry) return null
  
  // Verificar expiração
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    promptCache.delete(cacheKey)
    return null
  }
  
  return entry.response
}

function setCachedResponse(cacheKey: string, response: string, tokens: { input: number; output: number }) {
  promptCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    tokens
  })
  
  // Limitar tamanho do cache
  if (promptCache.size > 500) {
    const oldestKey = Array.from(promptCache.keys())[0]
    promptCache.delete(oldestKey)
  }
}

// --- Fetch com timeout ---
async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      const timeoutError: any = new Error(`Request timeout after ${timeoutMs}ms`)
      timeoutError.code = 'ETIMEDOUT'
      throw timeoutError
    }
    throw error
  }
}

// --- Estimar tokens (aproximação: 1 token ≈ 4 caracteres) ---
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ============================================================================
// Método 1: Gerar texto simples (generateText)
// ============================================================================
export async function generateText(userId: number, prompt: string): Promise<{ text: string; cached: boolean }> {
  const sanitized = sanitizeInput(prompt)
  const cacheKey = getCacheKey('generateText', sanitized)
  
  // Verificar cache
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'generateText', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    console.log('[Ollama] Cache hit para generateText')
    return { text: cached, cached: true }
  }
  
  console.log(`[Ollama] Tentando gerar texto com ${TEXT_MODEL}...`)
  const startTime = Date.now()
  
  // Fazer requisição com retry
  const result = await retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${OLLAMA_URL}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: TEXT_MODEL,
          prompt: sanitized,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048
          }
        })
      },
      TIMEOUT_MS
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  })
  
  const text = result.response || ''
  const responseTime = Date.now() - startTime
  
  // Estimar tokens
  const inputTokens = estimateTokens(sanitized)
  const outputTokens = estimateTokens(text)
  
  console.log(`[Ollama] Resposta recebida em ${responseTime}ms`)
  logTokenUsage(userId, 'generateText', inputTokens, outputTokens, false)
  setCachedResponse(cacheKey, text, { input: inputTokens, output: outputTokens })
  
  return { text, cached: false }
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
  prompt: string = 'Descreva esta imagem em detalhes.'
): Promise<ImageAnalysisResult> {
  const sanitizedPrompt = sanitizeInput(prompt)
  
  // Validar base64
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/
  if (!base64Regex.test(base64Image)) {
    const error: any = new Error('Formato de imagem inválido. Use data:image/[tipo];base64,[dados]')
    error.code = 'INVALID_INPUT'
    throw error
  }
  
  // Extrair apenas os dados base64 (remover prefixo data:image/...)
  const base64Data = base64Image.split(',')[1]
  
  // Cache key inclui hash da imagem (primeiros 200 chars da base64)
  const cacheKey = getCacheKey('analyzeImage', `${sanitizedPrompt}:${base64Data.slice(0, 200)}`)
  
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as ImageAnalysisResult
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'analyzeImage', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    console.log('[Ollama] Cache hit para analyzeImage')
    return { ...parsed, cached: true }
  }
  
  console.log(`[Ollama] Tentando analisar imagem com ${VISION_MODEL}...`)
  const startTime = Date.now()
  
  // Fazer requisição com retry (timeout maior para imagens)
  const result = await retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${OLLAMA_URL}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: VISION_MODEL,
          prompt: sanitizedPrompt,
          images: [base64Data],
          stream: false,
          options: {
            temperature: 0.7
          }
        })
      },
      Math.max(TIMEOUT_MS, 60000) // Mínimo 60s para visão
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  })
  
  const text = result.response || ''
  const responseTime = Date.now() - startTime
  
  // Tentar extrair informações estruturadas da resposta
  const detected: string[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    const match = line.match(/[-•*]\s*(.+)/)
    if (match) detected.push(match[1].trim())
  }
  
  const analysisResult: ImageAnalysisResult = {
    description: text,
    detected,
    confidence: 'high',
    cached: false
  }
  
  // Estimar tokens (imagem conta como ~258 tokens + prompt)
  const inputTokens = 258 + estimateTokens(sanitizedPrompt)
  const outputTokens = estimateTokens(text)
  
  console.log(`[Ollama] Análise de imagem concluída em ${responseTime}ms`)
  logTokenUsage(userId, 'analyzeImage', inputTokens, outputTokens, false)
  setCachedResponse(cacheKey, JSON.stringify(analysisResult), { input: inputTokens, output: outputTokens })
  
  return analysisResult
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
): Promise<ChatResponse> {
  const sanitized = sanitizeInput(message)
  
  // Cache key baseado no histórico completo
  const historyStr = history.map(h => `${h.role}:${h.text}`).join('|')
  const cacheKey = getCacheKey('chatMultiTurn', `${historyStr}|user:${sanitized}`)
  
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as { reply: string; history: ChatMessage[] }
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'chatMultiTurn', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    console.log('[Ollama] Cache hit para chatMultiTurn')
    return { ...parsed, cached: true }
  }
  
  console.log(`[Ollama] Iniciando chat multi-turno com ${TEXT_MODEL}...`)
  const startTime = Date.now()
  
  // Construir contexto com histórico
  let contextPrompt = ''
  for (const msg of history) {
    if (msg.role === 'user') {
      contextPrompt += `User: ${msg.text}\n`
    } else {
      contextPrompt += `Assistant: ${msg.text}\n`
    }
  }
  contextPrompt += `User: ${sanitized}\nAssistant:`
  
  // Fazer requisição com retry
  const result = await retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${OLLAMA_URL}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: TEXT_MODEL,
          prompt: contextPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048
          }
        })
      },
      TIMEOUT_MS
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${errorText}`)
    }
    
    return await response.json()
  })
  
  const reply = result.response || ''
  const responseTime = Date.now() - startTime
  
  // Atualizar histórico
  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: 'user', text: sanitized },
    { role: 'model', text: reply }
  ]
  
  // Estimar tokens
  const inputTokens = estimateTokens(contextPrompt)
  const outputTokens = estimateTokens(reply)
  
  console.log(`[Ollama] Chat concluído em ${responseTime}ms`)
  logTokenUsage(userId, 'chatMultiTurn', inputTokens, outputTokens, false)
  
  const responseData = { reply, history: updatedHistory }
  setCachedResponse(cacheKey, JSON.stringify(responseData), { input: inputTokens, output: outputTokens })
  
  return { ...responseData, cached: false }
}

// ============================================================================
// Métodos auxiliares para monitoramento
// ============================================================================
export function getTokenLogs(userId?: number, limit = 100): TokenUsage[] {
  const filtered = userId 
    ? tokenLogs.filter(log => log.userId === userId)
    : tokenLogs
  
  return filtered.slice(-limit)
}

export function getCacheStats() {
  return {
    size: promptCache.size,
    maxSize: 500,
    ttlMinutes: CACHE_TTL_MS / 1000 / 60
  }
}

export function clearCache() {
  promptCache.clear()
  console.log('[Ollama] Cache limpo')
}

// ============================================================================
// Health check
// ============================================================================
export async function checkHealth(): Promise<{
  available: boolean
  url: string
  models?: string[]
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const response = await fetchWithTimeout(
      `${OLLAMA_URL}/api/tags`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      5000 // 5s timeout para health check
    )
    
    if (!response.ok) {
      return {
        available: false,
        url: OLLAMA_URL,
        error: `HTTP ${response.status}`
      }
    }
    
    const data = await response.json()
    const models = (data.models || []).map((m: any) => m.name)
    const responseTime = Date.now() - startTime
    
    return {
      available: true,
      url: OLLAMA_URL,
      models,
      responseTime
    }
  } catch (error: any) {
    return {
      available: false,
      url: OLLAMA_URL,
      error: error?.message || 'Connection failed'
    }
  }
}
