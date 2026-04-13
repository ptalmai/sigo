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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-paguemenos.svg"
            alt="Pague Menos"
            width={52}
            height={52}
            className="mb-3"
          />
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            ARGOS
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Projetos da Jornada Comercial
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
