import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  error: Error | null
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 bg-[color:var(--color-danger-soft)] rounded-xl m-3">
      <AlertTriangle size={20} className="mb-2 text-[color:var(--color-danger)]" />
      <div className="text-sm font-semibold text-[color:var(--color-danger)]">Something went wrong</div>
      <div className="text-xs mt-1 text-[color:var(--color-text-muted)] max-w-md">
        {error?.message ?? 'Unknown error'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[color:var(--color-danger)] text-[color:var(--color-text-on-accent)] hover:opacity-90"
        >
          Retry
        </button>
      )}
    </div>
  )
}
