// ============================================================
// SIGO v2.0 — Google Sheets API v4 (server-side only)
// ============================================================

import { google } from 'googleapis'
import type { RawProject, RawLancamento, ProjectStatus, PaymentStatus, ValoresAprovadosMensais } from '@/types'
import { parseBRDate } from './formatters'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

// ── Auth ─────────────────────────────────────────────────────

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!
  // Accept both plain JSON and base64-encoded JSON (Vercel-safe)
  const keyJson = raw.trimStart().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf-8')
  const key = JSON.parse(keyJson) as {
    client_email: string
    private_key: string
  }

  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

// ── Raw sheet reader ──────────────────────────────────────────

async function readSheet(range: string): Promise<string[][]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })
    return (response.data.values ?? []) as string[][]
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Log which sheet names actually exist to help diagnose name mismatches
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties.title' })
      const titles = meta.data.sheets?.map((s) => s.properties?.title).join(', ')
      console.warn(`[SIGO] Erro ao ler range "${range}": ${msg}`)
      console.warn(`[SIGO] Abas disponíveis na planilha: ${titles}`)
    } catch {
      console.warn(`[SIGO] Erro ao ler range "${range}": ${msg}`)
    }
    return []
  }
}

// ── Parsers ───────────────────────────────────────────────────

function parseNumber(raw: string): number {
  if (!raw) return 0
  // Strip R$, %, spaces, thousand-separator dots; swap decimal comma → dot
  const cleaned = raw.replace(/[R$%\s]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function parseProjectStatus(raw: string): ProjectStatus {
  const s = raw?.trim()
  if (s === 'Pausado') return 'Pausado'
  if (s === 'Concluído' || s === 'Concluido') return 'Concluído'
  // Map common variants to Ativo
  return 'Ativo'
}

function parsePaymentStatus(raw: string): PaymentStatus {
  return raw === 'Pago' ? 'Pago' : 'Previsto'
}

/** Normalize D/M/YYYY or DD/MM/YYYY → DD/MM/YYYY */
function normalizeBRDate(raw: string): string {
  if (!raw) return ''
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return raw
  const [d, m, y] = parts
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

/** Validate D/M/YYYY or DD/MM/YYYY */
function isValidDate(raw: string): boolean {
  if (!raw) return false
  const normalized = normalizeBRDate(raw)
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return false
  try {
    parseBRDate(normalized)
    return true
  } catch {
    return false
  }
}

// ── Public API ────────────────────────────────────────────────

export async function fetchProjects(): Promise<RawProject[]> {
  const rows = await readSheet('projetos!A2:F')
  console.log(`[SIGO] projetos: ${rows.length} linhas lidas`)
  const projects: RawProject[] = []

  for (const row of rows) {
    const [nome, status, data_inicio_raw, data_fim_raw, valor_raw, pct_raw] = row
    if (!nome?.trim()) continue

    const data_inicio = normalizeBRDate(data_inicio_raw ?? '')
    const data_fim = normalizeBRDate(data_fim_raw ?? '')

    if (!isValidDate(data_inicio) || !isValidDate(data_fim)) {
      console.warn(`[SIGO] Projeto "${nome}" ignorado: datas inválidas ("${data_inicio_raw}", "${data_fim_raw}")`)
      continue
    }

    projects.push({
      nome_projeto: nome.trim(),
      status: parseProjectStatus(status),
      data_inicio,
      data_fim,
      valor_aprovado: parseNumber(valor_raw),
      percentual_execucao: Math.min(100, Math.max(0, parseNumber(pct_raw))),
    })
  }

  console.log(`[SIGO] projetos válidos: ${projects.length}`)
  return projects
}

export async function fetchLancamentos(): Promise<RawLancamento[]> {
  const rows = await readSheet('lancamentos!A2:F')
  console.log(`[SIGO] lancamentos: ${rows.length} linhas lidas`)
  const lancamentos: RawLancamento[] = []

  for (const row of rows) {
    const [nome, op, data_raw, categoria, valor_raw, status_raw] = row
    if (!nome?.trim()) continue

    const data = normalizeBRDate(data_raw ?? '')

    if (!isValidDate(data)) {
      console.warn(`[SIGO] Lançamento "${op}" ignorado: data inválida ("${data_raw}")`)
      continue
    }

    lancamentos.push({
      nome_projeto: nome.trim(),
      ordem_pagamento: op?.trim() ?? '',
      data_lancamento: data,
      categoria: categoria?.trim() ?? '',
      valor: parseNumber(valor_raw),
      status_pagamento: parsePaymentStatus(status_raw),
    })
  }

  console.log(`[SIGO] lancamentos válidos: ${lancamentos.length}`)
  return lancamentos
}

export async function fetchValoresAprovados(): Promise<ValoresAprovadosMensais> {
  const rows = await readSheet('Valores aprovados!A1:ZZ')
  if (rows.length < 2) return {}

  const [header, ...dataRows] = rows
  // header[0] = "Projeto", header[1..] = month labels e.g. "Jan/25"
  const monthCols = header.slice(1).map((h) => h?.trim().toLowerCase() ?? '')

  const result: ValoresAprovadosMensais = {}
  for (const row of dataRows) {
    const nome = row[0]?.trim()
    if (!nome) continue
    result[nome] = {}
    monthCols.forEach((mes, i) => {
      if (!mes) return
      const val = parseNumber(row[i + 1] ?? '')
      if (val > 0) result[nome][mes] = val
    })
  }

  console.log(`[SIGO] valores aprovados mensais: ${Object.keys(result).length} projetos`)
  return result
}

export async function fetchAllSheetData() {
  const [projects, lancamentos, valoresAprovados] = await Promise.all([
    fetchProjects(),
    fetchLancamentos(),
    fetchValoresAprovados(),
  ])

  // Warn about lancamentos with no matching project
  const projectNames = new Set(projects.map((p) => p.nome_projeto))
  for (const l of lancamentos) {
    if (!projectNames.has(l.nome_projeto)) {
      console.warn(
        `[SIGO] Lançamento "${l.ordem_pagamento}" ignorado: projeto "${l.nome_projeto}" não encontrado`,
      )
    }
  }

  // Filter lancamentos to only those with matching projects
  const validLancamentos = lancamentos.filter((l) =>
    projectNames.has(l.nome_projeto),
  )

  return { projects, lancamentos: validLancamentos, valoresAprovados, fetchedAt: new Date() }
}
