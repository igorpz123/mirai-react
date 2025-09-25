import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { AgendaEvent } from '@/services/agenda'
import { updateAgendaEvent } from '@/services/agenda'

export default function TechnicalCalendar({ events }: { events: AgendaEvent[] }) {
  const [fcEvents, setFcEvents] = useState<any[]>([])

  useEffect(() => {
    setFcEvents((events || []).map(e => {
      // Define colors by tipo_tarefa: rotina (4) = green, renovação (1) & inspeção inicial (2) = yellow
      let backgroundColor: string | undefined
      let borderColor: string | undefined
      let textColor: string | undefined
  const tipoId = (e.tipo_tarefa_id != null ? Number(e.tipo_tarefa_id) : undefined)
      if (tipoId === 4) {
        backgroundColor = '#16a34a' // green-600
        borderColor = '#15803d' // green-700
        textColor = '#ffffff'
      } else if (tipoId === 1 || tipoId === 2) {
        backgroundColor = '#eab308' // yellow-500
        borderColor = '#ca8a04' // yellow-600
        textColor = '#1f2937' // gray-800 for readability on yellow
      }
      return ({
      id: e.id,
      title: e.title || `Tarefa ${e.tarefa_id}`,
      start: e.start_date,
      end: e.end_date,
        extendedProps: { tarefa_id: e.tarefa_id, description: e.description, tipo_tarefa_id: e.tipo_tarefa_id },
        backgroundColor,
        borderColor,
        textColor,
      })
    }))
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
        editable
        eventDrop={async (info: any) => {
          // Fired when an event is dragged and dropped to a new date/time
          try {
            const id = Number(info.event.id)
            const startIso = info.event.start ? info.event.start.toISOString().slice(0,19).replace('T',' ') : undefined
            const endIso = info.event.end ? info.event.end.toISOString().slice(0,19).replace('T',' ') : undefined
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
            const startIso = info.event.start ? info.event.start.toISOString().slice(0,19).replace('T',' ') : undefined
            const endIso = info.event.end ? info.event.end.toISOString().slice(0,19).replace('T',' ') : undefined
            await updateAgendaEvent(id, { start: startIso, end: endIso })
          } catch (e) {
            console.error('Falha ao redimensionar evento:', e)
            info.revert()
            alert('Não foi possível atualizar o evento')
          }
        }}
        eventClick={(info: any) => {
          // future: open task details
          alert(`${info.event.title} (tarefa ${info.event.extendedProps.tarefa_id})`)
        }}
      />
    </div>
  )
}
