'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, X, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ProjectsTable } from '@/components/dashboard/ProjectsTable'
import { ProjectCards } from '@/components/dashboard/ProjectCards'
import { BurnVsExecutionChart } from '@/components/dashboard/BurnVsExecutionChart'
import { SavingChart } from '@/components/dashboard/SavingChart'
import { buildBurnVsExecutionData, buildSavingTimelineData } from '@/lib/calculations'
import { formatBRL, formatRelativeTime } from '@/lib/formatters'
import type { ProjectWithMetrics, ProjectStatus, HealthScoreStatus, RawLancamento, ValoresAprovadosMensais } from '@/types'

const STATUS_OPTIONS: ProjectStatus[] = ['Ativo', 'Pausado', 'Concluído', 'Não iniciado', 'Cancelado']
const HEALTH_OPTIONS: HealthScoreStatus[] = ['Saudável', 'Atenção', 'Em Risco']

interface Props {
  projects: ProjectWithMetrics[]
  lancamentos: RawLancamento[]
  valoresAprovados: ValoresAprovadosMensais
  fetchedAt?: string
}

export function DashboardClient({ projects, lancamentos, valoresAprovados, fetchedAt }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [health, setHealth] = useState<HealthScoreStatus | ''>('')

  // Sync health filter from URL (set by sidebar)
  useEffect(() => {
    const h = searchParams.get('health') as HealthScoreStatus | null
    setHealth(h ?? '')
  }, [searchParams])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (nome && !p.nome_projeto.toLowerCase().includes(nome.toLowerCase())) return false
      if (status && p.status !== status) return false
      if (health && p.metrics.health_score !== health) return false
      return true
    })
  }, [projects, nome, status, health])

  const burnData = useMemo(() => buildBurnVsExecutionData(filtered), [filtered])
  const savingData = useMemo(() => buildSavingTimelineData(filtered, lancamentos, valoresAprovados), [filtered, lancamentos, valoresAprovados])

  const kpis = useMemo(() => {
    const totalAprovado = filtered.reduce((s, p) => s + p.valor_aprovado, 0)
    const totalGasto = filtered.reduce((s, p) => s + p.metrics.valor_gasto, 0)
    const emRisco = filtered.filter((p) => p.metrics.health_score === 'Em Risco').length
    const atencao = filtered.filter((p) => p.metrics.health_score === 'Atenção').length
    const saudavel = filtered.filter((p) => p.metrics.health_score === 'Saudável').length
    return [
      {
        label: 'Orçamento Total',
        value: formatBRL(totalAprovado),
        icon: <DollarSign className="h-4 w-4 text-violet-400" />,
        accent: 'border-violet-500/30 bg-violet-500/5',
        sub: `${filtered.length} projeto${filtered.length !== 1 ? 's' : ''}`,
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
        sub: `de ${filtered.length} projetos`,
      },
    ]
  }, [filtered])

  const hasFilters = nome || status || health

  function handleHealthChange(value: HealthScoreStatus | '') {
    setHealth(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('health', value)
    else params.delete('health')
    router.push(`/?${params.toString()}`)
  }

  function clearFilters() {
    setNome('')
    setStatus('')
    setHealth('')
    router.push('/')
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-0 md:gap-4 md:p-6 md:pb-0 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl border p-3 md:p-4 ${k.accent}`}>
            <div className="mb-2 md:mb-3 flex items-center justify-between">
              <p className="text-[11px] md:text-xs font-medium text-slate-600 dark:text-slate-400">{k.label}</p>
              <div className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-[#1e2235]">
                {k.icon}
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{k.value}</p>
            <p className="mt-0.5 text-[10px] md:text-[11px] text-slate-500">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3 border-b border-slate-200 bg-slate-50 px-4 md:px-6 py-3 dark:border-[#1e2235] dark:bg-[#0d0f17]">
        {/* Busca por nome */}
        <div className="relative w-full md:w-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar projeto…"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-9 md:h-8 w-full md:w-52 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-violet-500/50 dark:border-[#1e2235] dark:bg-[#13151e] dark:text-slate-200 dark:placeholder-slate-600"
          />
          {nome && (
            <button
              onClick={() => setNome('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              aria-label="Limpar busca"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex gap-2 md:contents">
          {/* Status de andamento */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
              className="h-9 md:h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-7 text-xs text-slate-800 outline-none transition-colors focus:border-violet-500/50 dark:border-[#1e2235] dark:bg-[#13151e] dark:text-slate-200"
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[10px]">▼</span>
          </div>

          {/* Health score */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={health}
              onChange={(e) => handleHealthChange(e.target.value as HealthScoreStatus | '')}
              className="h-9 md:h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-7 text-xs text-slate-800 outline-none transition-colors focus:border-violet-500/50 dark:border-[#1e2235] dark:bg-[#13151e] dark:text-slate-200"
            >
              <option value="">Todos os healths</option>
              {HEALTH_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[10px]">▼</span>
          </div>
        </div>

        {/* Resultado + limpar */}
        <div className="flex items-center gap-3 md:ml-auto">
          <span className="text-[11px] text-slate-500">
            {filtered.length === projects.length
              ? `${projects.length} projeto${projects.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${projects.length} projeto${projects.length !== 1 ? 's' : ''}`}
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 md:py-1 text-[11px] text-slate-600 transition-colors hover:border-violet-500/40 hover:text-violet-600 dark:border-[#1e2235] dark:bg-[#13151e] dark:text-slate-400 dark:hover:text-violet-400"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Timestamp — só mobile */}
      {fetchedAt && (
        <p className="block md:hidden px-4 pt-2 text-[10px] text-slate-400 dark:text-slate-600">
          Atualizado {formatRelativeTime(new Date(fetchedAt))}
        </p>
      )}

      <main className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Mobile: cards | Desktop: tabela */}
        <section aria-label="Projetos">
          <div className="block md:hidden">
            <ProjectCards projects={filtered} />
          </div>
          <div className="hidden md:block">
            <ProjectsTable projects={filtered} />
          </div>
        </section>

        {/* Gráficos */}
        <section aria-label="Gráficos" className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 dark:border-[#1e2235] dark:bg-[#13151e]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Burn vs Execução</h3>
            <p className="mb-4 text-[11px] text-slate-500">% verba utilizada vs % execução física por projeto</p>
            <BurnVsExecutionChart data={burnData} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 dark:border-[#1e2235] dark:bg-[#13151e]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Saving Mensal</h3>
            <p className="mb-4 text-[11px] text-slate-500">
              <span className="text-orange-400">Linha laranja</span> = VA (valor aprovado/mês) ·{' '}
              <span className="text-violet-400">Barra</span> = pagamento real ·{' '}
              <span className="text-green-400">Verde</span> = saving · <span className="text-red-400">Vermelho</span> = déficit
            </p>
            <SavingChart data={savingData} />
          </div>
        </section>
      </main>
    </>
  )
}
