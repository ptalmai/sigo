'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { BurnVsExecutionPoint } from '@/types'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#1e2235] bg-[#13151e] p-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-slate-200">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  )
}

export function BurnVsExecutionChart({ data }: { data: BurnVsExecutionPoint[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">Nenhum projeto ativo.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barSize={10}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e2235" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          fontSize={11}
          tick={{ fill: '#64748b' }}
          axisLine={{ stroke: '#1e2235' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={140}
          fontSize={11}
          tick={{ fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '12px' }}
        />
        <Bar dataKey="verba_pct" name="% Verba Utilizada" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        <Bar dataKey="execucao_pct" name="% Execução Física" fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
