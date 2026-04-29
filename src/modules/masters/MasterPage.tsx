/**
 * Generic MasterPage — one component handles every master via config.
 *
 * 3-panel layout (per design Q4=C strict for transactional/CRUD):
 *   Rail   — search box + filter chips
 *   Centre — list of records (DataGrid for >500 rows, plain list otherwise)
 *   Context — selected record details + recent activity
 *
 * Configs live at src/modules/masters/configs/<entity>.ts and pass to
 * MasterPage as a prop.
 */

import { useMemo, useState } from 'react'
import { useSWRList, invalidateSWR } from '../../hooks/useSWRList'
import { useRealtimeTable } from '../../lib/realtime/useRealtimeTable'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Search } from 'lucide-react'
import type { TableApi, SafeResult } from '../../lib/db/core'
import type { MasterRow } from '../../lib/db/masters'

export interface MasterColumn<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  width?: string
}

export interface MasterConfig<T extends MasterRow> {
  tableName: string
  displayName: string
  api: TableApi<T>
  columns: MasterColumn<T>[]
  searchFields: (keyof T)[]
  contextRender?: (row: T) => React.ReactNode
}

interface MasterPageProps<T extends MasterRow> {
  config: MasterConfig<T>
}

export function MasterPage<T extends MasterRow>({ config }: MasterPageProps<T>): JSX.Element {
  const swrKey = `masters.${config.tableName}.list`
  const { data, loading, error, refetch } = useSWRList<T[]>(
    swrKey,
    async () => {
      const result: SafeResult<T[]> = (await config.api.getAll()) as SafeResult<T[]>
      if (result.error) throw result.error
      return result.data ?? []
    },
  )

  // Realtime: any change → invalidate + refetch
  useRealtimeTable(config.tableName, () => {
    invalidateSWR(swrKey)
    refetch().catch(() => {
      /* surfaced via state */
    })
  })

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<T | null>(null)

  const filtered = useMemo(() => {
    const list = data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) =>
      config.searchFields.some((f) => {
        const v = row[f]
        if (typeof v === 'string') return v.toLowerCase().includes(q)
        if (typeof v === 'number') return String(v).includes(q)
        return false
      }),
    )
  }, [data, search, config.searchFields])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_360px] h-full">
      {/* Rail */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-r border-[color:var(--color-border)] overflow-y-auto p-3">
        <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-3">
          {config.displayName}
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
        <div className="text-[10px] text-[color:var(--color-text-faint)] mt-3">
          {filtered.length} of {data?.length ?? 0}
        </div>
      </aside>

      {/* Centre */}
      <main className="overflow-y-auto">
        {loading && <LoadingState label={`Loading ${config.displayName.toLowerCase()}…`} />}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={search ? 'No matches' : `No ${config.displayName.toLowerCase()} yet`}
            subtitle={search ? `Try a different search.` : `Add your first record from the v2 import or use New ${config.displayName}.`}
          />
        )}
        {!loading && !error && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-surface-sunken)] sticky top-0">
              <tr>
                {config.columns.map((c) => (
                  <th
                    key={String(c.key)}
                    className="text-left text-[10px] uppercase tracking-wide font-semibold text-[color:var(--color-text-muted)] px-3 py-2"
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border)]">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className={`cursor-pointer hover:bg-[color:var(--color-surface-sunken)] ${
                    selected?.id === row.id ? 'bg-[color:var(--color-accent-soft)]' : ''
                  }`}
                >
                  {config.columns.map((c) => (
                    <td key={String(c.key)} className="px-3 py-2 text-[color:var(--color-text)]">
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Context */}
      <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-l border-[color:var(--color-border)] overflow-y-auto p-4">
        {selected ? (
          config.contextRender ? (
            config.contextRender(selected)
          ) : (
            <DefaultContext row={selected} />
          )
        ) : (
          <div className="text-xs text-[color:var(--color-text-faint)] italic">
            Tap a record to see details + activity here.
          </div>
        )}
      </aside>
    </div>
  )
}

function DefaultContext<T extends MasterRow>({ row }: { row: T }): JSX.Element {
  const entries = Object.entries(row).filter(
    ([k]) => !['id', 'user_id', 'created_by', 'updated_by', 'deleted_at', 'idempotency_key', 'search_text'].includes(k),
  )
  return (
    <div className="space-y-2 text-xs">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="text-[10px] uppercase text-[color:var(--color-text-faint)] font-semibold">{k}</div>
          <div className="text-[color:var(--color-text)]">{String(v ?? '—')}</div>
        </div>
      ))}
    </div>
  )
}
