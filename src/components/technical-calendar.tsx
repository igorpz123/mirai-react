import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBr from '@fullcalendar/core/locales/pt-br'
import type { AgendaEvent } from '@/services/agenda'
import { updateAgendaEvent } from '@/services/agenda'
import './technical-calendar.css'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TechnicalCalendar(
  { events, currentMonth, onMonthChange }: { events: AgendaEvent[]; currentMonth?: Date; onMonthChange?: (d: Date) => void }
) {
  const [fcEvents, setFcEvents] = useState<any[]>([])
  const calendarRef = useRef<FullCalendar | null>(null)
  const isSyncingRef = useRef(false)

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [formDate, setFormDate] = useState('') // YYYY-MM-DD
  const [formStart, setFormStart] = useState('') // HH:MM
  const [formEnd, setFormEnd] = useState('') // HH:MM (optional)
  const [formError, setFormError] = useState<string | null>(null)
  const [origDurationMs, setOrigDurationMs] = useState(0)

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toYMDLocal = (dt: Date) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
  const toHMLocal = (dt: Date) => `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
  const toSqlLocal = (dt: Date) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`

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

  // Sync calendar view when parent-selected month changes
  useEffect(() => {
    if (!currentMonth || !calendarRef.current) return
    try {
      const api = calendarRef.current.getApi()
      const viewDate = api.getDate()
      const needsChange = viewDate.getFullYear() !== currentMonth.getFullYear() || viewDate.getMonth() !== currentMonth.getMonth()
      if (needsChange) {
        // mark that we're changing the view programmatically to avoid emitting onMonthChange
        isSyncingRef.current = true
        api.gotoDate(currentMonth)
      }
    } catch {}
  }, [currentMonth])

  return (
    <div className="bg-background rounded-lg border p-2 text-sm">
      <FullCalendar
        ref={calendarRef as any}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
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
          // User navigated in the calendar; notify parent unless this was our own programmatic change
          const d = new Date(info.start.getFullYear(), info.start.getMonth(), 1)
          if (isSyncingRef.current) { isSyncingRef.current = false; return }
          const sameMonth = currentMonth && d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()
          if (!sameMonth && onMonthChange) onMonthChange(d)
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
          // Open pretty modal for editing date and time
          const ev = info.event
          const start: Date | null = ev.start ? new Date(ev.start) : null
          const end: Date | null = ev.end ? new Date(ev.end) : null
          if (!start) return
          setSelectedEvent(ev)
          setFormDate(toYMDLocal(start))
          setFormStart(toHMLocal(start))
          setFormEnd(end ? toHMLocal(end) : '')
          setOrigDurationMs(end ? (end.getTime() - start.getTime()) : 0)
          setFormError(null)
          setEditOpen(true)
        }}
      />

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!editing) setEditOpen(v) }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Alterar agendamento</DialogTitle>
            <DialogDescription>Defina a nova data e horário do evento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-date">Data</Label>
              <Input id="edit-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="edit-start">Início</Label>
                <Input id="edit-start" type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="edit-end">Fim (opcional)</Label>
                <Input id="edit-end" type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            {formError ? <div className="text-sm text-destructive">{formError}</div> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={editing} onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button className="button-primary" disabled={editing} onClick={async () => {
              if (!selectedEvent) return
              setFormError(null)
              // Basic validation
              const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(formDate)
              const timeOk = /^\d{2}:\d{2}$/.test(formStart)
              const endOk = !formEnd || /^\d{2}:\d{2}$/.test(formEnd)
              if (!dateOk || !timeOk || !endOk) {
                setFormError('Preencha data e horas válidas (formato AAAA-MM-DD e HH:MM).')
                return
              }
              const [y, m, d] = formDate.split('-').map(n => Number(n))
              const [h, mi] = formStart.split(':').map(n => Number(n))
              const startDate = new Date(y, m - 1, d, h, mi, 0)
              let endDate: Date | null = null
              if (formEnd) {
                const [eh, emi] = formEnd.split(':').map(n => Number(n))
                endDate = new Date(y, m - 1, d, eh, emi, 0)
                if (endDate.getTime() <= startDate.getTime()) {
                  setFormError('Horário final deve ser maior que o início.')
                  return
                }
              } else if (origDurationMs > 0) {
                endDate = new Date(startDate.getTime() + origDurationMs)
              }

              try {
                setEditing(true)
                const startSql = toSqlLocal(startDate)
                const endSql = endDate ? toSqlLocal(endDate) : undefined
                await updateAgendaEvent(Number(selectedEvent.id), { start: startSql, end: endSql })

                // Optimistic UI update
                try {
                  if (typeof (selectedEvent as any).setDates === 'function') {
                    (selectedEvent as any).setDates(startDate, endDate || undefined)
                  } else {
                    selectedEvent.setStart(startDate)
                    if (endDate) selectedEvent.setEnd(endDate)
                  }
                } catch {}

                // Notify parent to adjust month and refresh
                if (onMonthChange) {
                  const refMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                  onMonthChange(refMonth)
                }

                setEditOpen(false)
              } catch (e) {
                console.error('Falha ao salvar alterações do evento:', e)
                setFormError('Não foi possível salvar as alterações.')
              } finally {
                setEditing(false)
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
