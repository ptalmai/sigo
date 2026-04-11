import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'SIGO — Gestão Orçamentária',
  description: 'Sistema Integrado de Gestão Orçamentária de Projetos',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} antialiased`}>
      <body className="min-h-screen bg-[#0a0c12] text-slate-200">
        {children}
        <Toaster position="bottom-right" duration={5000} richColors />
      </body>
    </html>
  )
}
