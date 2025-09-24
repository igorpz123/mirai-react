import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { io } from 'socket.io-client'

export interface NotificationItem {
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

interface NotificationContextValue {
  notifications: NotificationItem[]
  unread: number
  markRead: (id: number) => Promise<void>
  markAll: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const unread = notifications.filter(n => !n.read_at).length

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notificacoes?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data?.notifications) setNotifications(data.notifications)
    } catch (e) { /* ignore */ }
  }, [token])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!token) return
    // Reuse existing socket from presence if desired; for simplicity, create lightweight socket only for notifications if not existing.
    const url = (window as any)?.location?.origin || undefined
  const s = io(url, { autoConnect: true })
    s.emit('auth:init', { token })
    function onNew(data: any) {
      setNotifications(prev => {
        const exists = prev.find(p => p.id === data.id)
        if (exists) return prev
        return [data, ...prev].slice(0, 100)
      })
    }
    s.on('notification:new', onNew)
    return () => { s.off('notification:new', onNew); s.disconnect() }
  }, [token])

  const markRead = useCallback(async (id: number) => {
    if (!token) return
    try {
      await fetch(`/api/notificacoes/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
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
    <NotificationContext.Provider value={{ notifications, unread, markRead, markAll, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
