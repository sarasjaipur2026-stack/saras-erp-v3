import { formatDistanceToNow } from 'date-fns'
import type { DashboardActivity } from '../../../lib/db/dashboard'

interface ActivityFeedProps {
  items: DashboardActivity[]
}

const OP_COLOR: Record<DashboardActivity['op'], string> = {
  INSERT: 'text-[color:var(--color-success)] bg-[color:var(--color-success-soft)]',
  UPDATE: 'text-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]',
  DELETE: 'text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]',
  SOFT_DELETE: 'text-[color:var(--color-warning)] bg-[color:var(--color-warning-soft)]',
  RESTORE: 'text-[color:var(--color-success)] bg-[color:var(--color-success-soft)]',
}

export function ActivityFeed({ items }: ActivityFeedProps): JSX.Element {
  if (items.length === 0) {
    return (
      <div className="text-xs text-[color:var(--color-text-faint)] italic px-1 py-6 text-center">
        No activity yet — actions across the app will appear here.
      </div>
    )
  }
  return (
    <ul className="divide-y divide-[color:var(--color-border)]">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 py-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${OP_COLOR[it.op]}`}
          >
            {it.op}
          </span>
          <span className="text-sm text-[color:var(--color-text)] flex-1 truncate">
            {it.table_name}
          </span>
          <span className="text-xs text-[color:var(--color-text-faint)]">
            {formatDistanceToNow(new Date(it.ts), { addSuffix: true })}
          </span>
        </li>
      ))}
    </ul>
  )
}
