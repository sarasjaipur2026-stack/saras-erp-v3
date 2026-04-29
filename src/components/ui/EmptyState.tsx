import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, subtitle, icon, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-[color:var(--color-text-muted)]">
      {icon && <div className="mb-3 opacity-60">{icon}</div>}
      <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
      {subtitle && <div className="text-xs mt-1">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
