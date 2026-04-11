'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { ProjectsTable } from '@/components/dashboard/ProjectsTable'
import { BurnVsExecutionChart } from '@/components/dashboard/BurnVsExecutionChart'
import { SavingChart } from '@/components/dashboard/SavingChart'
import { buildBurnVsExecutionData, buildSavingTimelineData } from '@/lib/calculations'
import type { ProjectWithMetrics, ProjectStatus, HealthScoreStatus, RawLancamento } from '@/types'

const STATUS_OPTIONS: ProjectStatus[] = ['Ativo', 'Pausado', 'Concluído']
const HEALTH_OPTIONS: HealthScoreStatus[] = ['Saudável', 'Atenção', 'Em Risco']

interface Props {
  projects: ProjectWithMetrics[]
  lancamentos: RawLancamento[]
}

export function DashboardClient({ projects, lancamentos }: Props) {
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [health, setHealth] = useState<HealthScoreStatus | ''>('')

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (nome && !p.nome_projeto.toLowerCase().includes(nome.toLowerCase())) return false
      if (status && p.status !== status) return false
      if (health && p.metrics.health_score !== health) return false
      return true
    })
  }, [projects, nome, status, health])

  const burnData = useMemo(() => buildBurnVsExecutionData(filtered), [filtered])
  const savingData = useMemo(() => buildSavingTimelineData(filtered, lancamentos), [filtered, lancamentos])

  const hasFilters = nome || status || health

  function clearFilters() {
    setNome('')
    setStatus('')
    setHealth('')
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1e2235] bg-[#0d0f17] px-6 py-3">
        {/* Busca por nome */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar projeto…"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-8 w-52 rounded-lg border border-[#1e2235] bg-[#13151e] pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-violet-500/50"
          />
          {nome && (
            <button
              onClick={() => setNome('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Limpar busca"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status de andamento */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}
            className="h-8 appearance-none rounded-lg border border-[#1e2235] bg-[#13151e] px-3 pr-7 text-xs text-slate-200 outline-none transition-colors focus:border-violet-500/50"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▼</span>
        </div>

        {/* Health score */}
        <div className="relative">
          <select
            value={health}
            onChange={(e) => setHealth(e.target.value as HealthScoreStatus | '')}
            className="h-8 appearance-none rounded-lg border border-[#1e2235] bg-[#13151e] px-3 pr-7 text-xs text-slate-200 outline-none transition-colors focus:border-violet-500/50"
          >
            <option value="">Todos os healths</option>
            {HEALTH_OPTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">▼</span>
        </div>

        {/* Resultado + limpar */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            {filtered.length === projects.length
              ? `${projects.length} projeto${projects.length !== 1 ? 's' : ''}`
              : `${filtered.length} de ${projects.length} projeto${projects.length !== 1 ? 's' : ''}`}
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md border border-[#1e2235] bg-[#13151e] px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:border-violet-500/40 hover:text-violet-400"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <main className="space-y-6 p-6">
        {/* Tabela */}
        <section aria-label="Tabela de projetos">
          <ProjectsTable projects={filtered} />
        </section>

        {/* Gráficos */}
        <section aria-label="Gráficos" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#1e2235] bg-[#13151e] p-5">
            <h3 className="text-sm font-semibold text-slate-200">Burn vs Execução</h3>
            <p className="mb-4 text-[11px] text-slate-500">% verba utilizada vs % execução física por projeto</p>
            <BurnVsExecutionChart data={burnData} />
          </div>

          <div className="rounded-xl border border-[#1e2235] bg-[#13151e] p-5">
            <h3 className="text-sm font-semibold text-slate-200">Saving Mensal</h3>
            <p className="mb-4 text-[11px] text-slate-500">
              <span className="text-orange-400">Linha laranja</span> = CMM (média aprovada) ·{' '}
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
