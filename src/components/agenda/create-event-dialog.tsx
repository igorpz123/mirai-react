import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createAgendaEvent } from '@/services/agenda'

function toSqlLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function hexToRgbString(hex: string): string | null {
  let h = hex.trim()
  if (!h) return null
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return null
  return `rgb(${r}, ${g}, ${b})`
}

export type CreateEventDialogProps = {
  usuarioId: number
  onCreated?: () => Promise<void> | void
  triggerClassName?: string
}

function CreateEventDialogImpl({ usuarioId, onCreated, triggerClassName }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [colorHex, setColorHex] = useState('#22c55e') // default green
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [tarefaId, setTarefaId] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{2}:\d{2}$/.test(startTime)
  }, [title, startDate, startTime])

  async function handleSubmit() {
    setMsg(null)
    if (!usuarioId || Number.isNaN(usuarioId)) { setMsg('Usuário inválido'); return }
    if (!canSubmit) { setMsg('Preencha título, data e hora inicial'); return }
    const [y, m, d] = startDate.split('-').map(Number)
    const [hh, mm] = startTime.split(':').map(Number)
    const start = new Date(y, m - 1, d, hh, mm, 0)
    let end: Date | null = null
    if (endDate && endTime) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !/^\d{2}:\d{2}$/.test(endTime)) {
        setMsg('Informe data/hora final válidas')
        return
      }
      const [ye, me, de] = endDate.split('-').map(Number)
      const [he, me2] = endTime.split(':').map(Number)
      end = new Date(ye, me - 1, de, he, me2, 0)
      if (end.getTime() <= start.getTime()) { setMsg('Fim deve ser maior que o início'); return }
    }

    // convert color to rgb() if needed
    let color: string | undefined = undefined
    if (colorHex) {
      const rgb = hexToRgbString(colorHex)
      color = rgb || colorHex
    }

    try {
      setCreating(true)
      await createAgendaEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        start: toSqlLocal(start),
        end: end ? toSqlLocal(end) : undefined,
        tarefa_id: tarefaId.trim() ? Number(tarefaId) : null,
        usuario_id: usuarioId,
      })
      // reset minimal fields and close
      setTitle(''); setDescription(''); setStartDate(''); setStartTime(''); setEndDate(''); setEndTime(''); setTarefaId('')
      setOpen(false)
      if (onCreated) await onCreated()
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao criar evento')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !creating && setOpen(v)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={triggerClassName}>Novo evento</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Novo evento da agenda</DialogTitle>
          <DialogDescription>Preencha os campos do evento. Tarefa ID é opcional.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="ev-title">Título</Label>
            <Input id="ev-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Visita técnica" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="ev-desc">Descrição (opcional)</Label>
            <Textarea id="ev-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do evento" />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="grid gap-1">
              <Label htmlFor="ev-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input id="ev-color" type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="h-9 w-12 rounded-md border-input border bg-transparent p-1" />
                <span className="text-xs text-muted-foreground">{colorHex}</span>
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ev-tarefa">Tarefa ID (opcional)</Label>
              <Input id="ev-tarefa" value={tarefaId} onChange={e => setTarefaId(e.target.value)} placeholder="ex: 12345" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Início</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Fim (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          </div>
          {msg ? <div className="text-sm text-destructive">{msg}</div> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={creating} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="button-primary" disabled={!canSubmit || creating} onClick={handleSubmit}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const CreateEventDialog = React.memo(CreateEventDialogImpl)

export default CreateEventDialog
