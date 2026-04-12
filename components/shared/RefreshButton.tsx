'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function RefreshButton() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/revalidate', { method: 'POST' })
      if (!res.ok) throw new Error()
      // Force a full page reload after revalidation
      window.location.reload()
    } catch {
      toast.error('Não foi possível atualizar os dados. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={loading}
      className="gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-[#1e2235] dark:bg-[#13151e] dark:text-slate-300 dark:hover:bg-[#1e2235] dark:hover:text-white"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      Atualizar
    </Button>
  )
}
