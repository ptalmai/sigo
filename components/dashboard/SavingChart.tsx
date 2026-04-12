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
import type { ProjectSavingData, SavingTimelinePoint } from '@/types'

function MonthTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const cmm = payload.find((p) => p.name === 'cmm')?.value ?? 0
  const pago = payload.find((p) => p.name === 'pago')?.value ?? 0
  const saving = cmm - pago
  const isSaving = saving >= 0
  return (
    <div className="rounded-lg border border-[#1e2235] bg-[#0d0f17] p-3 shadow-xl text-xs min-w-[170px]">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Valor Aprovado (VA)</span>
          <span className="tabular-nums text-slate-200">{formatBRL(cmm)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Pago</span>
          <span className="tabular-nums text-slate-200">{formatBRL(pago)}</span>
        </div>
        <div className={`flex justify-between gap-4 border-t border-[#1e2235] pt-1.5 font-semibold ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
          <span>{isSaving ? 'Saving' : 'Déficit'}</span>
          <span className="tabular-nums">{isSaving ? '+' : ''}{formatBRL(saving)}</span>
        </div>
        {cmm > 0 && (
          <p className={`text-right text-[10px] ${isSaving ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(Math.round(((cmm - pago) / cmm) * 100))}%
          </p>
        )}
      </div>
    </div>
  )
}

function ProjectMiniChart({ data }: { data: ProjectSavingData }) {
  const isSaving = data.totalSaving >= 0
  const pct = data.totalCmm > 0
    ? Math.abs(Math.round((data.totalSaving / data.totalCmm) * 100))
    : 0

  return (
    <div className="rounded-xl border border-[#1e2235] bg-[#0d0f17] p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-200">{data.nome_projeto}</p>
          <p className="text-[10px] text-slate-500">
            VA total aprovado:{' '}
            <span className="text-orange-400 font-medium">{formatBRL(data.totalCmm)}</span>
          </p>
        </div>
        <div className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-center ${isSaving ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <p className={`text-[10px] font-medium ${isSaving ? 'text-green-500' : 'text-red-500'}`}>
            {isSaving ? 'Saving' : 'Déficit'}
          </p>
          <p className={`text-sm font-bold tabular-nums leading-tight ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
            {isSaving ? '+' : ''}{formatBRL(data.totalSaving)}
          </p>
          <p className={`text-[10px] ${isSaving ? 'text-green-600' : 'text-red-600'}`}>{pct}%</p>
        </div>
      </div>

      {/* Mini chart */}
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart
          data={data.months}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          barSize={data.months.length > 8 ? 10 : 16}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2235" />
          <XAxis
            dataKey="mes"
            fontSize={9}
            tick={{ fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="pago" name="pago" radius={[3, 3, 0, 0]}>
            {data.months.map((m: SavingTimelinePoint, i: number) => (
              <Cell key={i} fill={m.saving >= 0 ? '#7c3aed' : '#ef4444'} opacity={0.85} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="cmm"
            name="cmm"
            stroke="#fb923c"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, fill: '#fb923c' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Month totals strip */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
        <span>Pago: <span className="text-slate-400 tabular-nums">{formatBRL(data.totalPago)}</span></span>
        <span>Previsto: <span className="text-slate-400 tabular-nums">{formatBRL(data.totalCmm)}</span></span>
      </div>
    </div>
  )
}

export function SavingChart({ data }: { data: ProjectSavingData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-500">Sem pagamentos registrados.</p>
        <p className="mt-1 text-xs text-slate-600">O gráfico exibe projetos com lançamentos do tipo &quot;Pago&quot;.</p>
      </div>
    )
  }

  // Global totals
  const totalCmm = data.reduce((s, d) => s + d.totalCmm, 0)
  const totalPago = data.reduce((s, d) => s + d.totalPago, 0)
  const totalSaving = totalCmm - totalPago
  const isSaving = totalSaving >= 0

  return (
    <div className="space-y-4">
      {/* Global summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#13151e] px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total VA</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-200">{formatBRL(totalCmm)}</p>
        </div>
        <div className="rounded-lg bg-[#13151e] px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total Pago</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-200">{formatBRL(totalPago)}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 text-center ${isSaving ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <p className={`text-[10px] font-medium uppercase tracking-wider ${isSaving ? 'text-green-500' : 'text-red-500'}`}>
            {isSaving ? 'Saving Total' : 'Déficit Total'}
          </p>
          <p className={`mt-0.5 text-sm font-bold tabular-nums ${isSaving ? 'text-green-400' : 'text-red-400'}`}>
            {isSaving ? '+' : ''}{formatBRL(totalSaving)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 inline-block" style={{ borderTop: '2px dashed #fb923c' }} />
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

      {/* Small multiples grid */}
      <div className={`grid gap-4 ${data.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {data.map((d) => (
          <ProjectMiniChart key={d.nome_projeto} data={d} />
        ))}
      </div>
    </div>
  )
}
