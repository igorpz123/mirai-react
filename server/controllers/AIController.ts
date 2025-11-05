// server/controllers/AIController.ts
import { Request, Response } from 'express'
import {
  generateText,
  analyzeImage,
  chatMultiTurn,
  getTokenLogs,
  getCacheStats,
  clearCache,
  getUsageStats,
  checkHealth
} from '../services/aiService.hybrid'
import { ChatMessage } from '../services/aiService'

// O userId já vem do middleware aiRateLimiter
function getUserId(req: Request): number {
  return (req as any).userId
}

// ============================================================================
// POST /api/ai/text - Gerar texto simples
// ============================================================================
export async function generateTextEndpoint(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    
    const { prompt } = req.body
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt é obrigatório' })
    }
    
    if (prompt.length > 30000) {
      return res.status(400).json({ message: 'Prompt muito longo (máximo 30.000 caracteres)' })
    }
    
    const result = await generateText(userId, prompt)
    
    res.json({
      text: result.data.text,
      cached: result.data.cached,
      provider: result.provider,
      usedFallback: result.usedFallback,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[AIController] Erro em generateText:', error)
    
    const statusCode = error?.status || 500
    const message = error?.message || 'Erro ao gerar texto'
    
    res.status(statusCode).json({ message })
  }
}

// ============================================================================
// POST /api/ai/image - Analisar imagem
// ============================================================================
export async function analyzeImageEndpoint(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    
    const { image, prompt } = req.body
    
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ message: 'Imagem em base64 é obrigatória' })
    }
    
    // Validar tamanho da imagem (máximo ~10MB base64)
    if (image.length > 15_000_000) {
      return res.status(400).json({ message: 'Imagem muito grande (máximo ~10MB)' })
    }
    
    const result = await analyzeImage(userId, image, prompt)
    
    res.json({
      description: result.data.description,
      detected: result.data.detected,
      confidence: result.data.confidence,
      cached: result.data.cached,
      provider: result.provider,
      usedFallback: result.usedFallback,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[AIController] Erro em analyzeImage:', error)
    
    const statusCode = error?.status || 500
    const message = error?.message || 'Erro ao analisar imagem'
    
    res.status(statusCode).json({ message })
  }
}

// ============================================================================
// POST /api/ai/chat - Chat multi-turno
// ============================================================================
export async function chatEndpoint(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    
    const { message, history } = req.body
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Mensagem é obrigatória' })
    }
    
    if (message.length > 10000) {
      return res.status(400).json({ message: 'Mensagem muito longa (máximo 10.000 caracteres)' })
    }
    
    // Validar histórico
    let validHistory: ChatMessage[] = []
    if (history && Array.isArray(history)) {
      validHistory = history
        .filter((msg: any) => 
          msg && 
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'model') &&
          typeof msg.text === 'string'
        )
        .slice(-20) // Limitar a 20 mensagens de histórico
    }
    
    const result = await chatMultiTurn(userId, message, validHistory)
    
    res.json({
      reply: result.data.reply,
      history: result.data.history,
      cached: result.data.cached,
      provider: result.provider,
      usedFallback: result.usedFallback,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[AIController] Erro em chat:', error)
    
    const statusCode = error?.status || 500
    const message = error?.message || 'Erro no chat'
    
    res.status(statusCode).json({ message })
  }
}

// ============================================================================
// GET /api/ai/stats - Estatísticas de uso (apenas para admins)
// ============================================================================
export async function getStatsEndpoint(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    
    // TODO: Verificar se usuário é admin (cargoId 1, 2 ou 3)
    // Por enquanto, retorna apenas logs do próprio usuário
    
    const limit = Math.min(Number(req.query.limit) || 100, 1000)
    const logs = getTokenLogs(userId, limit)
    const cacheStats = getCacheStats()
    const usageStats = getUsageStats()
    
    // Calcular totais
    const totalInputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0)
    const totalOutputTokens = logs.reduce((sum, log) => sum + log.outputTokens, 0)
    const cachedRequests = logs.filter(log => log.cached).length
    
    res.json({
      userId,
      logs,
      summary: {
        totalRequests: logs.length,
        cachedRequests,
        cacheHitRate: logs.length > 0 ? (cachedRequests / logs.length * 100).toFixed(2) + '%' : '0%',
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens
      },
      cache: cacheStats,
      usage: usageStats
    })
  } catch (error: any) {
    console.error('[AIController] Erro em stats:', error)
    res.status(500).json({ message: 'Erro ao buscar estatísticas' })
  }
}

// ============================================================================
// POST /api/ai/cache/clear - Limpar cache (apenas admins)
// ============================================================================
export async function clearCacheEndpoint(req: Request, res: Response) {
  try {
    const userId = getUserId(req)
    
    // TODO: Verificar se usuário é admin
    // Por enquanto, qualquer usuário autenticado pode limpar
    
    clearCache()
    
    res.json({
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[AIController] Erro em clearCache:', error)
    res.status(500).json({ message: 'Erro ao limpar cache' })
  }
}

// ============================================================================
// GET /api/ai/health - Health check dos providers
// ============================================================================
export async function healthCheckEndpoint(req: Request, res: Response) {
  try {
    const health = await checkHealth()
    
    res.json(health)
  } catch (error: any) {
    console.error('[AIController] Erro em health check:', error)
    res.status(500).json({ message: 'Erro ao verificar saúde dos providers' })
  }
}

export default {
  generateTextEndpoint,
  analyzeImageEndpoint,
  chatEndpoint,
  getStatsEndpoint,
  clearCacheEndpoint,
  healthCheckEndpoint
}
