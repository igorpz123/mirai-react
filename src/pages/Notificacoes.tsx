import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNotificationsRT } from '@/contexts/RealtimeContext'
import type { RTNotification } from '@/contexts/RealtimeContext'
import { summarizeNotification } from '@/lib/notificationHelpers'
import { SiteHeader } from '@/components/layout/site-header'

export default function NotificacoesPage() {
  const { notifications, unread, markRead, markAll, refreshNotifications } = useNotificationsRT()
  const navigate = useNavigate()

  function handleClick(n: any) {
    if (!n.read_at) markRead(n.id)
    const link = n.metadata?.link
    if (link) navigate(link)
  }

  return (
    <div className='w-full'>
      <SiteHeader title='Notificações' />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Notificações</h1>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Button size="sm" onClick={() => markAll()} className="bg-blue-600 text-white hover:bg-blue-700">Marcar todas</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => refreshNotifications()}>Atualizar</Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <ul className="divide-y max-h-[60vh] overflow-auto">
            {notifications.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">Nenhuma notificação</li>
            )}
            {notifications.map((n: RTNotification) => (
              <li
                key={n.id}
                className={`cursor-pointer p-4 hover:bg-accent flex gap-3 items-start ${!n.read_at ? 'bg-muted/40' : ''}`}
                onClick={() => handleClick(n)}
              >
                <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${n.read_at ? 'bg-transparent border border-border' : 'bg-blue-500'}`}></span>
                <div className="flex-1">
                  {(() => {
                    const s = summarizeNotification(n as RTNotification)
                    return (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm font-medium">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(n.created_at)}</div>
                        </div>
                        <div className="text-sm text-foreground mt-1">{s.description}</div>
                      </>
                    )
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
