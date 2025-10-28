// server/services/aiService.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
// Usar gemini-2.5-flash (versão mais recente disponível)
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// --- Cache de prompts repetidos para economizar tokens ---
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
}
const tokenLogs: TokenUsage[] = []

// --- Inicialização do cliente Gemini ---
let genAI: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null

function initializeClient() {
  if (!GEMINI_API_KEY) {
    console.warn('[AIService] GEMINI_API_KEY não configurada. Funcionalidades de IA desabilitadas.')
    return
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ model: MODEL_NAME })
    console.log('[AIService] Cliente Gemini inicializado com modelo:', MODEL_NAME)
  }
}

initializeClient()

// --- Sanitização de inputs ---
function sanitizeInput(text: string): string {
  // Remove caracteres de controle e limita tamanho
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
      const statusCode = error?.status || error?.response?.status
      
      // Não fazer retry em erros 4xx (exceto 429)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw error
      }

      // Último retry: lança erro
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Backoff exponencial: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt)
      console.warn(`[AIService] Tentativa ${attempt + 1} falhou. Retrying em ${delay}ms...`, {
        error: error?.message,
        status: statusCode
      })
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// --- Tratamento de erros ---
function handleAIError(error: any): { message: string; status: number } {
  const statusCode = error?.status || error?.response?.status || 500
  
  if (statusCode === 429) {
    return { 
      message: 'Taxa de requisições excedida. Tente novamente em alguns segundos.',
      status: 429
    }
  }
  
  if (statusCode === 401 || statusCode === 403) {
    return {
      message: 'Erro de autenticação com a API do Gemini. Verifique a chave de API.',
      status: 500
    }
  }
  
  if (statusCode === 408 || error?.code === 'ETIMEDOUT') {
    return {
      message: 'Timeout ao comunicar com a IA. Tente novamente.',
      status: 504
    }
  }
  
  console.error('[AIService] Erro inesperado:', error)
  return {
    message: 'Erro ao processar solicitação de IA.',
    status: 500
  }
}

// --- Log de consumo de tokens ---
function logTokenUsage(userId: number, method: string, inputTokens: number, outputTokens: number, cached: boolean) {
  const log: TokenUsage = {
    userId,
    timestamp: new Date().toISOString(),
    method,
    inputTokens,
    outputTokens,
    cached
  }
  tokenLogs.push(log)
  
  // Manter apenas últimos 10000 logs em memória
  if (tokenLogs.length > 10000) {
    tokenLogs.splice(0, tokenLogs.length - 10000)
  }
  
  console.log('[AIService] Token usage:', log)
}

// --- Cache helpers ---
function getCacheKey(method: string, input: string): string {
  // Hash simples para chave de cache
  return `${method}:${Buffer.from(input).toString('base64').slice(0, 100)}`
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

// ============================================================================
// Método 1: Gerar texto simples (generateText)
// ============================================================================
export async function generateText(userId: number, prompt: string): Promise<{ text: string; cached: boolean }> {
  if (!model) {
    throw new Error('Gemini API não configurada')
  }
  
  const sanitized = sanitizeInput(prompt)
  const cacheKey = getCacheKey('generateText', sanitized)
  
  // Verificar cache
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'generateText', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    return { text: cached, cached: true }
  }
  
  // Fazer requisição com retry
  const result = await retryWithBackoff(async () => {
    const response = await model!.generateContent(sanitized)
    return response
  })
  
  const text = result.response.text()
  
  // Estimar tokens (aproximação: 1 token ≈ 4 caracteres)
  const inputTokens = Math.ceil(sanitized.length / 4)
  const outputTokens = Math.ceil(text.length / 4)
  
  logTokenUsage(userId, 'generateText', inputTokens, outputTokens, false)
  setCachedResponse(cacheKey, text, { input: inputTokens, output: outputTokens })
  
  return { text, cached: false }
}

// ============================================================================
// Método 2: Analisar imagem em base64 (analyzeImage) - ESSENCIAL para checklist
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
  if (!model) {
    throw new Error('Gemini API não configurada')
  }
  
  const sanitizedPrompt = sanitizeInput(prompt)
  
  // Validar base64
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/
  if (!base64Regex.test(base64Image)) {
    throw new Error('Formato de imagem inválido. Use data:image/[tipo];base64,[dados]')
  }
  
  // Extrair apenas os dados base64 (remover prefixo data:image/...)
  const base64Data = base64Image.split(',')[1]
  const mimeType = base64Image.match(/data:(image\/[^;]+);/)?.[1] || 'image/jpeg'
  
  // Cache key inclui hash da imagem (primeiros 200 chars da base64)
  const cacheKey = getCacheKey('analyzeImage', `${sanitizedPrompt}:${base64Data.slice(0, 200)}`)
  
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as ImageAnalysisResult
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'analyzeImage', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    return { ...parsed, cached: true }
  }
  
  // Fazer requisição com retry
  const result = await retryWithBackoff(async () => {
    const response = await model!.generateContent([
      sanitizedPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ])
    return response
  })
  
  const text = result.response.text()
  
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
    confidence: 'high', // Gemini não retorna confidence score diretamente
    cached: false
  }
  
  // Estimar tokens (imagem conta como ~258 tokens + prompt)
  const inputTokens = 258 + Math.ceil(sanitizedPrompt.length / 4)
  const outputTokens = Math.ceil(text.length / 4)
  
  logTokenUsage(userId, 'analyzeImage', inputTokens, outputTokens, false)
  setCachedResponse(cacheKey, JSON.stringify(analysisResult), { input: inputTokens, output: outputTokens })
  
  return analysisResult
}

// ============================================================================
// Método 3: Chat multi-turno com histórico
// ============================================================================
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

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
  if (!model) {
    throw new Error('Gemini API não configurada')
  }
  
  const sanitized = sanitizeInput(message)
  
  // Cache key baseado no histórico completo
  const historyStr = history.map(h => `${h.role}:${h.text}`).join('|')
  const cacheKey = getCacheKey('chatMultiTurn', `${historyStr}|user:${sanitized}`)
  
  const cached = getCachedResponse(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as { reply: string; history: ChatMessage[] }
    const cacheEntry = promptCache.get(cacheKey)!
    logTokenUsage(userId, 'chatMultiTurn', cacheEntry.tokens.input, cacheEntry.tokens.output, true)
    return { ...parsed, cached: true }
  }
  
  // Converter histórico para formato Gemini
  const geminiHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }))
  
  // Criar chat session
  const chat = model.startChat({
    history: geminiHistory as any
  })
  
  // Enviar mensagem com retry
  const result = await retryWithBackoff(async () => {
    return await chat.sendMessage(sanitized)
  })
  
  const reply = result.response.text()
  
  // Atualizar histórico
  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: 'user', text: sanitized },
    { role: 'model', text: reply }
  ]
  
  // Estimar tokens
  const inputTokens = Math.ceil((historyStr.length + sanitized.length) / 4)
  const outputTokens = Math.ceil(reply.length / 4)
  
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
  console.log('[AIService] Cache limpo')
}
