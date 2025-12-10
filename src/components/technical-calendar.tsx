import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBr from '@fullcalendar/core/locales/pt-br'
import type { AgendaEvent } from '@/services/agenda'
import { updateAgendaEvent } from '@/services/agenda'
import './technical-calendar.css'
import EditEventDialog from '@/components/agenda/edit-event-dialog'

export default function TechnicalCalendar(
  { events, currentMonth, onMonthChange }: { events: AgendaEvent[]; currentMonth?: Date; onMonthChange?: (d: Date) => void }
) {
  const [fcEvents, setFcEvents] = useState<any[]>([])
  const calendarRef = useRef<FullCalendar | null>(null)
  // Removido sync complexo; apenas refletimos eventos e deixamos FullCalendar navegar livremente.

  // Edit modal state
  const [selectedAgendaEvent, setSelectedAgendaEvent] = useState<AgendaEvent | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toSqlLocal = (dt: Date) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`

  useEffect(() => {
    setFcEvents((events || []).map(e => {
      // Prefer explicit color, fallback to tipo_tarefa palette
      let backgroundColor: string | undefined
      let borderColor: string | undefined
      let textColor: string | undefined
      const tipoId = (e.tipo_tarefa_id != null ? Number(e.tipo_tarefa_id) : undefined)
      if (e.color && typeof e.color === 'string' && e.color.trim()) {
        backgroundColor = e.color
        borderColor = e.color
        // Heuristic for text color based on rgb/hex luminance
        const c = e.color.trim()
        const toRGB = (col: string): { r: number; g: number; b: number } | null => {
          if (col.startsWith('#')) {
            const hex = col.slice(1)
            const v = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex
            if (v.length !== 6) return null
            const int = parseInt(v, 16)
            if (isNaN(int)) return null
            return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
          }
          const m = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(col)
          if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
          return null
        }
        const rgb = toRGB(c)
        if (rgb) {
          const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
          textColor = lum > 140 ? '#111827' : '#ffffff'
        } else {
          textColor = '#111827'
        }
      } else {
        if (tipoId === 4) {
          backgroundColor = '#16a34a' // green-600
          borderColor = '#15803d' // green-700
          textColor = '#ffffff'
        } else if (tipoId === 1 || tipoId === 2) {
          backgroundColor = '#eab308' // yellow-500
          borderColor = '#ca8a04' // yellow-600
          textColor = '#1f2937' // gray-800 for readability on yellow
        }
      }
      return ({
      id: e.id,
      title: e.title || `Tarefa ${e.tarefa_id}`,
      start: e.start_date,
      end: e.end_date,
        extendedProps: { tarefa_id: e.tarefa_id, description: e.description, tipo_tarefa_id: e.tipo_tarefa_id, color: e.color },
        backgroundColor,
        borderColor,
        textColor,
      })
    }))
  }, [events])

  // Não sincronizamos mais programaticamente; evitamos loops.

  return (
    <div className="bg-background rounded-lg border p-2 text-sm">
      <FullCalendar
        ref={calendarRef as any}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
  // Deixar FullCalendar decidir a data inicial (ou usamos currentMonth se veio)
  initialDate={currentMonth}
        locales={[ptBr]}
        locale="pt-br"
        dayHeaderFormat={{ weekday: 'long' }}
        weekends={true}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        events={fcEvents}
        height="auto"
        selectable
        editable
        datesSet={(info: any) => {
          // Para month view, info.start pode ser o primeiro dia exibido (que pode pertencer ao mês anterior).
          // Usamos view.currentStart (primeiro dia do mês real) quando disponível.
          const base: Date = (info.view && info.view.currentStart) ? new Date(info.view.currentStart) : new Date(info.start)
          const d = new Date(base.getFullYear(), base.getMonth(), 1)
          if (onMonthChange) onMonthChange(d)
        }}
        eventDrop={async (info: any) => {
          // Fired when an event is dragged and dropped to a new date/time
          try {
            const id = Number(info.event.id)
            const startIso = info.event.start ? toSqlLocal(info.event.start) : undefined
            const endIso = info.event.end ? toSqlLocal(info.event.end) : undefined
            await updateAgendaEvent(id, { start: startIso, end: endIso })
          } catch (e) {
            console.error('Falha ao mover evento:', e)
            info.revert()
            alert('Não foi possível atualizar o evento')
          }
        }}
        eventResize={async (info: any) => {
          // Fired when an event is resized to change its end time
          try {
            const id = Number(info.event.id)
            const startIso = info.event.start ? toSqlLocal(info.event.start) : undefined
            const endIso = info.event.end ? toSqlLocal(info.event.end) : undefined
            await updateAgendaEvent(id, { start: startIso, end: endIso })
          } catch (e) {
            console.error('Falha ao redimensionar evento:', e)
            info.revert()
            alert('Não foi possível atualizar o evento')
          }
        }}
        eventClick={(info: any) => {
          // Find the original AgendaEvent from events array
          const eventId = Number(info.event.id)
          const agendaEvent = events.find(e => e.id === eventId)
          if (agendaEvent) {
            setSelectedAgendaEvent(agendaEvent)
            setViewDialogOpen(true)
          }
        }}
      />

      {/* View/Delete Dialog */}
      {selectedAgendaEvent && (
        <EditEventDialog
          event={selectedAgendaEvent}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          onDeleted={async () => {
            // Refresh calendar by notifying parent
            if (onMonthChange && calendarRef.current) {
              const api = calendarRef.current.getApi()
              const currentDate = api.getDate()
              onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
            }
          }}
          onUpdated={async () => {
            // Refresh calendar by notifying parent
            if (onMonthChange && calendarRef.current) {
              const api = calendarRef.current.getApi()
              const currentDate = api.getDate()
              onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
            }
          }}
        />
      )}
    </div>
  )
}
