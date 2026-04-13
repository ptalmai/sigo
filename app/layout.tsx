import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from 'next-auth/react'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'ARGOS — Jornada Comercial',
  description: 'Gestão Orçamentária de Projetos · Pague Menos',
  openGraph: {
    title: 'ARGOS — Jornada Comercial',
    description: 'Gestão Orçamentária de Projetos · Pague Menos',
    images: ['/logo-paguemenos.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('sigo-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.add(s||(d?'dark':'light'));})();`,
          }}
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="bottom-right" duration={5000} richColors />
      </body>
    </html>
  )
}
