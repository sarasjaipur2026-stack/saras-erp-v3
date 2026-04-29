import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-[color:var(--color-text-muted)]">
      <Loader2 size={20} className="animate-spin mb-2" />
      <div className="text-xs">{label}</div>
    </div>
  )
}

interface SkeletonProps {
  rows?: number
}

export function Skeleton({ rows = 3 }: SkeletonProps): JSX.Element {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-lg bg-[color:var(--color-surface-sunken)] animate-pulse"
        />
      ))}
    </div>
  )
}
