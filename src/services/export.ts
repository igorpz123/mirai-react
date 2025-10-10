// src/services/export.ts
import jsPDF from 'jspdf'
import type { Task } from './tasks'
import { getTasksByResponsavel } from './tasks'
import { formatDateBRSafe, isDateOnlyYMD, normalizeToYMD, compareYMD } from '@/lib/date'

export interface ExportOptions {
  title: string
  from?: string
  to?: string
}

export async function exportTasksToPdf(tasks: Task[], options: ExportOptions): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const fmtBR = (iso?: string) => formatDateBRSafe(iso)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const titleBase = (options.title && options.title.trim()) ? options.title.trim() : 'Agenda'
  const rangeText = (options.from || options.to)
    ? ` (${fmtBR(options.from)}${options.from && options.to ? ' — ' : ''}${fmtBR(options.to)})`
    : ''
  doc.text(`${titleBase}${rangeText}`, margin, y)
  y += 18

  // Group by date (prazo) in ascending order
  const grouped: Record<string, Task[]> = {}
  tasks.forEach(t => {
    const ymd = normalizeToYMD(t.prazo)
    const key = ymd ? formatDateBRSafe(ymd) : 'Sem data'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })
  const dates = Object.keys(grouped).sort((a,b)=> {
    if (a === 'Sem data') return 1
    if (b === 'Sem data') return -1
    // convert back to Y-M-D for comparison
    const ay = normalizeToYMD(a)
    const by = normalizeToYMD(b)
    if (ay && by) return compareYMD(ay, by)
    return a.localeCompare(b)
  })

  const addTextBlock = (text: string, fontSize = 10, bold = false, indent = 0) => {
    if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    for (const line of lines) {
      if (y + 14 > pageHeight - margin) { doc.addPage(); y = margin }
      doc.text(line, margin + indent, y)
      y += 14
    }
  }

  dates.forEach(date => {
    // Section title (date)
    addTextBlock(date, 12, true)
    // Items
    grouped[date].forEach(t => {
      const line = `${t.empresa || ''} (${t.finalidade || ''})`
      addTextBlock(`• ${line}`, 10, false, 12)
    })
    y += 4
  })

  return doc.output('blob')
}

export async function exportMultipleUsersAgendaToPdf(userIds: Array<{ id: number; nome?: string }>, range?: { from?: string; to?: string }): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addTextBlock = (text: string, fontSize = 10, bold = false, indent = 0) => {
    if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    for (const line of lines) {
      if (y + 14 > pageHeight - margin) { doc.addPage(); y = margin }
      doc.text(line, margin + indent, y)
      y += 14
    }
  }

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const fmtBR = (iso?: string) => formatDateBRSafe(iso)
  const titleRange = (range?.from || range?.to)
    ? ` (${fmtBR(range?.from)}${range?.from && range?.to ? ' — ' : ''}${fmtBR(range?.to)})`
    : ''
  doc.text(`Agenda por Técnico${titleRange}`, margin, y)
  y += 18

  for (const u of userIds) {
    // Section Header
  const header = u.nome ? `${u.nome}` : `Técnico`
    addTextBlock(header, 12, true)

    const res = await getTasksByResponsavel(u.id)
    const tasks = (res.tasks || []).filter(t => {
      const ymd = normalizeToYMD(t.prazo)
      if (!ymd) return false
      // Range filtering: treat range.from/to as date-only if provided as YYYY-MM-DD; otherwise fallback to Date
      if (range?.from) {
        const rf = normalizeToYMD(range.from) || range.from
        if (typeof rf === 'string' && isDateOnlyYMD(rf)) {
          if (compareYMD(ymd, rf) < 0) return false
        } else {
          try { if (new Date(ymd) < new Date(range.from)) return false } catch {}
        }
      }
      if (range?.to) {
        const rt = normalizeToYMD(range.to) || range.to
        if (typeof rt === 'string' && isDateOnlyYMD(rt)) {
          if (compareYMD(ymd, rt) > 0) return false
        } else {
          try { if (new Date(ymd) > new Date(range.to)) return false } catch {}
        }
      }
      return true
    })

    const grouped: Record<string, Task[]> = {}
    tasks.forEach(t => {
      const ymd = normalizeToYMD(t.prazo)
      const key = ymd ? formatDateBRSafe(ymd) : 'Sem data'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(t)
    })
    const dates = Object.keys(grouped).sort((a,b)=> {
      if (a === 'Sem data') return 1
      if (b === 'Sem data') return -1
      const ay = normalizeToYMD(a)
      const by = normalizeToYMD(b)
      if (ay && by) return compareYMD(ay, by)
      return a.localeCompare(b)
    })

    dates.forEach(date => {
      addTextBlock(date, 11, true)
      grouped[date].forEach(t => {
        const line = `${t.empresa || ''} (${t.finalidade || ''})`
        addTextBlock(`• ${line}`, 10, false, 12)
      })
      y += 4
    })

    // small spacing between users
    y += 6
  }

  return doc.output('blob')
}
