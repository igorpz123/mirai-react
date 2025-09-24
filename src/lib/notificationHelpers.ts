import type { RTNotification } from '@/contexts/RealtimeContext'

function humanizeType(t?: string) {
  if (!t) return ''
  return String(t).replace(/[_\.\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function summarizeNotification(n: RTNotification) {
  const meta = n.metadata || {}
  const message = String(n.message || '')
  const metaTitle = meta.title ? String(meta.title).trim() : ''
  const metaDesc = meta.description ? String(meta.description).trim() : ''

  // Prefer explicit metadata title when available
  let title = metaTitle
  let description = metaDesc || message

  if (!title) {
    // Try first line of message
    const firstLine = message.split(/\r?\n/)[0] || ''
    if (firstLine && firstLine.length <= 80) title = firstLine
    else if (message.length > 0) title = (firstLine || message).slice(0, 80)
    else title = humanizeType(n.type) || 'Notificação'
  }

  // If description is same as title (short), try to use full message instead
  if (!description || description === title) description = message

  // Ensure title is concise
  if (title.length > 60) title = title.slice(0, 57).trim() + '...'

  // Ensure description is not empty
  if (!description) description = humanizeType(n.type) || 'Sem descrição'

  return { title, description }
}
