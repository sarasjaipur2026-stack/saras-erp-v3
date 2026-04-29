import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Calculator, ShoppingCart, Store } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

interface QuickAction {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>
  tone: 'accent' | 'success' | 'warning' | 'neutral'
}

const ACTIONS: QuickAction[] = [
  { to: '/orders/new', label: 'New Order', icon: Plus, tone: 'accent' },
  { to: '/pos', label: 'POS', icon: Store, tone: 'success' },
  { to: '/enquiries/new', label: 'New Enquiry', icon: MessageSquare, tone: 'warning' },
  { to: '/calculator', label: 'Calculator', icon: Calculator, tone: 'neutral' },
  { to: '/orders', label: 'View Orders', icon: ShoppingCart, tone: 'neutral' },
]

const TONE: Record<QuickAction['tone'], string> = {
  accent:
    'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-text-on-accent)]',
  success:
    'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)] hover:bg-[color:var(--color-success)] hover:text-[color:var(--color-text-on-accent)]',
  warning:
    'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)] hover:bg-[color:var(--color-warning)] hover:text-[color:var(--color-text-on-accent)]',
  neutral:
    'bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-on-accent)]',
}

export function QuickActions(): JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.to}
            to={a.to}
            className={`group flex items-center gap-3 p-4 rounded-2xl border border-[color:var(--color-border)] transition ${TONE[a.tone]}`}
          >
            <Icon size={18} />
            <span className="text-sm font-semibold">{a.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
