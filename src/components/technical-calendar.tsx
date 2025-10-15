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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function TechnicalCalendar(
  { events, currentMonth, onMonthChange }: { events: AgendaEvent[]; currentMonth?: Date; onMonthChange?: (d: Date) => void }
) {
  const [fcEvents, setFcEvents] = useState<any[]>([])
  const calendarRef = useRef<FullCalendar | null>(null)
  // Removido sync complexo; apenas refletimos eventos e deixamos FullCalendar navegar livremente.

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [formDate, setFormDate] = useState('') // YYYY-MM-DD
  const [formStart, setFormStart] = useState('') // HH:MM
  const [formEnd, setFormEnd] = useState('') // HH:MM (optional)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [origDurationMs, setOrigDurationMs] = useState(0)

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toYMDLocal = (dt: Date) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
  const toHMLocal = (dt: Date) => `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
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
          // Open pretty modal for editing date and time
          const ev = info.event
          const start: Date | null = ev.start ? new Date(ev.start) : null
          const end: Date | null = ev.end ? new Date(ev.end) : null
          if (!start) return
          setSelectedEvent(ev)
          setFormDate(toYMDLocal(start))
          setFormStart(toHMLocal(start))
          setFormEnd(end ? toHMLocal(end) : '')
          setFormTitle(String(ev.title || ''))
          const desc = ev.extendedProps?.description ?? ''
          setFormDesc(typeof desc === 'string' ? desc : '')
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
            <DialogDescription>Edite as informações do evento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="edit-desc">Descrição</Label>
              <Textarea id="edit-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
            </div>
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
              const titleOk = formTitle.trim().length > 0
              if (!dateOk || !timeOk || !endOk || !titleOk) {
                setFormError(!titleOk ? 'O título é obrigatório.' : 'Preencha data e horas válidas (formato AAAA-MM-DD e HH:MM).')
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
                await updateAgendaEvent(Number(selectedEvent.id), { start: startSql, end: endSql, title: formTitle.trim(), description: formDesc.trim() || null })

                // Optimistic UI update
                try {
                  if (typeof (selectedEvent as any).setDates === 'function') {
                    (selectedEvent as any).setDates(startDate, endDate || undefined)
                  } else {
                    selectedEvent.setStart(startDate)
                    if (endDate) selectedEvent.setEnd(endDate)
                  }
                  selectedEvent.setProp('title', formTitle.trim())
                  selectedEvent.setExtendedProp('description', formDesc.trim() || null)
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
