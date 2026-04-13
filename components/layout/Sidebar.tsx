'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, LogOut } from 'lucide-react'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { getInitials, getAvatarColor } from '@/lib/auth-utils'
import type { HealthScoreStatus } from '@/types'

function SidebarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeHealth = searchParams.get('health') ?? ''

  function filterByHealth(value: HealthScoreStatus) {
    const params = new URLSearchParams(searchParams.toString())
    if (activeHealth === value) params.delete('health')
    else params.set('health', value)
    router.push(`/?${params.toString()}`)
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-56 flex-col bg-slate-100 border-r border-slate-200 dark:bg-[#0d0f17] dark:border-[#1e2235] z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-[#1e2235]">
        <Image src="/logo-paguemenos.svg" alt="Pague Menos" width={32} height={32} />
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">ARGOS</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Jornada Comercial</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Portfólio</p>

        <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Dashboard" active />

        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-4 mb-2">Status</p>

        <div className="space-y-1">
          <StatusItem
            icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            label="Em Risco"
            color="text-red-400"
            active={activeHealth === 'Em Risco'}
            onClick={() => filterByHealth('Em Risco')}
          />
          <StatusItem
            icon={<TrendingUp className="h-3.5 w-3.5 text-yellow-400" />}
            label="Atenção"
            color="text-yellow-400"
            active={activeHealth === 'Atenção'}
            onClick={() => filterByHealth('Atenção')}
          />
          <StatusItem
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
            label="Saudável"
            color="text-green-400"
            active={activeHealth === 'Saudável'}
            onClick={() => filterByHealth('Saudável')}
          />
        </div>
      </nav>

      {/* User + Logout */}
      <UserFooter />
    </aside>
  )
}

function UserFooter() {
  const { data: session } = useSession()
  const email = session?.user?.email ?? ''
  const initials = getInitials(email)
  const avatarColor = getAvatarColor(email)
  const displayName = email.split('@')[0] ?? email

  return (
    <div className="px-4 py-4 border-t border-slate-200 dark:border-[#1e2235]">
      <div className="flex items-center gap-2 mb-2">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: avatarColor }}
          aria-label={email}
        >
          {initials}
        </div>
        {/* Name */}
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex-1 hidden md:block">
          {displayName}
        </span>
        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Sair"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="Sair"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
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

function StatusItem({
  icon, label, color, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  color: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-slate-200 dark:bg-[#1e2235]'
          : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1e2235]'
      }`}
    >
      {icon}
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />}
    </button>
  )
}
