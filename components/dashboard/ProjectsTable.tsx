'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { formatBRL, formatDate } from '@/lib/formatters'
import { HealthScoreBadge } from '@/components/shared/HealthScoreBadge'
import { ProjectStatusBadge } from '@/components/shared/StatusBadge'
import type { ProjectWithMetrics, HealthScoreStatus } from '@/types'

type SortKey =
  | 'nome_projeto'
  | 'status'
  | 'valor_aprovado'
  | 'valor_gasto'
  | 'verba_utilizada_pct'
  | 'percentual_execucao'
  | 'health_score'
  | 'saving_deficit'

const HEALTH_ORDER: Record<HealthScoreStatus, number> = { 'Em Risco': 0, 'Atenção': 1, 'Saudável': 2 }

function getSortValue(p: ProjectWithMetrics, key: SortKey): number | string {
  switch (key) {
    case 'nome_projeto': return p.nome_projeto
    case 'status': return p.status
    case 'valor_aprovado': return p.valor_aprovado
    case 'valor_gasto': return p.metrics.valor_gasto
    case 'verba_utilizada_pct': return p.metrics.verba_utilizada_pct ?? -1
    case 'percentual_execucao': return p.percentual_execucao
    case 'health_score': return HEALTH_ORDER[p.metrics.health_score]
    case 'saving_deficit': return p.metrics.saving_deficit ?? 0
  }
}

interface Props {
  projects: ProjectWithMetrics[]
}

function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-[#1e2235]">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600 dark:text-slate-400">{Math.round(value)}%</span>
    </div>
  )
}

export function ProjectsTable({ projects }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('health_score')
  const [sortAsc, setSortAsc] = useState(true)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = [...projects].sort((a, b) => {
    const av = getSortValue(a, sortKey)
    const bv = getSortValue(b, sortKey)
    const cmp =
      typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv, 'pt-BR')
        : Number(av) - Number(bv)
    return sortAsc ? cmp : -cmp
  })

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col
    return (
      <button
        onClick={() => handleSort(col)}
        className={`ml-1 inline-flex items-center transition-colors ${active ? 'text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400'}`}
        aria-label={`Ordenar por ${col}`}
      >
        <ArrowUpDown className="h-3 w-3" />
      </button>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center dark:border-[#1e2235] dark:bg-[#13151e]">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum projeto encontrado na planilha.</p>
        <p className="mt-1 text-sm text-slate-500">Verifique se a aba &apos;projetos&apos; está preenchida corretamente.</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-[#1e2235] dark:bg-[#13151e]">
      <table className="w-full text-sm">
        <caption className="sr-only">Tabela de projetos com métricas orçamentárias</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#1e2235]">
            {[
              { label: 'Projeto', col: 'nome_projeto' as SortKey },
              { label: 'Última OP', col: null },
              { label: 'Início', col: null },
              { label: 'Fim', col: null },
              { label: 'Aprovado', col: 'valor_aprovado' as SortKey, right: true },
              { label: 'Gasto', col: 'valor_gasto' as SortKey, right: true },
              { label: '% Verba', col: 'verba_utilizada_pct' as SortKey },
              { label: '% Execução', col: 'percentual_execucao' as SortKey },
              { label: 'Health', col: 'health_score' as SortKey },
              { label: 'Status', col: 'status' as SortKey },
            ].map(({ label, col, right }) => (
              <th
                key={label}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${right ? 'text-right' : 'text-left'}`}
              >
                {label}
                {col && <SortBtn col={col} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-[#1e2235]">
          {sorted.map((p) => {
            const verbaPct = p.metrics.verba_utilizada_pct ?? 0
            const verbColorClass =
              p.metrics.health_score === 'Em Risco'
                ? 'bg-red-500'
                : p.metrics.health_score === 'Atenção'
                ? 'bg-yellow-400'
                : 'bg-violet-500'
            return (
              <tr
                key={p.nome_projeto}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1a1d2a]"
              >
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{p.nome_projeto}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">{p.metrics.ultima_op || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{formatDate(p.data_inicio)}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{formatDate(p.data_fim)}</td>
                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatBRL(p.valor_aprovado)}</td>
                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatBRL(p.metrics.valor_gasto)}</td>
                <td className="px-4 py-3">
                  <ProgressBar value={verbaPct} colorClass={verbColorClass} />
                </td>
                <td className="px-4 py-3">
                  <ProgressBar value={p.percentual_execucao} colorClass="bg-green-500" />
                </td>
                <td className="px-4 py-3">
                  <HealthScoreBadge
                    status={p.metrics.health_score}
                    verba_pct={p.metrics.verba_utilizada_pct}
                    execucao_pct={p.percentual_execucao}
                  />
                </td>
                <td className="px-4 py-3">
                  <ProjectStatusBadge status={p.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
