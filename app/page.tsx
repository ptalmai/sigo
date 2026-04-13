export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { fetchAllSheetData } from '@/lib/sheets'
import { computeAllProjects } from '@/lib/calculations'
import { formatRelativeTime } from '@/lib/formatters'
import { SkeletonTable, SkeletonCharts } from '@/components/shared/SkeletonTable'
import { RefreshButton } from '@/components/shared/RefreshButton'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
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

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 md:px-6 backdrop-blur dark:border-[#1e2235] dark:bg-[#0a0c12]/80">
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Executivo</h1>
          <p className="text-[10px] text-slate-500">Portfólio · {projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Timestamp + refresh — só desktop */}
          <span className="hidden md:inline text-[11px] text-slate-500">
            Atualizado {formatRelativeTime(fetchedAt)}
          </span>
          <ThemeToggle />
          <div className="hidden md:block">
            <RefreshButton />
          </div>
        </div>
      </header>

      <DashboardClient
        projects={projects}
        lancamentos={lancamentos}
        valoresAprovados={valoresAprovados}
        fetchedAt={fetchedAt.toISOString()}
      />
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
      <div className="flex-1 md:pl-56">
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
