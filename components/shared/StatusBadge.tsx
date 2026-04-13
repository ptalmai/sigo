import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const colorMap: Record<ProjectStatus, string> = {
  Ativo: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  Pausado: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  Concluído: 'border-green-500/30 bg-green-500/10 text-green-400',
  'Não iniciado': 'border-neutral-500/40 bg-neutral-500/10 text-neutral-500',
  Cancelado: 'border-red-500/30 bg-red-500/10 text-red-400',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', colorMap[status])}>
      {status}
    </span>
  )
}
