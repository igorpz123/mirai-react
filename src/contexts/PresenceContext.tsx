import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'

type PresenceState = Record<number, { online: boolean; updatedAt: number }>

interface PresenceContextValue {
  presence: PresenceState
  isOnline: (userId: number) => boolean
  connected: boolean
}

const PresenceContext = createContext<PresenceContextValue | null>(null)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [presence, setPresence] = useState<PresenceState>({})
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user || !token) return

    // Resolve URL do Socket.IO: usa VITE_API_WS_URL se definida, senão tenta porta padrão 5000 em dev.
    const url = (() => {
      if (import.meta.env.VITE_API_WS_URL) return import.meta.env.VITE_API_WS_URL as string
      const { protocol, hostname, port } = window.location
      // se estamos na porta típica do Vite (5173), substituir por 5000
      if (port === '5173') return `${protocol}//${hostname}:5000`
      return window.location.origin // fallback (produção mesma origem)
    })()

  const s = io(url, { transports: ['websocket'], autoConnect: true, reconnectionAttempts: 8, reconnectionDelay: 500, reconnectionDelayMax: 3000 })
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('auth:init', { token })
      if (import.meta.env.DEV) console.debug('[Presence] socket connected', url)
      // Emissão imediata de ping lógico (caso precise confirmar rapidamente)
      s.emit('presence:ping')
    })
    s.on('disconnect', (reason) => {
      setConnected(false)
      if (import.meta.env.DEV) console.debug('[Presence] socket disconnected', reason)
    })
    s.on('presence:update', (payload: { userId: number; state: 'online' | 'offline' }) => {
      setPresence(prev => ({
        ...prev,
        [payload.userId]: { online: payload.state === 'online', updatedAt: Date.now() }
      }))
    })
    s.on('presence:snapshot', (payload: { users: number[] }) => {
      setPresence(prev => {
        const next = { ...prev }
        const ts = Date.now()
        payload.users.forEach(id => {
          next[id] = { online: true, updatedAt: ts }
        })
        return next
      })
    })

    // Ping periódico mais responsivo
    const interval = setInterval(() => {
      s.emit('presence:ping')
    }, 10_000)

    // HTTP ping imediato (fallback) assim que efeito montar
    fetch('/api/presenca/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {})

    // Fallback HTTP ping para manter last_seen se socket caiu temporariamente
    const httpInterval = setInterval(() => {
      if (!socketRef.current || !socketRef.current.connected) {
        fetch('/api/presenca/ping', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token }
        }).catch(() => {})
      }
    }, 15_000)

    return () => {
      clearInterval(interval)
      clearInterval(httpInterval)
      s.disconnect()
    }
  }, [user, token])

  const isOnline = (userId: number) => !!presence[userId]?.online

  return (
    <PresenceContext.Provider value={{ presence, isOnline, connected }}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence deve ser usado dentro de PresenceProvider')
  return ctx
}
