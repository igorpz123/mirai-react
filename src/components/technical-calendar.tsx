import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { AgendaEvent } from '@/services/agenda'

export default function TechnicalCalendar({ events }: { events: AgendaEvent[] }) {
  const [fcEvents, setFcEvents] = useState<any[]>([])

  useEffect(() => {
    setFcEvents((events || []).map(e => ({
      id: e.id,
      title: e.title || `Tarefa ${e.tarefa_id}`,
      start: e.start_date,
      end: e.end_date,
      extendedProps: { tarefa_id: e.tarefa_id, description: e.description }
    })))
  }, [events])

  return (
    <div className="bg-background rounded-lg border p-2 text-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        weekends={false}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        events={fcEvents}
        height="auto"
        selectable
        eventClick={(info: any) => {
          // future: open task details
          alert(`${info.event.title} (tarefa ${info.event.extendedProps.tarefa_id})`)
        }}
      />
    </div>
  )
}
