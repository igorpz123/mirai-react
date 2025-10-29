// src/server.ts
import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import routes from './routes/router'
import fs from 'fs'
import { PUBLIC_UPLOADS_DIR, PUBLIC_UPLOADS_PREFIX } from './middleware/upload'
import authRoutes from './routes/auth'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { setIO } from './realtime'
import jwt from 'jsonwebtoken'
import authConfig from './config/auth'
import pool from './config/db'
import path from 'path'


const app = express()
const httpServer = http.createServer(app)

// --- Presence in-memory registries ---
type PresenceInfo = { userId: number; lastPing: number }
const presence = new Map<number, PresenceInfo>()
const socketsByUser = new Map<number, Set<string>>()
const ONLINE_TTL_MS = 30_000

const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})
setIO(io)

// Middlewares
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Ensure uploads base directory exists (created on first server start)
try { fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true }) } catch {}

// Static hosting for uploaded files
app.use(PUBLIC_UPLOADS_PREFIX, express.static(PUBLIC_UPLOADS_DIR))

// Rotas principais
app.use('/api', routes)
app.use('/api/auth', authRoutes)

// --- Optional static serving of frontend build (Render / shared hosting) ---
// Accept truthy values: true, 1, yes (case-insensitive)
try {
  const rawServe = (process.env.SERVE_FRONT || '').toLowerCase().trim()
  const shouldServe = ['true', '1', 'yes'].includes(rawServe)
  if (shouldServe) {
    const candidate = process.env.FRONT_DIST_PATH || path.resolve(__dirname, '..', '..', 'dist')
    const indexFile = path.join(candidate, 'index.html')
    const exists = fs.existsSync(candidate)
    console.log('[serve_front] ENABLED. Pasta build esperada:', candidate, '| existe?', exists)
    if (exists) {
      if (!fs.existsSync(indexFile)) console.warn('[serve_front] index.html não encontrado em', candidate)
      app.use(express.static(candidate))
      app.get('/', (req, res) => {
        if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
        return res.status(500).send('Build frontend não encontrado (index.html ausente)')
      })
      // Catch-all (SPA) após rotas API
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next()
        if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
        return res.status(404).send('Recurso não encontrado e index.html ausente')
      })
    } else {
      console.warn('[serve_front] Pasta do build não existe. Verifique build command no Render.')
    }
  } else {
    console.log('[serve_front] DESABILITADO. Defina SERVE_FRONT=true para servir o build pelo backend.')
  }
} catch (e) {
  console.warn('[serve_front] Erro ao configurar front estático:', e)
}

// Health check simples
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() })
})

// Endpoint para registrar last_seen manualmente (fallback / polling)
app.post('/api/presenca/ping', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ message: 'Sem token' })
    const token = auth.replace('Bearer ', '')
    let decoded: any
    try {
      decoded = jwt.verify(token, authConfig.jwtSecret)
    } catch {
      return res.status(401).json({ message: 'Token inválido' })
    }
    const uid = decoded.userId || decoded.id
    if (!uid) return res.status(401).json({ message: 'Token inválido' })
    const userId = Number(uid)
    await pool.query('UPDATE usuarios SET last_seen = NOW() WHERE id = ?', [userId])
    presence.set(userId, { userId, lastPing: Date.now() })
    res.json({ ok: true })
  } catch (e) {
    // Log the real error so we can debug in Codespaces / CI environments
    console.error('[POST /api/presenca/ping] erro:', e)
    if (process.env.NODE_ENV !== 'production') {
      const message = e instanceof Error ? e.message : String(e)
      res.status(500).json({ message: 'Erro no ping', error: message })
    } else {
      res.status(500).json({ message: 'Erro no ping' })
    }
  }
})

// Endpoint para consultar presença de lista de IDs (mistura memória + last_seen)
app.get('/api/presenca', async (req: Request, res: Response) => {
  try {
    const idsParam = (req.query.ids as string) || ''
    const ids = idsParam.split(',').map(n => Number(n)).filter(n => !isNaN(n))
    if (ids.length === 0) return res.json({ users: [] })
    const now = Date.now()
    const memory: Record<number, boolean> = {}
    for (const id of ids) {
      const info = presence.get(id)
      if (info && now - info.lastPing <= ONLINE_TTL_MS) memory[id] = true
    }
    // Buscar last_seen para quem não está em memória
    const missing = ids.filter(id => !(id in memory))
    let dbRows: Array<{ id: number; last_seen: Date | string | null }> = []
    if (missing.length) {
      const [rows] = await pool.query('SELECT id, last_seen FROM usuarios WHERE id IN (?)', [missing]) as [any[], any]
      dbRows = rows
    }
    const result = ids.map(id => {
      if (memory[id]) return { userId: id, online: true }
      const row = dbRows.find(r => r.id === id)
      if (!row || !row.last_seen) return { userId: id, online: false }
      const ts = new Date(row.last_seen).getTime()
      return { userId: id, online: (Date.now() - ts) <= ONLINE_TTL_MS }
    })
    res.json({ users: result })
  } catch (e) {
    console.error('[GET /api/presenca] erro:', e)
    if (process.env.NODE_ENV !== 'production') {
      const message = e instanceof Error ? e.message : String(e)
      res.status(500).json({ message: 'Erro ao consultar presença', error: message })
    } else {
      res.status(500).json({ message: 'Erro ao consultar presença' })
    }
  }
})

// --- Socket.IO presence ---
io.on('connection', (socket) => {
  let currentUserId: number | null = null

  function markOnline(userId: number) {
    presence.set(userId, { userId, lastPing: Date.now() })
    io.emit('presence:update', { userId, state: 'online' })
  }
  function markOffline(userId: number) {
    presence.delete(userId)
    io.emit('presence:update', { userId, state: 'offline' })
  }

  socket.on('auth:init', async ({ token }: { token?: string }) => {
    if (!token) return
    try {
      const decoded: any = jwt.verify(token, authConfig.jwtSecret)
      const uid = decoded.userId || decoded.id
      if (!uid) return
  currentUserId = Number(uid)
      if (!socketsByUser.has(currentUserId)) socketsByUser.set(currentUserId, new Set())
      socketsByUser.get(currentUserId)!.add(socket.id)
  // join personal room for targeted notifications
  socket.join(`user:${currentUserId}`)
      // Atualiza last_seen no banco (besteffort)
      try { await pool.query('UPDATE usuarios SET last_seen = NOW() WHERE id = ?', [currentUserId]) } catch {}
      markOnline(currentUserId)
      // Envia snapshot de quem está online atualmente somente para este socket
      const now = Date.now()
      const onlineUsers = Array.from(presence.values())
        .filter(p => now - p.lastPing <= ONLINE_TTL_MS)
        .map(p => p.userId)
      socket.emit('presence:snapshot', { users: onlineUsers })
    } catch { /* ignore */ }
  })

  socket.on('presence:ping', async () => {
    if (!currentUserId) return
    presence.set(currentUserId, { userId: currentUserId, lastPing: Date.now() })
    try { await pool.query('UPDATE usuarios SET last_seen = NOW() WHERE id = ?', [currentUserId]) } catch {}
  })

  socket.on('disconnect', () => {
    if (!currentUserId) return
    const set = socketsByUser.get(currentUserId)
    if (set) {
      set.delete(socket.id)
      if (set.size === 0) {
        // Grace period curto em caso de refresh
        setTimeout(() => {
          const again = socketsByUser.get(currentUserId!)
          if (!again || again.size === 0) {
            const info = presence.get(currentUserId!)
            if (!info || Date.now() - info.lastPing > ONLINE_TTL_MS) markOffline(currentUserId!)
          }
        }, 5_000)
      }
    }
  })
})

// Limpeza periódica para sessões sem ping
setInterval(() => {
  const now = Date.now()
  // Clean up stale presence entries
  for (const [userId, info] of presence.entries()) {
    if (now - info.lastPing > ONLINE_TTL_MS) {
      presence.delete(userId)
      io.emit('presence:update', { userId, state: 'offline' })
    }
  }
  // Clean up empty socket sets to prevent memory leak
  for (const [userId, socketSet] of socketsByUser.entries()) {
    if (socketSet.size === 0) {
      socketsByUser.delete(userId)
    }
  }
}, 10_000)

// Tratamento de erros
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack)
    res.status(500).send('Erro interno do servidor!')
  }
)

const port = process.env.PORT || 5000
httpServer.listen(port, () => {
  console.log(`Servidor rodando na porta ${port} (HTTP + Socket.IO)`)
})