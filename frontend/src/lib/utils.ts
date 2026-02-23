import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isPast, isToday, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: de })
  } catch {
    return dateStr
  }
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: de })
  } catch {
    return dateStr
  }
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  try {
    const d = parseISO(dateStr)
    return isPast(d) && !isToday(d)
  } catch {
    return false
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'aktiv': return 'bg-green-100 text-green-800'
    case 'pausiert': return 'bg-yellow-100 text-yellow-800'
    case 'abgeschlossen': return 'bg-gray-100 text-gray-600'
    case 'offen': return 'bg-blue-100 text-blue-800'
    case 'in_arbeit': return 'bg-amber-100 text-amber-800'
    case 'done': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'aktiv': return 'Aktiv'
    case 'pausiert': return 'Pausiert'
    case 'abgeschlossen': return 'Abgeschlossen'
    case 'offen': return 'Offen'
    case 'in_arbeit': return 'In Arbeit'
    case 'done': return 'Erledigt'
    default: return status
  }
}

export function goalStatusColor(status: string): string {
  switch (status) {
    case 'offen': return 'bg-blue-100 text-blue-800'
    case 'in_arbeit': return 'bg-amber-100 text-amber-800'
    case 'erreicht': return 'bg-green-100 text-green-800'
    case 'nicht_erreicht': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function goalStatusLabel(status: string): string {
  switch (status) {
    case 'offen': return 'Offen'
    case 'in_arbeit': return 'In Arbeit'
    case 'erreicht': return 'Erreicht'
    case 'nicht_erreicht': return 'Nicht erreicht'
    default: return status
  }
}

export function goalCategoryColor(category: string): string {
  switch (category) {
    case 'fachlich': return 'bg-blue-50 text-blue-700'
    case 'persoenlich': return 'bg-purple-50 text-purple-700'
    case 'fuehrung': return 'bg-indigo-50 text-indigo-700'
    default: return 'bg-gray-50 text-gray-700'
  }
}

export function goalCategoryLabel(category: string): string {
  switch (category) {
    case 'fachlich': return 'Fachlich'
    case 'persoenlich': return 'Persönlich'
    case 'fuehrung': return 'Führung'
    default: return category
  }
}

export function devPriorityColor(priority: string): string {
  switch (priority) {
    case 'hoch': return 'bg-red-100 text-red-700'
    case 'mittel': return 'bg-amber-100 text-amber-700'
    case 'niedrig': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function devPriorityLabel(priority: string): string {
  switch (priority) {
    case 'hoch': return 'Hoch'
    case 'mittel': return 'Mittel'
    case 'niedrig': return 'Niedrig'
    default: return priority
  }
}

export function measureStatusColor(status: string): string {
  switch (status) {
    case 'offen': return 'bg-blue-100 text-blue-800'
    case 'in_arbeit': return 'bg-amber-100 text-amber-800'
    case 'erledigt': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function measureStatusLabel(status: string): string {
  switch (status) {
    case 'offen': return 'Offen'
    case 'in_arbeit': return 'In Arbeit'
    case 'erledigt': return 'Erledigt'
    default: return status
  }
}

export function performanceRatingLabel(rating: string): string {
  switch (rating) {
    case 'uebertroffen': return 'Übertroffen'
    case 'voll': return 'Voll erfüllt'
    case 'teilweise': return 'Teilweise erfüllt'
    case 'unzureichend': return 'Unzureichend'
    default: return rating
  }
}

export function performanceRatingColor(rating: string): string {
  switch (rating) {
    case 'uebertroffen': return 'bg-emerald-100 text-emerald-700'
    case 'voll': return 'bg-green-100 text-green-700'
    case 'teilweise': return 'bg-amber-100 text-amber-700'
    case 'unzureichend': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function talentPoolLabel(value: string): string {
  switch (value) {
    case 'vertikal': return 'Vertikal'
    case 'horizontal': return 'Horizontal'
    case 'kein_wert': return 'Kein Wert'
    default: return value
  }
}

export function changeInterestLabel(value: string): string {
  switch (value) {
    case 'option_a': return 'Option A — Verbleib auf Position'
    case 'option_b': return 'Option B — Veränderungsinteresse'
    default: return value
  }
}

export function trainingStatusLabel(status: string): string {
  switch (status) {
    case 'vorgeschlagen': return 'Vorgeschlagen'
    case 'genehmigt': return 'Genehmigt'
    case 'abgeschlossen': return 'Abgeschlossen'
    default: return status
  }
}

export function trainingStatusColor(status: string): string {
  switch (status) {
    case 'vorgeschlagen': return 'bg-blue-100 text-blue-700'
    case 'genehmigt': return 'bg-amber-100 text-amber-700'
    case 'abgeschlossen': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  green:   { bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  red:     { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-700',    dot: 'bg-pink-500' },
  indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  teal:    { bg: 'bg-teal-100',    text: 'text-teal-700',    dot: 'bg-teal-500' },
}

export function daysAgo(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  try {
    return differenceInDays(new Date(), parseISO(dateStr))
  } catch {
    return null
  }
}

export const MOOD_EMOJIS = ['', '\u{1F61E}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'] as const
export const MOOD_LABELS = ['', 'Schlecht', 'Eher schlecht', 'Neutral', 'Gut', 'Sehr gut'] as const

export function getNextAnniversary(startDateStr: string | null | undefined): { years: number; daysUntil: number } | null {
  if (!startDateStr) return null
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = parseISO(startDateStr)
    const currentYear = today.getFullYear()
    let years = currentYear - start.getFullYear()
    const nextAnniv = new Date(currentYear, start.getMonth(), start.getDate())
    if (nextAnniv < today) {
      years++
      nextAnniv.setFullYear(currentYear + 1)
    }
    if (years < 1) return null
    const daysUntil = Math.round((nextAnniv.getTime() - today.getTime()) / 86400000)
    return { years, daysUntil }
  } catch {
    return null
  }
}
