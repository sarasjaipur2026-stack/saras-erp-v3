/**
 * Stock — 3-panel: warehouse rail, product tile grid centre, recent movements + low-stock context.
 */

import { useMemo, useState } from 'react'
import { useSWRList, invalidateSWR } from '../../hooks/useSWRList'
import { useRealtimeTable } from '../../lib/realtime/useRealtimeTable'
import { warehouses, type Warehouse, products as productsApi, type Product } from '../../lib/db/masters'
import { supabase } from '../../lib/supabase'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Search } from 'lucide-react'

interface StockRow {
  id: string
  product_id: string | null
  warehouse_id: string
  quantity: number
  unit: string | null
  min_stock_level: number
  updated_at: string
}

export default function StockPage(): JSX.Element {
  const { data: whData, error: whError } = useSWRList<Warehouse[]>(
    'masters.warehouses.list',
    async () => {
      const r = await warehouses.getAll()
      if (r.error) throw r.error
      return r.data ?? []
    },
  )
  const { data: prodData } = useSWRList<Product[]>(
    'masters.products.list',
    async () => {
      const r = await productsApi.getAll()
      if (r.error) throw r.error
      return r.data ?? []
    },
  )

  const [selectedWh, setSelectedWh] = useState<string | null>(null)
  const wh = whData?.[0]
  const activeWh = selectedWh ?? wh?.id ?? null

  const stockKey = `stock.${activeWh ?? 'none'}`
  const { data: stockData, loading: stockLoading, error: stockError, refetch } = useSWRList<StockRow[]>(
    stockKey,
    async () => {
      if (!activeWh) return []
      const { data, error } = await supabase
        .from('stock')
        .select('id, product_id, warehouse_id, quantity, unit, min_stock_level, updated_at')
        .eq('warehouse_id', activeWh)
        .is('deleted_at', null)
      if (error) throw error
      return (data ?? []) as StockRow[]
    },
    { enabled: !!activeWh },
  )

  useRealtimeTable('stock', () => {
    invalidateSWR(stockKey)
    refetch().catch(() => {
      /* surfaced via state */
    })
  })

  const stockByProduct = useMemo(() => {
    const m = new Map<string, StockRow>()
    for (const s of stockData ?? []) if (s.product_id) m.set(s.product_id, s)
    return m
  }, [stockData])

  const [search, setSearch] = useState('')
  const filteredProducts = useMemo(() => {
    const list = prodData ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((p) => (p.search_text ?? '').includes(q))
  }, [prodData, search])

  const lowStockCount = useMemo(() => {
    return (stockData ?? []).filter((s) => s.quantity < s.min_stock_level).length
  }, [stockData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_300px] h-full">
      {/* Rail — warehouses */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-r border-[color:var(--color-border)] overflow-y-auto p-3">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Warehouses
        </div>
        {whError && <ErrorState error={whError} />}
        <div className="space-y-1">
          {(whData ?? []).map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWh(w.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                activeWh === w.id
                  ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]'
                  : 'hover:bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)]'
              }`}
            >
              <div className="font-semibold">{w.name}</div>
              <div className="text-[10px] text-[color:var(--color-text-faint)]">
                {w.warehouse_type ?? '—'}
              </div>
            </button>
          ))}
          {(whData?.length ?? 0) === 0 && !whError && (
            <div className="text-xs text-[color:var(--color-text-faint)] italic">
              No warehouses yet.
            </div>
          )}
        </div>
      </aside>

      {/* Centre — product tile grid */}
      <main className="overflow-y-auto p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-2 top-2.5 text-[color:var(--color-text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-2 py-2 text-sm rounded-lg border border-[color:var(--color-border)] focus-ring"
            />
          </div>
        </div>
        {stockLoading && <LoadingState label="Loading stock…" />}
        {stockError && <ErrorState error={stockError} onRetry={() => void refetch()} />}
        {!stockLoading && !stockError && filteredProducts.length === 0 && (
          <EmptyState title="No products" subtitle="Add products in /masters/products first." />
        )}
        {!stockLoading && !stockError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const s = stockByProduct.get(p.id)
              const qty = s?.quantity ?? 0
              const tone =
                qty <= 0
                  ? 'text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]'
                  : qty < 10
                  ? 'text-[color:var(--color-warning)] bg-[color:var(--color-warning-soft)]'
                  : 'text-[color:var(--color-success)] bg-[color:var(--color-success-soft)]'
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]"
                >
                  <div className="text-xs font-mono text-[color:var(--color-text-muted)]">{p.code}</div>
                  <div className="text-sm font-semibold text-[color:var(--color-text)] mt-0.5 line-clamp-2 min-h-[36px]">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${tone}`}>
                      {qty} {s?.unit ?? p.rate_unit?.replace('per_', '') ?? ''}
                    </span>
                    {p.default_rate != null && (
                      <span className="text-xs font-semibold text-[color:var(--color-text-muted)]">
                        ₹{p.default_rate.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Context — low-stock alerts */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-l border-[color:var(--color-border)] overflow-y-auto p-4">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          Alerts
        </div>
        {lowStockCount > 0 ? (
          <div className="p-3 rounded-xl bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]">
            <div className="text-sm font-semibold">{lowStockCount} low-stock</div>
            <div className="text-xs mt-1">products are below minimum stock level</div>
          </div>
        ) : (
          <div className="text-xs text-[color:var(--color-text-faint)] italic">
            No low-stock alerts.
          </div>
        )}
      </aside>
    </div>
  )
}
