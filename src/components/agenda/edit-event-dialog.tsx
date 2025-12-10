import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { deleteAgendaEvent, updateAgendaEvent, type AgendaEvent } from '@/services/agenda'
import { Trash2 } from 'lucide-react'

export type EditEventDialogProps = {
  event: AgendaEvent
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => Promise<void> | void
  onUpdated?: () => Promise<void> | void
}

function EditEventDialogImpl({ event, open, onOpenChange, onDeleted, onUpdated }: EditEventDialogProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  const pad = (n: number) => String(n).padStart(2, '0')

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title || '')
      setDescription(event.description || '')
      
      const start = event.start_date ? new Date(event.start_date.replace(' ', 'T')) : null
      if (start) {
        setStartDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`)
        setStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`)
      }
      
      const end = event.end_date ? new Date(event.end_date.replace(' ', 'T')) : null
      if (end) {
        setEndDate(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`)
        setEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`)
      } else {
        setEndDate('')
        setEndTime('')
      }
    }
  }, [event])

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return
    
    setMsg(null)
    try {
      setDeleting(true)
      await deleteAgendaEvent(event.id)
      onOpenChange(false)
      if (onDeleted) await onDeleted()
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao deletar evento')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSave() {
    setMsg(null)
    
    // Validation
    if (!title.trim()) {
      setMsg('Título é obrigatório')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{2}:\d{2}$/.test(startTime)) {
      setMsg('Data e hora de início são obrigatórias')
      return
    }
    
    // Build start datetime
    const [y, m, d] = startDate.split('-').map(Number)
    const [h, mi] = startTime.split(':').map(Number)
    const start = new Date(y, m - 1, d, h, mi, 0)
    const toSqlLocal = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
    
    let end: Date | null = null
    if (endDate && endTime) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !/^\d{2}:\d{2}$/.test(endTime)) {
        setMsg('Data/hora final inválida')
        return
      }
      const [ye, me, de] = endDate.split('-').map(Number)
      const [he, mie] = endTime.split(':').map(Number)
      end = new Date(ye, me - 1, de, he, mie, 0)
      if (end.getTime() <= start.getTime()) {
        setMsg('Fim deve ser maior que o início')
        return
      }
    }
    
    try {
      setEditing(true)
      await updateAgendaEvent(event.id, {
        title: title.trim(),
        description: description.trim() || null,
        start: toSqlLocal(start),
        end: end ? toSqlLocal(end) : undefined
      })
      onOpenChange(false)
      if (onUpdated) await onUpdated()
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao atualizar evento')
    } finally {
      setEditing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !(deleting || editing) && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Editar Evento</DialogTitle>
              <DialogDescription>Alterar informações do evento da agenda</DialogDescription>
            </div>
            <Button  
              size="icon"
              disabled={deleting || editing} 
              onClick={handleDelete}
              className="h-8 w-8 button-remove mr-6"
              title="Deletar evento"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1">
            <Label htmlFor="edit-title">Título *</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Visita técnica" />
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="edit-desc">Observações (opcional)</Label>
            <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do evento" rows={3} />
          </div>

          <div className="grid gap-1">
            <Label>Início *</Label>
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

          {event.tarefa_id && (
            <div className="grid gap-1">
              <Label>Tarefa vinculada</Label>
              <div className="text-sm text-muted-foreground">#{event.tarefa_id}</div>
            </div>
          )}

          {msg && <div className="text-sm text-destructive">{msg}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={deleting || editing} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="button-primary" disabled={deleting || editing} onClick={handleSave}>
            {editing ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const EditEventDialog = React.memo(EditEventDialogImpl)

export default EditEventDialog
