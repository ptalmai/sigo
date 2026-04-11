// ============================================================
// SIGO v2.0 — Business Logic (server-side only)
// ============================================================

import { differenceInCalendarMonths, startOfMonth, endOfMonth, isWithinInterval, addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { parseBRDate } from './formatters'
import type {
  RawProject,
  RawLancamento,
  ProjectMetrics,
  ProjectWithMetrics,
  HealthScoreStatus,
  BurnVsExecutionPoint,
  SavingDeficitPoint,
  SavingTimelinePoint,
  ProjectSavingData,
} from '@/types'

// ── Health Score ──────────────────────────────────────────────

function computeHealthScore(
  verba_pct: number | null,
  execucao_pct: number,
): { status: HealthScoreStatus; delta: number } {
  if (verba_pct === null) return { status: 'Saudável', delta: 0 }
  const delta = verba_pct - execucao_pct
  const status: HealthScoreStatus =
    delta > 10 ? 'Em Risco' : delta >= 1 ? 'Atenção' : 'Saudável'
  return { status, delta }
}

// ── Project Metrics ───────────────────────────────────────────

export function computeProjectMetrics(
  project: RawProject,
  lancamentos: RawLancamento[],
  referenceDate: Date = new Date(),
): ProjectMetrics {
  const projectLancamentos = lancamentos.filter(
    (l) => l.nome_projeto === project.nome_projeto,
  )

  // Verba utilizada: only Pago
  const valor_gasto = projectLancamentos
    .filter((l) => l.status_pagamento === 'Pago')
    .reduce((sum, l) => sum + l.valor, 0)

  const verba_utilizada_pct =
    project.valor_aprovado > 0
      ? (valor_gasto / project.valor_aprovado) * 100
      : null

  const { status: health_score, delta } = computeHealthScore(
    verba_utilizada_pct,
    project.percentual_execucao,
  )

  // Saving/Déficit: only Pago, current month
  const startDate = parseBRDate(project.data_inicio)
  const endDate = parseBRDate(project.data_fim)
  const rawMonths = differenceInCalendarMonths(endDate, startDate)
  const durationMonths = Math.max(rawMonths, 1)
  const valor_medio_mes =
    project.valor_aprovado > 0 ? project.valor_aprovado / durationMonths : null

  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)

  const gasto_real_mes = projectLancamentos
    .filter(
      (l) =>
        l.status_pagamento === 'Pago' &&
        isWithinInterval(parseBRDate(l.data_lancamento), {
          start: monthStart,
          end: monthEnd,
        }),
    )
    .reduce((sum, l) => sum + l.valor, 0)

  const saving_deficit =
    valor_medio_mes !== null ? valor_medio_mes - gasto_real_mes : null

  // Última OP: most recent by date
  const pagos = [...projectLancamentos].sort((a, b) => {
    const dateA = parseBRDate(a.data_lancamento)
    const dateB = parseBRDate(b.data_lancamento)
    return dateB.getTime() - dateA.getTime()
  })
  const ultima_op = pagos.length > 0 ? pagos[0].ordem_pagamento : '—'

  return {
    valor_gasto,
    verba_utilizada_pct,
    health_score,
    delta,
    saving_deficit,
    ultima_op,
  }
}

// ── All Projects ──────────────────────────────────────────────

export function computeAllProjects(
  projects: RawProject[],
  lancamentos: RawLancamento[],
): ProjectWithMetrics[] {
  return projects
    .map((p) => ({
      ...p,
      metrics: computeProjectMetrics(p, lancamentos),
    }))
    .sort((a, b) => {
      // Default sort: Em Risco first, then Atenção, then Saudável
      const order: Record<HealthScoreStatus, number> = {
        'Em Risco': 0,
        'Atenção': 1,
        'Saudável': 2,
      }
      return order[a.metrics.health_score] - order[b.metrics.health_score]
    })
}

// ── Chart data ────────────────────────────────────────────────

export function buildBurnVsExecutionData(
  projects: ProjectWithMetrics[],
): BurnVsExecutionPoint[] {
  return [...projects]
    .sort(
      (a, b) =>
        (b.metrics.verba_utilizada_pct ?? 0) -
        (a.metrics.verba_utilizada_pct ?? 0),
    )
    .map((p) => ({
      nome: p.nome_projeto.length > 22 ? p.nome_projeto.slice(0, 22) + '…' : p.nome_projeto,
      verba_pct: Math.round(p.metrics.verba_utilizada_pct ?? 0),
      execucao_pct: p.percentual_execucao,
    }))
}

export function buildSavingDeficitData(
  projects: ProjectWithMetrics[],
): SavingDeficitPoint[] {
  return projects
    .filter((p) => p.metrics.saving_deficit !== null)
    .map((p) => ({
      nome: p.nome_projeto.length > 22 ? p.nome_projeto.slice(0, 22) + '…' : p.nome_projeto,
      valor: Math.round(p.metrics.saving_deficit!),
    }))
    .sort((a, b) => a.valor - b.valor) // deficit first
}

// ── Saving Per Project (small multiples) ─────────────────────
// For each project: computes its own CMM and compares it with actual
// payments per month. Correctly isolates the per-project racional.

export function buildSavingTimelineData(
  projects: ProjectWithMetrics[],
  lancamentos: RawLancamento[],
): ProjectSavingData[] {
  if (projects.length === 0) return []

  return projects
    .map((p): ProjectSavingData | null => {
      const projectLancamentos = lancamentos.filter(
        (l) => l.nome_projeto === p.nome_projeto && l.status_pagamento === 'Pago',
      )
      if (projectLancamentos.length === 0) return null

      // CMM for this project (fixed)
      const startDate = parseBRDate(p.data_inicio)
      const endDate = parseBRDate(p.data_fim)
      const duration = Math.max(differenceInCalendarMonths(endDate, startDate), 1)
      const cmm = p.valor_aprovado > 0 ? p.valor_aprovado / duration : 0

      // Monthly timeline: from earliest to latest payment of this project
      const timestamps = projectLancamentos.map((l) => parseBRDate(l.data_lancamento).getTime())
      const minDate = startOfMonth(new Date(Math.min(...timestamps)))
      const maxDate = startOfMonth(new Date(Math.max(...timestamps)))

      const months: SavingTimelinePoint[] = []
      let cursor = minDate

      while (cursor <= maxDate) {
        const monthStart = startOfMonth(cursor)
        const monthEnd = endOfMonth(cursor)

        const pago = projectLancamentos
          .filter((l) =>
            isWithinInterval(parseBRDate(l.data_lancamento), {
              start: monthStart,
              end: monthEnd,
            }),
          )
          .reduce((sum, l) => sum + l.valor, 0)

        months.push({
          mes: format(cursor, 'MMM/yy', { locale: ptBR }),
          cmm: Math.round(cmm),
          pago: Math.round(pago),
          saving: Math.round(cmm - pago),
        })

        cursor = addMonths(cursor, 1)
      }

      const totalPago = months.reduce((s, m) => s + m.pago, 0)
      const totalCmm = months.reduce((s, m) => s + m.cmm, 0)

      return {
        nome_projeto: p.nome_projeto,
        cmm: Math.round(cmm),
        months,
        totalSaving: totalCmm - totalPago,
        totalPago,
        totalCmm,
      }
    })
    .filter((d): d is ProjectSavingData => d !== null)
}
