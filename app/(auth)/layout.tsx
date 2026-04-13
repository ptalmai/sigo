'use client'

import { ThemeToggle } from '@/components/shared/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12 relative">
      {/* Theme toggle — canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg
            width="52"
            height="52"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3"
            aria-label="Pague Menos"
          >
            <rect width="100" height="100" rx="22" fill="#EF3340" />
            <rect x="37" y="14" width="26" height="72" rx="13" fill="white" />
            <rect x="14" y="37" width="72" height="26" rx="13" fill="white" />
          </svg>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            ARGOS
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Projetos da Jornada Comercial
          </p>
        </div>

        {/* Card — sobrescreve --primary para azul Pague Menos */}
        <div
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-8"
          style={{ '--primary': '#0066B3', '--ring': '#0066B3', '--accent': '#004d87' } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
