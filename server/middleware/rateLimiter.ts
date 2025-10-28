// server/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import authConfig from '../config/auth'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Armazena contadores por userId
const rateLimits = new Map<number, RateLimitEntry>()

// Configuração: 100 requisições por minuto
const MAX_REQUESTS = 100
const WINDOW_MS = 60 * 1000 // 1 minuto

// Limpeza periódica de entradas expiradas
setInterval(() => {
  const now = Date.now()
  for (const [userId, entry] of rateLimits.entries()) {
    if (now > entry.resetTime) {
      rateLimits.delete(userId)
    }
  }
}, 60 * 1000) // Limpar a cada minuto

export function aiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Extrair userId do JWT
  const auth = req.headers.authorization
  if (!auth) {
    res.status(401).json({ message: 'Não autenticado' })
    return
  }
  
  const token = auth.replace('Bearer ', '')
  let userId: number
  
  try {
    const payload: any = jwt.verify(token, authConfig.jwtSecret as string)
    userId = Number(payload?.userId || payload?.id)
    
    if (!userId) {
      res.status(401).json({ message: 'Token inválido' })
      return
    }
    
    // Adicionar userId ao request para uso nos controllers
    ;(req as any).userId = userId
  } catch (error) {
    res.status(401).json({ message: 'Token inválido ou expirado' })
    return
  }
  
  const now = Date.now()
  const userLimit = rateLimits.get(userId)
  
  // Se não existe ou expirou, criar nova entrada
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, {
      count: 1,
      resetTime: now + WINDOW_MS
    })
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString())
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - 1).toString())
    res.setHeader('X-RateLimit-Reset', new Date(now + WINDOW_MS).toISOString())
    
    next()
    return
  }
  
  // Verificar se excedeu o limite
  if (userLimit.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000)
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString())
    res.setHeader('X-RateLimit-Remaining', '0')
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString())
    res.setHeader('Retry-After', retryAfter.toString())
    
    res.status(429).json({
      message: `Taxa de requisições excedida. Tente novamente em ${retryAfter} segundos.`,
      retryAfter
    })
    return
  }
  
  // Incrementar contador
  userLimit.count++
  
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString())
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - userLimit.count).toString())
  res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString())
  
  next()
}

// Função auxiliar para obter stats de rate limiting (útil para debugging)
export function getRateLimitStats(userId: number) {
  const entry = rateLimits.get(userId)
  if (!entry) {
    return { used: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, resetAt: null }
  }
  
  const now = Date.now()
  if (now > entry.resetTime) {
    return { used: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, resetAt: null }
  }
  
  return {
    used: entry.count,
    limit: MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetAt: new Date(entry.resetTime).toISOString()
  }
}
