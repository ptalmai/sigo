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
      className="gap-2 border-[#1e2235] bg-[#13151e] text-slate-300 hover:bg-[#1e2235] hover:text-white"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      Atualizar
    </Button>
  )
}
