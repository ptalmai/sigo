'use client'

import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col bg-slate-100 border-r border-slate-200 dark:bg-[#0d0f17] dark:border-[#1e2235] z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-[#1e2235]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">SIGO</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Gestão Orçamentária</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Portfólio</p>

        <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Dashboard" active />

        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-4 mb-2">Status</p>

        <div className="space-y-1">
          <StatusItem icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />} label="Em Risco" color="text-red-400" />
          <StatusItem icon={<TrendingUp className="h-3.5 w-3.5 text-yellow-400" />} label="Atenção" color="text-yellow-400" />
          <StatusItem icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-400" />} label="Saudável" color="text-green-400" />
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-[#1e2235]">
        <p className="text-[10px] text-slate-400 dark:text-slate-600">v2.0 · Google Sheets</p>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-default transition-colors ${
      active
        ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30'
        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1e2235] dark:hover:text-slate-200'
    }`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
    </div>
  )
}

function StatusItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1e2235] cursor-default">
      {icon}
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  )
}
