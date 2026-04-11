'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatBRL } from '@/lib/formatters'
import type { SavingDeficitPoint } from '@/types'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="rounded-lg border border-[#1e2235] bg-[#13151e] p-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-slate-200">{label}</p>
      <p className={v >= 0 ? 'text-green-400' : 'text-red-400'}>
        {v >= 0 ? 'Saving' : 'Déficit'}: <strong>{v >= 0 ? '+' : ''}{formatBRL(v)}</strong>
      </p>
    </div>
  )
}

export function SavingDeficitChart({ data }: { data: SavingDeficitPoint[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">Sem lançamentos no mês corrente.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barSize={14}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e2235" />
        <XAxis
          type="number"
          tickFormatter={(v) => {
            const abs = Math.abs(v)
            return abs >= 1000 ? `R$${(abs / 1000).toFixed(0)}k` : `R$${abs}`
          }}
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
        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.valor >= 0 ? '#22c55e' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
