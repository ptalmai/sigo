// ── Domain validation ──────────────────────────────────────────────────────

// NEXT_PUBLIC_ para client-side, ALLOWED_EMAIL_DOMAINS para server-side
const ALLOWED_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ??
  process.env.ALLOWED_EMAIL_DOMAINS ??
  ''
).split(',').map(d => d.trim().toLowerCase()).filter(Boolean)

export function isDomainAllowed(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return ALLOWED_DOMAINS.includes(domain)
}

// ── Password validation ────────────────────────────────────────────────────

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

export function getPasswordStrength(password: string): 'fraca' | 'média' | 'forte' {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return 'fraca'
  if (score <= 3) return 'média'
  return 'forte'
}

// ── Avatar helpers ─────────────────────────────────────────────────────────

export function getInitials(email: string): string {
  const name = email.split('@')[0] ?? ''
  const parts = name.split('.')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  '#7c3aed', // purple
  '#2563eb', // blue
  '#059669', // green
  '#d97706', // amber
  '#dc2626', // red
  '#0891b2', // cyan
  '#7c3aed', // purple (repeat for variety)
  '#9333ea', // violet
]

export function getAvatarColor(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Security questions ─────────────────────────────────────────────────────

export const SECURITY_QUESTIONS = [
  'Qual o nome da cidade onde você nasceu?',
  'Qual o nome do seu primeiro animal de estimação?',
  'Qual o sobrenome da sua mãe?',
  'Qual o nome da sua escola primária?',
  'Qual o modelo do seu primeiro carro?',
]
