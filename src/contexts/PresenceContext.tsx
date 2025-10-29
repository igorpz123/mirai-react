import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'
import { createSocket, setupPresencePing } from '@/lib/socketUtils'

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

    const s = createSocket()
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('auth:init', { token })
      if (import.meta.env.DEV) console.debug('[Presence] socket connected')
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

    // Setup presence ping with cleanup
    const cleanupPing = setupPresencePing(s, token)

    return () => {
      cleanupPing()
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
