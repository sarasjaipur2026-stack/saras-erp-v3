/**
 * Production — kanban centre. Drag/click cards through Cone → Bobbin → Braid → QC → Pack → Done.
 */

import { useMemo, useState } from 'react'
import { useSWRList, invalidateSWR } from '../../hooks/useSWRList'
import { useRealtimeTable } from '../../lib/realtime/useRealtimeTable'
import {
  productionPlans,
  advanceProductionStatus,
  PRODUCTION_STAGES,
  type ProductionPlan,
  type ProductionStatus,
} from '../../lib/db/production'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { ChevronRight, AlertCircle } from 'lucide-react'

export default function ProductionPage(): JSX.Element {
  const swrKey = 'production_plans.getAll'
  const { data, loading, error, refetch } = useSWRList<ProductionPlan[]>(
    swrKey,
    async () => {
      const r = await productionPlans.getAll()
      if (r.error) throw r.error
      return r.data ?? []
    },
  )

  useRealtimeTable('production_plans', () => {
    invalidateSWR(swrKey)
    refetch().catch(() => {
      /* state */
    })
  })

  const [filter, setFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today')

  const groupedByStatus = useMemo(() => {
    const list = (data ?? []).filter((p) => !p.deleted_at)
    // Date filter
    const today = new Date().toISOString().slice(0, 10)
    const filtered = list.filter((p) => {
      if (filter === 'all') return true
      if (!p.start_date) return filter === 'today'
      if (filter === 'today') return p.start_date <= today
      if (filter === 'tomorrow') {
        const t = new Date(); t.setDate(t.getDate() + 1)
        return p.start_date === t.toISOString().slice(0, 10)
      }
      if (filter === 'week') {
        const t = new Date(); t.setDate(t.getDate() + 7)
        return p.start_date >= today && p.start_date <= t.toISOString().slice(0, 10)
      }
      return true
    })
    const m = new Map<ProductionStatus, ProductionPlan[]>()
    for (const stage of PRODUCTION_STAGES) m.set(stage.key, [])
    for (const p of filtered) {
      const arr = m.get(p.status)
      if (arr) arr.push(p)
    }
    return m
  }, [data, filter])

  const advance = async (id: string, currentStatus: ProductionStatus): Promise<void> => {
    const idx = PRODUCTION_STAGES.findIndex((s) => s.key === currentStatus)
    const nextStage = PRODUCTION_STAGES[idx + 1]
    if (!nextStage) return
    await advanceProductionStatus(id, nextStage.key)
    invalidateSWR(swrKey)
    refetch().catch(() => {
      /* state */
    })
  }

  if (loading) return <LoadingState label="Loading production board…" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px] h-full">
      {/* Rail — date strip */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-r border-[color:var(--color-border)] overflow-y-auto p-3">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Production
        </div>
        <div className="space-y-1">
          {[
            { k: 'today', label: 'Today' },
            { k: 'tomorrow', label: 'Tomorrow' },
            { k: 'week', label: 'This week' },
            { k: 'all', label: 'All' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as typeof filter)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                filter === f.k
                  ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]'
                  : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-sunken)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Centre — kanban */}
      <main className="overflow-x-auto overflow-y-hidden p-3">
        <div className="flex gap-3 min-w-max h-full">
          {PRODUCTION_STAGES.map((stage) => {
            const cards = groupedByStatus.get(stage.key) ?? []
            return (
              <div
                key={stage.key}
                className="w-64 flex flex-col bg-[color:var(--color-surface-sunken)] rounded-2xl p-2 max-h-full"
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text)]">
                    {stage.label}
                  </div>
                  <div className="text-[10px] font-semibold text-[color:var(--color-text-muted)]">
                    {cards.length}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-1">
                  {cards.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => void advance(p.id, p.status)}
                      className="w-full text-left bg-[color:var(--color-surface-elevated)] rounded-xl p-3 border border-[color:var(--color-border)] hover:border-[color:var(--color-accent)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-[color:var(--color-text)]">
                          {p.plan_number}
                        </span>
                        {p.priority === 'urgent' && (
                          <AlertCircle size={12} className="text-[color:var(--color-danger)]" />
                        )}
                      </div>
                      <div className="text-[11px] text-[color:var(--color-text-muted)] mt-0.5">
                        {p.qty_done.toFixed(0)} / {p.qty_planned.toFixed(0)} {p.unit}
                      </div>
                      <div className="flex items-center justify-end mt-2 text-[10px] text-[color:var(--color-accent)] font-semibold">
                        next <ChevronRight size={10} />
                      </div>
                    </button>
                  ))}
                  {cards.length === 0 && (
                    <div className="text-[10px] text-[color:var(--color-text-faint)] italic text-center py-4">
                      empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Context */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-l border-[color:var(--color-border)] overflow-y-auto p-4">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Status
        </div>
        <div className="space-y-3">
          <Stat label="Active" value={(data ?? []).filter((p) => !['completed', 'cancelled', 'queued', 'on_hold'].includes(p.status) && !p.deleted_at).length} />
          <Stat label="Queue" value={(data ?? []).filter((p) => p.status === 'queued').length} />
          <Stat label="Completed today" value={(data ?? []).filter((p) => p.status === 'completed' && p.updated_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length} />
        </div>
        <div className="mt-6 text-[10px] text-[color:var(--color-text-faint)] italic">
          Tap a card to advance to the next stage. Realtime keeps the board in sync across devices.
        </div>
      </aside>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-xl bg-[color:var(--color-surface-sunken)] p-3">
      <div className="text-[10px] uppercase text-[color:var(--color-text-muted)] font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-0.5 text-[color:var(--color-text)]">{value}</div>
    </div>
  )
}
