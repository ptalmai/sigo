export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo-paguemenos.svg"
            alt="ARGOS"
            className="h-10 mb-3"
          />
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            ARGOS
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gestão Orçamentária de Projetos
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
