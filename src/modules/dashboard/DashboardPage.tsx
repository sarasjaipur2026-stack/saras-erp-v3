/**
 * Dashboard — analytical, flexible layout (per design Q4=C).
 * KPI strip + activity feed + quick-action grid. Single-RPC paint.
 */

import { useMemo, useCallback } from 'react'
import { ShoppingCart, MessageSquare, Clock, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getDashboardMetrics, type DashboardMetrics } from '../../lib/db/dashboard'
import { perfMark } from '../../lib/perfMark'
import { useSWRList } from '../../hooks/useSWRList'
import { useRealtimeTable } from '../../lib/realtime/useRealtimeTable'
import { KpiCard } from './components/KpiCard'
import { ActivityFeed } from './components/ActivityFeed'
import { QuickActions } from './components/QuickActions'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'

const ZERO: DashboardMetrics = {
  today_orders: 0,
  new_enquiries: 0,
  pending_orders: 0,
  total_customers: 0,
  recent_activity: [],
}

export default function DashboardPage(): JSX.Element {
  const { profile } = useAuth()
  const userId = profile?.id

  const fetcher = useCallback(async (): Promise<DashboardMetrics> => {
    const { data, error } = await perfMark('dashboard.metrics', () => getDashboardMetrics())
    if (error) throw error
    return data ?? ZERO
  }, [])

  const { data, loading, error, refetch } = useSWRList<DashboardMetrics>(
    `dashboard.metrics:${userId ?? 'anon'}`,
    fetcher,
  )

  // Realtime: refresh on any audit_log entry (live activity feed)
  useRealtimeTable('audit_log', () => {
    refetch().catch(() => {
      /* surfaced via state */
    })
  })

  const metrics = useMemo(() => data ?? ZERO, [data])

  if (loading) return <LoadingState label="Loading dashboard…" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold">
          Welcome back
        </div>
        <h1 className="text-2xl font-bold text-[color:var(--color-text)]">
          {profile?.full_name ?? 'SARAS'}
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
          Here&rsquo;s what&rsquo;s happening at SARAS today.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Today's Orders" value={metrics.today_orders} tone="accent" icon={<ShoppingCart size={18} />} />
        <KpiCard label="New Enquiries" value={metrics.new_enquiries} tone="warning" icon={<MessageSquare size={18} />} />
        <KpiCard label="Pending Orders" value={metrics.pending_orders} tone="neutral" icon={<Clock size={18} />} />
        <KpiCard label="Customers" value={metrics.total_customers} tone="success" icon={<Users size={18} />} />
      </section>

      <section>
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Quick Actions
        </div>
        <QuickActions />
      </section>

      <section>
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Recent Activity
        </div>
        <div className="bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-2xl px-4 py-2">
          <ActivityFeed items={metrics.recent_activity} />
        </div>
      </section>
    </div>
  )
}
