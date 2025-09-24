import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationsRT } from '@/contexts/RealtimeContext'
import { Bell } from 'lucide-react'
import { summarizeNotification } from '@/lib/notificationHelpers'

export const NotificationMenu: React.FC = () => {
  const { notifications, unread, markRead, markAll } = useNotificationsRT()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  function handleClick(n: any) {
    if (!n.read_at) markRead(n.id)
    const link = n.metadata?.link
    if (link) navigate(link)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent focus:outline-none"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notificações</span>
            <div className="flex items-center gap-2">
              {unread > 0 && <button onClick={() => markAll()} className="text-xs text-blue-600 hover:underline">Marcar todas</button>}
              <button onClick={() => { setOpen(false); navigate('/notificacoes') }} className="text-xs text-muted-foreground hover:underline">Ver todas</button>
            </div>
          </div>
          <ul className="max-h-96 divide-y overflow-auto">
              {notifications.length === 0 && (
                <li className="p-3 text-xs text-muted-foreground">Nenhuma notificação</li>
              )}
              {notifications.map(n => {
                const s = summarizeNotification(n)
                return (
                  <li key={n.id} className={`group cursor-pointer p-3 text-xs hover:bg-accent ${!n.read_at ? 'bg-muted/40' : ''}`} onClick={() => handleClick(n)}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${n.read_at ? 'bg-transparent border border-border' : 'bg-blue-500'}`}></span>
                    <div className="flex-1">
                      <p className="mb-0.5 leading-snug text-foreground">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">{s.description}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(n.created_at)}</p>
                    </div>
                  </div>
                </li>
                )
              })}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const now = Date.now()
    const diffMs = now - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}m`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    return `${diffD}d`
  } catch { return '' }
}

// using lucide-react Bell icon for consistent appearance with ModeToggle
