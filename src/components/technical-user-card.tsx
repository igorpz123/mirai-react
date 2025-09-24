import { Link } from 'react-router-dom'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { isTecnicoUser } from '@/lib/roles'
import { usePresence } from '@/contexts/RealtimeContext'

interface TechUserCardProps {
  user: any
  to: string
}

export function TechUserCard({ user, to }: TechUserCardProps) {
  const nome: string = user?.nome || 'Usuário'
  const email: string = user?.email || ''
  const foto = user?.foto_url || user?.fotoUrl || undefined
  const cargo = (user as any)?.cargo || (isTecnicoUser(user) ? 'Técnico' : '')
  const initials = nome.split(/\s+/).slice(0,2).map(p => p.charAt(0)).join('').toUpperCase()
  let online = false
  try {
    const { isOnline } = usePresence()
    online = isOnline(Number(user?.id))
  } catch { /* context not mounted yet */ }

  return (
    <Link
      to={to}
      className="group relative block rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 p-4 shadow-sm ring-1 ring-black/0 transition-all hover:shadow-md hover:ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_60%)]" />
      </div>
      <div className="relative flex items-start gap-4">
        <div className="relative">
          <Avatar className="size-14 ring-2 ring-primary/15 group-hover:ring-primary/35 transition-all duration-300">
            <AvatarImage src={foto} alt={nome} />
            <AvatarFallback className="text-sm font-medium bg-muted/70">{initials}</AvatarFallback>
          </Avatar>
          <span
            title={online ? 'Online' : 'Offline'}
            className={"absolute bottom-0 right-0 size-3 rounded-full border-2 border-background shadow transition-colors " + (online ? 'bg-emerald-500' : 'bg-zinc-400')}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight tracking-tight text-foreground/90 group-hover:text-foreground">
            {nome}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground/80 truncate">
            {email}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70">
            {cargo && (
              <Badge variant="secondary" className="px-2 py-0 h-5 rounded-full text-[10px] bg-primary/10 text-primary hover:bg-primary/10">
                {cargo}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between items-center text-[11px] text-muted-foreground/60">
        <span className="transition-colors group-hover:text-muted-foreground/80">Ver detalhes</span>
        <span className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary">→</span>
      </div>
    </Link>
  )
}
