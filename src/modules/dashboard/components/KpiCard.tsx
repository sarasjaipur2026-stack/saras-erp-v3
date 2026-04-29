import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  href?: string
  tone?: 'accent' | 'success' | 'warning' | 'neutral'
}

const TONE_BG: Record<NonNullable<KpiCardProps['tone']>, string> = {
  accent: 'bg-[color:var(--color-accent-soft)]',
  success: 'bg-[color:var(--color-success-soft)]',
  warning: 'bg-[color:var(--color-warning-soft)]',
  neutral: 'bg-[color:var(--color-surface-sunken)]',
}
const TONE_FG: Record<NonNullable<KpiCardProps['tone']>, string> = {
  accent: 'text-[color:var(--color-accent)]',
  success: 'text-[color:var(--color-success)]',
  warning: 'text-[color:var(--color-warning)]',
  neutral: 'text-[color:var(--color-text-muted)]',
}

export function KpiCard({ label, value, icon, href, tone = 'neutral' }: KpiCardProps): JSX.Element {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold">
          {label}
        </div>
        {icon && <div className={`${TONE_FG[tone]} opacity-80`}>{icon}</div>}
      </div>
      <div className="text-3xl font-bold mt-1 text-[color:var(--color-text)]">{value}</div>
    </>
  )
  const className = `block p-4 rounded-2xl ${TONE_BG[tone]} border border-[color:var(--color-border)] hover:shadow-sm transition`
  return href ? (
    <a href={href} className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  )
}
