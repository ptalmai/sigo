'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatBRL } from '@/lib/formatters'
import { useTheme } from '@/hooks/useTheme'
import type { ProjectSavingData, SavingTimelinePoint } from '@/types'

function MonthTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
}) {
  const { isDark } = useTheme()
  if (!active || !payload?.length) return null
  const cmm = payload.find((p) => p.name === 'cmm')?.value ?? 0
  const pago = payload.find((p) => p.name === 'pago')?.value ?? 0
  const saving = cmm - pago
  const isSaving = saving >= 0
  return (
    <div
      className="rounded-lg p-3 shadow-xl text-xs min-w-[170px]"
      style={{
        border: `1px solid ${isDark ? '#1e2235' : '#E2E8F0'}`,
        background: isDark ? '#0d0f17' : '#FFFFFF',
      }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Valor Aprovado (VA)</span>
          <span className={`tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatBRL(cmm)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Pago</span>
          <span className={`tabular-nums font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatBRL(pago)}</span>
        </div>
        <div
          className={`flex justify-between gap-4 border-t pt-2 font-semibold ${isSaving ? 'text-green-400' : 'text-red-400'}`}
          style={{ borderColor: isDark ? '#1e2235' : '#E2E8F0' }}
        >
          <span>{isSaving ? 'Saving' : 'Déficit'}</span>
          <span className="tabular-nums">{isSaving ? '+' : ''}{formatBRL(saving)}</span>
        </div>
        {cmm > 0 && (
          <p className={`text-right text-[10px] ${isSaving ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(Math.round(((cmm - pago) / cmm) * 100))}% do VA
          </p>
        )}
      </div>
    </div>
  )
}

function ProjectMiniChart({ data }: { data: ProjectSavingData }) {
  const { isDark } = useTheme()
  const isSaving = data.totalSaving >= 0
  const pct = data.totalCmm > 0
    ? Math.abs(Math.round((data.totalSaving / data.totalCmm) * 100))
    : 0

  const COLORS = {
    grid: isDark ? '#1e2235' : '#E2E8F0',
    tick: isDark ? '#64748b' : '#94A3B8',
    cursor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    va: isDark ? '#fb923c' : '#ea580c',
  }

  const accentColor = isSaving ? '#22c55e' : '#ef4444'

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white dark:border-[#1e2235] dark:bg-[#0d0f17] overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
              {data.nome_projeto}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              VA médio:{' '}
              <span className="text-orange-400 font-semibold">{formatBRL(data.cmm)}</span>
              <span className="text-slate-500">/mês</span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isSaving ? 'text-green-500' : 'text-red-500'}`}>
              {isSaving ? 'Saving' : 'Déficit'}
            </p>
            <p className={`text-xl font-bold tabular-nums leading-tight mt-0.5 ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
              {isSaving ? '+' : ''}{formatBRL(data.totalSaving)}
            </p>
            <p className={`text-xs mt-0.5 ${isSaving ? 'text-green-600 dark:text-green-700' : 'text-red-600 dark:text-red-700'}`}>
              {pct}% do VA
            </p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart
            data={data.months}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barSize={data.months.length > 8 ? 12 : 20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="mes"
              fontSize={10}
              tick={{ fill: COLORS.tick }}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <YAxis hide />
            <Tooltip content={<MonthTooltip />} cursor={{ fill: COLORS.cursor }} />
            <Bar dataKey="pago" name="pago" radius={[3, 3, 0, 0]}>
              {data.months.map((m: SavingTimelinePoint, i: number) => (
                <Cell key={i} fill={m.saving >= 0 ? '#7c3aed' : '#ef4444'} opacity={0.85} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cmm"
              name="cmm"
              stroke={COLORS.va}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: COLORS.va }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer strip */}
      <div className="grid grid-cols-2 border-t border-slate-100 dark:border-[#1e2235]">
        <div className="px-4 py-2.5 border-r border-slate-100 dark:border-[#1e2235]">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">Pago</p>
          <p className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(data.totalPago)}</p>
        </div>
        <div className="px-4 py-2.5 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">Previsto</p>
          <p className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{formatBRL(data.totalCmm)}</p>
        </div>
      </div>
    </div>
  )
}

export function SavingChart({ data }: { data: ProjectSavingData[] }) {
  const { isDark } = useTheme()

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-500">Sem pagamentos registrados.</p>
        <p className="mt-1 text-xs text-slate-500">O gráfico exibe projetos com lançamentos do tipo &quot;Pago&quot;.</p>
      </div>
    )
  }

  const totalCmm = data.reduce((s, d) => s + d.totalCmm, 0)
  const totalPago = data.reduce((s, d) => s + d.totalPago, 0)
  const totalSaving = totalCmm - totalPago
  const isSaving = totalSaving >= 0

  return (
    <div className="space-y-5">
      {/* Global summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 dark:bg-[#13151e] dark:border-[#1e2235]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total VA</p>
          <p className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatBRL(totalCmm)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 dark:bg-[#13151e] dark:border-[#1e2235]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Pago</p>
          <p className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatBRL(totalPago)}</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 ${isSaving ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isSaving ? 'text-green-500' : 'text-red-500'}`}>
            {isSaving ? 'Saving Total' : 'Déficit Total'}
          </p>
          <p className={`text-base font-bold tabular-nums ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
            {isSaving ? '+' : ''}{formatBRL(totalSaving)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 inline-block" style={{ borderTop: `2px dashed ${isDark ? '#fb923c' : '#ea580c'}` }} />
          Valor Aprovado (VA)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500 inline-block" />
          Pago (saving)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />
          Pago (déficit)
        </span>
      </div>

      {/* Project cards grid */}
      <div className={`grid gap-4 ${data.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {data.map((d) => (
          <ProjectMiniChart key={d.nome_projeto} data={d} />
        ))}
      </div>
    </div>
  )
}
