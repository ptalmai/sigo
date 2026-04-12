export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { fetchAllSheetData } from '@/lib/sheets'
import { computeAllProjects } from '@/lib/calculations'
import { formatBRL, formatRelativeTime } from '@/lib/formatters'
import { SkeletonTable, SkeletonCharts } from '@/components/shared/SkeletonTable'
import { RefreshButton } from '@/components/shared/RefreshButton'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { AlertTriangle, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

async function DashboardContent() {
  let data
  try {
    data = await fetchAllSheetData()
  } catch (err) {
    console.error('[SIGO] Erro ao buscar dados do Google Sheets:', err)
    throw err
  }

  const { projects: rawProjects, lancamentos, valoresAprovados, fetchedAt } = data
  const projects = computeAllProjects(rawProjects, lancamentos)

  // KPI aggregates
  const totalAprovado = projects.reduce((s, p) => s + p.valor_aprovado, 0)
  const totalGasto = projects.reduce((s, p) => s + p.metrics.valor_gasto, 0)
  const emRisco = projects.filter((p) => p.metrics.health_score === 'Em Risco').length
  const atencao = projects.filter((p) => p.metrics.health_score === 'Atenção').length
  const saudavel = projects.filter((p) => p.metrics.health_score === 'Saudável').length

  const kpis = [
    {
      label: 'Orçamento Total',
      value: formatBRL(totalAprovado),
      icon: <DollarSign className="h-4 w-4 text-violet-400" />,
      accent: 'border-violet-500/30 bg-violet-500/5',
      sub: `${projects.length} projeto${projects.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Total Gasto',
      value: formatBRL(totalGasto),
      icon: <TrendingUp className="h-4 w-4 text-blue-400" />,
      accent: 'border-blue-500/30 bg-blue-500/5',
      sub: totalAprovado > 0 ? `${Math.round((totalGasto / totalAprovado) * 100)}% do orçamento` : '—',
    },
    {
      label: 'Em Risco',
      value: String(emRisco),
      icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
      accent: 'border-red-500/30 bg-red-500/5',
      sub: `${atencao} em atenção`,
    },
    {
      label: 'Saudável',
      value: String(saudavel),
      icon: <CheckCircle2 className="h-4 w-4 text-green-400" />,
      accent: 'border-green-500/30 bg-green-500/5',
      sub: `de ${projects.length} projetos`,
    },
  ]

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 backdrop-blur dark:border-[#1e2235] dark:bg-[#0a0c12]/80">
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Executivo</h1>
          <p className="text-[10px] text-slate-500">Portfólio · {projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            Atualizado {formatRelativeTime(fetchedAt)}
          </span>
          <ThemeToggle />
          <RefreshButton />
        </div>
      </header>

      <main className="space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className={`rounded-xl border p-4 ${k.accent}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{k.label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-[#1e2235]">
                  {k.icon}
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{k.value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{k.sub}</p>
            </div>
          ))}
        </div>

      </main>

      <DashboardClient projects={projects} lancamentos={lancamentos} valoresAprovados={valoresAprovados} />
    </>
  )
}

function DashboardError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold text-slate-300">Não foi possível carregar os dados.</p>
      <p className="text-sm text-slate-500">Verifique as credenciais da API e o ID da planilha.</p>
      <RefreshButton />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a0c12]">
      <Sidebar />
      <div className="flex-1 pl-56">
        <Suspense
          fallback={
            <>
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 dark:border-[#1e2235] dark:bg-[#0a0c12]">
                <div>
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Executivo</h1>
                  <p className="text-[10px] text-slate-500">Carregando…</p>
                </div>
              </header>
              <main className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-[#13151e]" />
                  ))}
                </div>
                <SkeletonTable rows={6} cols={10} />
                <SkeletonCharts />
              </main>
            </>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
