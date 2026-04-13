'use client'

import { formatBRL, formatDate } from '@/lib/formatters'
import { HealthScoreBadge } from '@/components/shared/HealthScoreBadge'
import { ProjectStatusBadge } from '@/components/shared/StatusBadge'
import type { ProjectWithMetrics, HealthScoreStatus } from '@/types'

const HEALTH_ORDER: Record<HealthScoreStatus, number> = { 'Em Risco': 0, 'Atenção': 1, 'Saudável': 2 }

function ProgressBar({ value, colorClass, label }: { value: number; colorClass: string; label: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[11px] text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-[#1e2235]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[11px] tabular-nums text-slate-600 dark:text-slate-400">{Math.round(value)}%</span>
    </div>
  )
}

function ProjectCard({ project: p }: { project: ProjectWithMetrics }) {
  const verbaPct = p.metrics.verba_utilizada_pct ?? 0
  const verbColorClass =
    p.metrics.health_score === 'Em Risco'
      ? 'bg-red-500'
      : p.metrics.health_score === 'Atenção'
      ? 'bg-yellow-400'
      : 'bg-violet-500'

  const saving = p.metrics.saving_deficit
  const hasSaving = saving !== null
  const isSaving = (saving ?? 0) >= 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1e2235] dark:bg-[#13151e]">
      {/* Badges */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <HealthScoreBadge
          status={p.metrics.health_score}
          verba_pct={p.metrics.verba_utilizada_pct}
          execucao_pct={p.percentual_execucao}
        />
        <ProjectStatusBadge status={p.status} />
      </div>

      {/* Nome */}
      <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug">{p.nome_projeto}</p>

      {/* Datas + OP */}
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#1e2235]">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Início: <span className="text-slate-700 dark:text-slate-300">{formatDate(p.data_inicio)}</span></span>
          <span>Fim: <span className="text-slate-700 dark:text-slate-300">{formatDate(p.data_fim)}</span></span>
        </div>
        {p.metrics.ultima_op && (
          <p className="mt-1 text-[11px] text-slate-500">
            Última OP: <span className="font-mono text-slate-600 dark:text-slate-400">{p.metrics.ultima_op}</span>
          </p>
        )}
      </div>

      {/* Valores */}
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#1e2235] space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Aprovado</span>
          <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatBRL(p.valor_aprovado)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Gasto</span>
          <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatBRL(p.metrics.valor_gasto)}</span>
        </div>
      </div>

      {/* Barras de progresso */}
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#1e2235] space-y-2">
        <ProgressBar value={verbaPct} colorClass={verbColorClass} label="Verba" />
        <ProgressBar value={p.percentual_execucao} colorClass="bg-green-500" label="Execução" />
      </div>

      {/* Saving/Déficit */}
      {hasSaving && (
        <div className={`mt-3 border-t pt-2 dark:border-[#1e2235] border-slate-100 flex justify-between text-xs font-semibold ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
          <span>{isSaving ? 'Saving mês' : 'Déficit mês'}</span>
          <span className="tabular-nums">{isSaving ? '+' : ''}{formatBRL(saving!)}</span>
        </div>
      )}
    </div>
  )
}

export function ProjectCards({ projects }: { projects: ProjectWithMetrics[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-12 text-center dark:border-[#1e2235] dark:bg-[#13151e]">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum projeto encontrado.</p>
      </div>
    )
  }

  const sorted = [...projects].sort((a, b) =>
    HEALTH_ORDER[a.metrics.health_score] - HEALTH_ORDER[b.metrics.health_score]
  )

  return (
    <div className="space-y-3">
      {sorted.map((p) => (
        <ProjectCard key={p.nome_projeto} project={p} />
      ))}
    </div>
  )
}
