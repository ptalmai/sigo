'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTheme } from '@/hooks/useTheme'
import { useWindowSize } from '@/hooks/useWindowSize'
import type { BurnVsExecutionPoint } from '@/types'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  const { isDark } = useTheme()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 shadow-xl text-xs"
      style={{
        border: `1px solid ${isDark ? '#1e2235' : '#E2E8F0'}`,
        background: isDark ? '#13151e' : '#FFFFFF',
        color: isDark ? '#e2e8f0' : '#0F172A',
      }}
    >
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  )
}

export function BurnVsExecutionChart({ data }: { data: BurnVsExecutionPoint[] }) {
  const { isDark } = useTheme()
  const { width } = useWindowSize()
  const isMobile = width < 768

  const COLORS = {
    grid: isDark ? '#1e2235' : '#E2E8F0',
    tick: isDark ? '#64748b' : '#94A3B8',
    label: isDark ? '#94a3b8' : '#64748B',
    axisLine: isDark ? '#1e2235' : '#E2E8F0',
    cursor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
  }

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">Nenhum projeto ativo.</p>
  }

  // Mobile: show at most 5 projects
  const displayData = isMobile ? data.slice(0, 5) : data
  const chartHeight = isMobile ? 260 : Math.max(220, displayData.length * 52)
  const yAxisWidth = isMobile ? 100 : 140

  return (
    <div className={isMobile ? 'overflow-y-auto max-h-[280px]' : ''}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
          barSize={10}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={11}
            tick={{ fill: COLORS.tick }}
            axisLine={{ stroke: COLORS.axisLine }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nome"
            width={yAxisWidth}
            fontSize={isMobile ? 10 : 11}
            tick={{ fill: COLORS.label }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => isMobile && v.length > 14 ? v.slice(0, 14) + '…' : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.cursor }} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: COLORS.label, paddingTop: '12px' }}
          />
          <Bar dataKey="verba_pct" name="% Verba Utilizada" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          <Bar dataKey="execucao_pct" name="% Execução Física" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
