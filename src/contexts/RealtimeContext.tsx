import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'
import { toastNotification } from '@/lib/customToast'

// Presence state
type PresenceState = Record<number, { online: boolean; updatedAt: number }>

// Notification item shape (mirrors backend)
export interface RTNotification {
  id: number
  user_id: number
  type: string
  entity: string | null
  entity_id: number | null
  message: string
  metadata: any
  created_at: string
  read_at: string | null
}

interface RealtimeContextValue {
  // presence
  presence: PresenceState
  isOnline: (userId: number) => boolean
  connected: boolean
  // notifications
  notifications: RTNotification[]
  unread: number
  markRead: (id: number) => Promise<void>
  markAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
  // raw socket (if needed)
  socket: Socket | null
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth()
  const [presence, setPresence] = useState<PresenceState>({})
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<RTNotification[]>([])
  const socketRef = useRef<Socket | null>(null)
  const shownToastsRef = useRef<Set<number>>(new Set())

  const unread = notifications.filter(n => !n.read_at).length

  const resolveSocketURL = () => {
    if (import.meta.env.VITE_API_WS_URL) return import.meta.env.VITE_API_WS_URL as string
    const { protocol, hostname, port } = window.location
    if (port === '5173') return `${protocol}//${hostname}:5000`
    return window.location.origin
  }

  const refreshNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notificacoes?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (Array.isArray(data?.notifications)) setNotifications(data.notifications)
    } catch {}
  }, [token])

  // Socket lifecycle
  useEffect(() => {
    if (!token || !user) return
    const url = resolveSocketURL()
    const s = io(url, { transports: ['websocket'], autoConnect: true })
    socketRef.current = s

    s.on('connect', () => {
      console.debug('[RT] socket connected', s.id)
      setConnected(true)
      s.emit('auth:init', { token })
      s.emit('presence:ping')
    })
    s.on('disconnect', (reason) => {
      console.debug('[RT] socket disconnected', reason)
      setConnected(false)
    })

    // Presence events
    s.on('presence:update', (payload: { userId: number; state: 'online' | 'offline' }) => {
      // debug presence updates
      if (payload.userId === user?.id) console.debug('[RT] presence:update (self)', payload)
      setPresence(prev => ({ ...prev, [payload.userId]: { online: payload.state === 'online', updatedAt: Date.now() } }))
    })
    s.on('presence:snapshot', (payload: { users: number[] }) => {
      console.debug('[RT] presence:snapshot', payload.users)
      const ts = Date.now()
      setPresence(prev => {
        const next = { ...prev }
        payload.users.forEach(id => { next[id] = { online: true, updatedAt: ts } })
        return next
      })
    })

    // Notification events
    s.on('notification:new', (notif: RTNotification) => {
      console.debug('[RT] notification:new', notif)
      setNotifications(prev => {
        if (prev.find(n => n.id === notif.id)) return prev
        return [notif, ...prev].slice(0, 100)
      })
      // Show toast for new notifications (dedup by id)
      try {
        const nid = Number((notif as any)?.id)
        if (!Number.isNaN(nid) && shownToastsRef.current.has(nid)) return
        if (!Number.isNaN(nid)) shownToastsRef.current.add(nid)
        const msg = (notif as any)?.message || (notif as any)?.metadata?.message || (notif as any)?.metadata?.title || 'Nova notificação'
        const link = (notif as any)?.metadata?.link
        const opts: any = {}
        if (!Number.isNaN(nid)) opts.id = nid
        if (link) opts.onClick = () => { try { window.location.assign(link) } catch {} }
        // Always use the neutral Notification toast variant per request
        toastNotification(msg, opts)
      } catch {}
    })

    // Initial fetch - use token directly instead of callback to avoid dependency
    const loadNotifications = async () => {
      try {
        const res = await fetch('/api/notificacoes?limit=50', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (Array.isArray(data?.notifications)) setNotifications(data.notifications)
        console.debug('[RT] initial notifications loaded', { count: data?.notifications?.length || 0 })
      } catch {}
    }
    loadNotifications()

    // Periodic presence ping
    const pingInt = setInterval(() => { s.emit('presence:ping') }, 10_000)
    // HTTP fallback
    const httpInt = setInterval(() => {
      if (!socketRef.current?.connected) {
        fetch('/api/presenca/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {})
      }
    }, 15_000)

    fetch('/api/presenca/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {})

    return () => {
      clearInterval(pingInt)
      clearInterval(httpInt)
      s.disconnect()
    }
  }, [token, user])

  const isOnline = (userId: number) => !!presence[userId]?.online

  const markRead = useCallback(async (id: number) => {
    if (!token) return
    try {
      await fetch(`/api/notificacoes/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    } catch {}
  }, [token])

  const markAll = useCallback(async () => {
    if (!token) return
    try {
      await fetch('/api/notificacoes/read-all', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    } catch {}
  }, [token])

  return (
    <RealtimeContext.Provider value={{ presence, isOnline, connected, notifications, unread, markRead, markAll, refreshNotifications, socket: socketRef.current }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime deve ser usado dentro de RealtimeProvider')
  return ctx
}

// Convenience wrappers to avoid changing all existing imports at once
export const usePresence = () => {
  const { isOnline, presence, connected } = useRealtime()
  return { isOnline, presence, connected }
}

export const useNotificationsRT = () => {
  const { notifications, unread, markRead, markAll, refreshNotifications } = useRealtime()
  return { notifications, unread, markRead, markAll, refreshNotifications }
}
