// src/services/export.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Task } from './tasks'

export interface ExportOptions {
  title: string
  from?: string
  to?: string
}

export async function exportTasksToPdf(tasks: Task[], options: ExportOptions): Promise<Blob> {
  // Build a simple HTML structure for the PDF
  const wrapper = document.createElement('div')
  wrapper.style.width = '800px'
  wrapper.style.padding = '20px'
  wrapper.style.fontFamily = 'Arial, Helvetica, sans-serif'
  wrapper.style.color = '#111827'

  const title = document.createElement('h1')
  title.style.fontSize = '20px'
  title.style.margin = '0 0 8px 0'
  title.textContent = options.title
  wrapper.appendChild(title)

  if (options.from || options.to) {
    const sub = document.createElement('div')
    sub.style.fontSize = '12px'
    sub.style.marginBottom = '12px'
    sub.textContent = `${options.from || ''} ${options.from && options.to ? '—' : ''} ${options.to || ''}`.trim()
    wrapper.appendChild(sub)
  }

  // Group by date (prazo) in ascending order
  const grouped: Record<string, Task[]> = {}
  tasks.forEach(t => {
    const d = t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : 'Sem data'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(t)
  })

  const dates = Object.keys(grouped).sort((a,b)=> {
    if (a === 'Sem data') return 1
    if (b === 'Sem data') return -1
    return new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime()
  })

  dates.forEach(date => {
    const h = document.createElement('h2')
    h.style.fontSize = '14px'
    h.style.margin = '12px 0 6px 0'
    h.textContent = date
    wrapper.appendChild(h)

    const list = document.createElement('ul')
    list.style.margin = '0 0 8px 16px'
    grouped[date].forEach(t => {
      const li = document.createElement('li')
      li.style.marginBottom = '6px'
      li.style.fontSize = '12px'
      // Syntax: Nome da Empresa (Finalidade)
      li.textContent = `${t.empresa || ''} (${t.finalidade || ''})`
      list.appendChild(li)
    })
    wrapper.appendChild(list)
  })

  document.body.appendChild(wrapper)
  try {
    const canvas = await html2canvas(wrapper, { scale: 2 })
    const imgData = canvas.toDataURL('image PNG')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const imgProps = (pdf as any).getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    const blob = pdf.output('blob')
    return blob
  } finally {
    // cleanup
    wrapper.remove()
  }
}
