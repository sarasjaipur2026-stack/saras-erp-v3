/**
 * Orders Workspace — strict 3-panel transactional layout.
 *   Rail   — status tabs + today filter + search
 *   Centre — selected order detail (or list when none picked)
 *   Context — customer card · production · dispatch · payments
 *
 * Spec design §8.3.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { useSWRList, invalidateSWR } from '../../hooks/useSWRList'
import { useRealtimeTable } from '../../lib/realtime/useRealtimeTable'
import { orders, type Order, type OrderStatus } from '../../lib/db/orders'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'approved', label: 'Approved' },
  { key: 'production', label: 'Production' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'completed', label: 'Completed' },
]

const STATUS_TONE: Record<OrderStatus, string> = {
  draft: 'bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)]',
  booking: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  approved: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]',
  production: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  qc: 'bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]',
  dispatch: 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]',
  completed: 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]',
  cancelled: 'bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]',
  on_hold: 'bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)]',
}

export default function OrdersPage(): JSX.Element {
  const swrKey = 'orders.getAll'
  const { data, loading, error, refetch } = useSWRList<Order[]>(swrKey, async () => {
    const { data, error } = await orders.getAll()
    if (error) throw error
    return data ?? []
  })

  useRealtimeTable('orders', () => {
    invalidateSWR(swrKey)
    refetch().catch(() => {
      /* surfaced via state */
    })
  })

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    let list = data ?? []
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((o) => (o.search_text ?? '').includes(q))
    return list
  }, [data, statusFilter, search])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_320px] h-full">
      {/* Rail */}
      <aside className="hidden md:flex flex-col bg-[color:var(--color-surface-elevated)] border-r border-[color:var(--color-border)] overflow-hidden">
        <div className="p-3 space-y-3 border-b border-[color:var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold">
              Orders
            </div>
            <Link
              to="/orders/new"
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-[color:var(--color-accent)] text-[color:var(--color-text-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              <Plus size={12} />
              New
            </Link>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2.5 text-[color:var(--color-text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-2 py-2 text-sm rounded-lg border border-[color:var(--color-border)] focus-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${
                  statusFilter === t.key
                    ? 'bg-[color:var(--color-accent)] text-[color:var(--color-text-on-accent)]'
                    : 'bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-border)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[color:var(--color-text-faint)]">
            {filtered.length} of {data?.length ?? 0}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[color:var(--color-border)]">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className={`w-full text-left px-3 py-2.5 hover:bg-[color:var(--color-surface-sunken)] ${
                selected?.id === o.id ? 'bg-[color:var(--color-accent-soft)]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[color:var(--color-text)]">
                  {o.order_number}
                </span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_TONE[o.status]}`}>
                  {o.status}
                </span>
              </div>
              <div className="text-[11px] text-[color:var(--color-text-muted)] mt-0.5">
                ₹{o.grand_total.toFixed(0)} · {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
              </div>
            </button>
          ))}
          {filtered.length === 0 && !loading && !error && (
            <div className="p-6 text-xs text-[color:var(--color-text-faint)] text-center italic">
              No orders match.
            </div>
          )}
        </div>
      </aside>

      {/* Centre */}
      <main className="overflow-y-auto">
        {loading && <LoadingState label="Loading orders…" />}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {!loading && !error && !selected && (
          <EmptyState
            title="Pick an order"
            subtitle="Or click + New on the left to start a new one."
          />
        )}
        {selected && <OrderDetail order={selected} />}
      </main>

      {/* Context */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-l border-[color:var(--color-border)] overflow-y-auto p-4">
        {selected ? (
          <OrderContext order={selected} />
        ) : (
          <div className="text-xs text-[color:var(--color-text-faint)] italic">
            Customer credit · production · dispatch · payments — appear here when an order is selected.
          </div>
        )}
      </aside>
    </div>
  )
}

function OrderDetail({ order }: { order: Order }): JSX.Element {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold font-mono text-[color:var(--color-text)]">
          {order.order_number}
        </h2>
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${STATUS_TONE[order.status]}`}>
          {order.status}
        </span>
      </div>
      <div className="text-sm text-[color:var(--color-text-muted)] mt-1">
        {order.priority} priority · {order.order_date}
        {order.delivery_date && ` · delivery ${order.delivery_date}`}
      </div>
      <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Subtotal" value={`₹${order.subtotal.toFixed(2)}`} />
        <Stat label="Tax" value={`₹${order.total_tax.toFixed(2)}`} />
        <Stat label="Total" value={`₹${order.grand_total.toFixed(2)}`} bold />
        <Stat label="Balance" value={`₹${order.balance_due.toFixed(2)}`} />
      </section>
      {order.notes && (
        <section className="mt-6 p-3 rounded-lg bg-[color:var(--color-surface-sunken)] text-sm">
          {order.notes}
        </section>
      )}
    </div>
  )
}

function OrderContext({ order }: { order: Order }): JSX.Element {
  return (
    <div className="space-y-4 text-sm">
      <Card title="Customer">
        {order.customer_id ? (
          <div className="text-xs text-[color:var(--color-text-muted)]">
            ID {order.customer_id.slice(0, 8)}…
          </div>
        ) : (
          <div className="text-xs text-[color:var(--color-text-faint)] italic">Walk-in</div>
        )}
      </Card>
      <Card title="Production">
        <div className="text-xs text-[color:var(--color-text-faint)] italic">
          Wires up in Phase 5 (Production module).
        </div>
      </Card>
      <Card title="Dispatch">
        <div className="text-xs text-[color:var(--color-text-faint)] italic">
          Wires up in Phase 7 (Dispatch).
        </div>
      </Card>
      <Card title="Payments">
        <div className="text-xs text-[color:var(--color-text-muted)]">
          ₹{order.advance_paid.toFixed(0)} paid · ₹{order.balance_due.toFixed(0)} due
        </div>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
        {title}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, bold }: { label: string; value: string; bold?: boolean }): JSX.Element {
  return (
    <div className="rounded-lg bg-[color:var(--color-surface-sunken)] p-3">
      <div className="text-[10px] uppercase text-[color:var(--color-text-muted)] font-semibold">{label}</div>
      <div className={`mt-1 ${bold ? 'text-lg font-bold' : 'text-sm font-semibold'} text-[color:var(--color-text)]`}>
        {value}
      </div>
    </div>
  )
}
