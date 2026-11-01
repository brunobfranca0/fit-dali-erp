import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const value = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`)
    : new Date(date)
  return new Intl.DateTimeFormat('pt-BR').format(value)
}

export function getLocalDateISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function calculatePrice(quantity: number, priceUnit: number, priceC10: number, priceC20: number): {
  total: number
  bundles: { c20: number; c10: number; un: number }
  savings: number
} {
  const c20 = Math.floor(quantity / 20)
  const c10 = Math.floor((quantity % 20) / 10)
  const un = quantity % 10

  const total = c20 * priceC20 + c10 * priceC10 + un * priceUnit
  const fullPrice = quantity * priceUnit
  const savings = fullPrice - total

  return {
    total: Math.round(total * 100) / 100,
    bundles: { c20, c10, un },
    savings: Math.round(savings * 100) / 100,
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60',
    preparing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60',
    ready: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900/60',
    delivered: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
    paid: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900/60',
    partial: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    paid: 'Pago',
    partial: 'Parcial',
  }
  return labels[status] || status
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function addDaysISO(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T12:00:00`)
  date.setDate(date.getDate() + days)
  return getLocalDateISO(date)
}

export function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

export function formatDateLabel(dateISO: string): string {
  const today = getLocalDateISO()
  if (dateISO === today) return 'Hoje'
  if (dateISO === addDaysISO(today, 1)) return 'Amanhã'
  if (dateISO === addDaysISO(today, -1)) return 'Ontem'
  return capitalizeFirst(new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .format(new Date(`${dateISO}T12:00:00`)))
}

export function shortOrderId(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

/** Applies the Brazilian phone mask while the user types. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function getWhatsAppLink(phone: string, message?: string): string | null {
  let digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  if (digits.length <= 11) digits = `55${digits}`
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

/** Downloads rows as a CSV that opens correctly in Excel pt-BR (BOM + semicolon). */
export function downloadCSV(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const escape = (cell: string | number | null | undefined) => {
    if (cell === null || cell === undefined) return ''
    const value = typeof cell === 'number' ? String(cell).replace('.', ',') : cell
    return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }
  const content = '\uFEFF' + rows.map(row => row.map(escape).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const ORDER_STATUS_FLOW: Record<string, { next: string; label: string } | undefined> = {
  pending: { next: 'confirmed', label: 'Confirmar' },
  confirmed: { next: 'preparing', label: 'Preparar' },
  preparing: { next: 'ready', label: 'Pronto' },
  ready: { next: 'delivered', label: 'Entregar' },
}

export const PAYMENT_METHODS = ['PIX', 'Cartão', 'Dinheiro'] as const
