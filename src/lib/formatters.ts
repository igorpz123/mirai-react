/**
 * Cached formatters for better performance
 * These formatters are created once and reused across the application
 */

// Cached date/time formatters
export const dateFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  dateStyle: 'short' 
})

export const dateTimeFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  dateStyle: 'short', 
  timeStyle: 'short' 
})

export const dateTimeFullFormatterBR = new Intl.DateTimeFormat('pt-BR', { 
  dateStyle: 'medium', 
  timeStyle: 'medium' 
})

// Cached currency formatter
export const currencyFormatterBR = new Intl.NumberFormat('pt-BR', { 
  style: 'currency', 
  currency: 'BRL' 
})

// Cached number formatter
export const numberFormatterBR = new Intl.NumberFormat('pt-BR')

// Cached decimal formatter
export const decimalFormatterBR = new Intl.NumberFormat('pt-BR', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})

// Helper functions using cached formatters
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return currencyFormatterBR.format(0)
  return currencyFormatterBR.format(Number(value))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? '—' : dateFormatterBR.format(d)
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? '—' : dateTimeFormatterBR.format(d)
}

export function formatDateTimeFull(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? '—' : dateTimeFullFormatterBR.format(d)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return numberFormatterBR.format(0)
  return numberFormatterBR.format(Number(value))
}

export function formatDecimal(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return decimalFormatterBR.format(0)
  return decimalFormatterBR.format(Number(value))
}
