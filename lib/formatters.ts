// ============================================================
// SIGO v2.0 — Formatters
// ============================================================

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPct(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/** Format DD/MM/YYYY string for display (pass-through, already correct format) */
export function formatDate(ddmmyyyy: string): string {
  return ddmmyyyy
}

/** Format saving/deficit with sign: "+R$ X,XX" or "-R$ X,XX" */
export function formatSaving(value: number): string {
  if (value === 0) return 'R$ 0,00'
  const abs = Math.abs(value)
  const sign = value > 0 ? '+' : '-'
  return `${sign} ${formatBRL(abs)}`
}

/** Parse DD/MM/YYYY → Date object (midnight UTC) */
export function parseBRDate(ddmmyyyy: string): Date {
  const [day, month, year] = ddmmyyyy.split('/').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/** Format relative time: "há X minutos", "há X horas", etc. */
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'agora mesmo'
  if (diffMin === 1) return 'há 1 minuto'
  if (diffMin < 60) return `há ${diffMin} minutos`
  const diffH = Math.floor(diffMin / 60)
  if (diffH === 1) return 'há 1 hora'
  return `há ${diffH} horas`
}
