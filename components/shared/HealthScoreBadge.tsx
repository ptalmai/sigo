'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatPct } from '@/lib/formatters'
import type { HealthScoreStatus } from '@/types'

interface HealthScoreBadgeProps {
  status: HealthScoreStatus
  verba_pct: number | null
  execucao_pct: number
  className?: string
}

const config: Record<HealthScoreStatus, { label: string; className: string }> = {
  Saudável: { label: 'Saudável', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  Atenção: { label: 'Atenção', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  'Em Risco': { label: 'Em Risco', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export function HealthScoreBadge({ status, verba_pct, execucao_pct, className }: HealthScoreBadgeProps) {
  const { label, className: colorClass } = config[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-default focus:outline-none">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              colorClass,
              className,
            )}
            aria-label={`Health Score: ${label}`}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Verba: <strong>{verba_pct !== null ? formatPct(verba_pct) : 'N/A'}</strong></p>
          <p>Execução: <strong>{formatPct(execucao_pct)}</strong></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
