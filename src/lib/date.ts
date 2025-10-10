// Safe date helpers focused on date-only (YYYY-MM-DD) values to avoid timezone shifts

// Returns true when the string is exactly YYYY-MM-DD
export function isDateOnlyYMD(value?: string | null): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

// Try to normalize any common date string to YYYY-MM-DD (best-effort)
export function normalizeToYMD(value?: string | null): string | null {
  if (!value) return null
  const s = String(value).trim()
  if (!s) return null
  // already Y-M-D
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // ISO or SQL datetime -> take first 10 chars (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:?\d{0,2}/.test(s)) return s.slice(0, 10)
  // dd/MM/yyyy -> convert
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

// Format a date (preferably date-only) to pt-BR without constructing Date for YYYY-MM-DD
export function formatDateBRSafe(value?: string | null): string {
  if (!value) return ''
  const s = String(value)
  if (isDateOnlyYMD(s)) {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR')
  } catch { /* ignore */ }
  return s
}

// Compare two YYYY-MM-DD strings (assumes valid) lexicographically
export function compareYMD(a: string, b: string): number {
  return a.localeCompare(b)
}
