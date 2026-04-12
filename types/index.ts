// ============================================================
// SIGO v2.0 — Types (Google Sheets source, read-only)
// ============================================================

export type ProjectStatus = 'Ativo' | 'Pausado' | 'Concluído'
export type PaymentStatus = 'Previsto' | 'Pago'
export type HealthScoreStatus = 'Saudável' | 'Atenção' | 'Em Risco'

// ── Raw data from Google Sheets ───────────────────────────────

/** Raw row from the `projetos` sheet */
export interface RawProject {
  nome_projeto: string
  status: ProjectStatus
  data_inicio: string   // DD/MM/YYYY
  data_fim: string      // DD/MM/YYYY
  valor_aprovado: number
  percentual_execucao: number
}

/** Raw row from the `lancamentos` sheet */
export interface RawLancamento {
  nome_projeto: string
  ordem_pagamento: string
  data_lancamento: string  // DD/MM/YYYY
  categoria: string
  valor: number
  status_pagamento: PaymentStatus
}

// ── Calculated metrics ────────────────────────────────────────

export interface ProjectMetrics {
  /** SUM(lancamentos.valor WHERE status='Pago') */
  valor_gasto: number
  /** valor_gasto / valor_aprovado * 100 — null if budget = 0 */
  verba_utilizada_pct: number | null
  /** health score based on delta between verba_utilizada_pct and percentual_execucao */
  health_score: HealthScoreStatus
  delta: number
  /** saving (positive) or déficit (negative) for current month — null if N/A */
  saving_deficit: number | null
  /** most recent OP by date */
  ultima_op: string
}

export interface ProjectWithMetrics extends RawProject {
  metrics: ProjectMetrics
}

// ── Chart data ────────────────────────────────────────────────

export interface BurnVsExecutionPoint {
  nome: string
  verba_pct: number
  execucao_pct: number
}

export interface SavingDeficitPoint {
  nome: string
  valor: number   // positive = saving, negative = déficit
}

/** One month of data for a single project's saving chart */
export interface SavingTimelinePoint {
  mes: string       // "Jan/25"
  cmm: number       // CMM do projeto (constante)
  pago: number      // Pagamento Real (Pago only) naquele mês
  saving: number    // cmm - pago (positive = saving, negative = déficit)
}

/**
 * Lookup: nome_projeto → mes (lowercase, e.g. "jan/25") → valor aprovado naquele mês
 * Lido da aba "Valores aprovados". Quando disponível, substitui o CMM linear.
 */
export type ValoresAprovadosMensais = Record<string, Record<string, number>>

/** Per-project saving data for small-multiples chart */
export interface ProjectSavingData {
  nome_projeto: string
  cmm: number                    // CMM fixo do projeto
  months: SavingTimelinePoint[]
  totalSaving: number            // Σ saving across all months
  totalPago: number
  totalCmm: number               // cmm * months with any activity
}
