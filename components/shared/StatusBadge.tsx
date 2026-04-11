import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const colorMap: Record<ProjectStatus, string> = {
  Ativo: 'border-green-500/30 bg-green-500/10 text-green-400',
  Pausado: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  Concluído: 'border-slate-600 bg-slate-700/30 text-slate-400',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', colorMap[status])}>
      {status}
    </span>
  )
}
