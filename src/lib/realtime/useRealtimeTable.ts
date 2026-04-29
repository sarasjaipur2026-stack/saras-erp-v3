/**
 * Realtime table subscription with self-write echo suppression.
 *
 * Imported from saras-erp-v2 (hooks/useRealtimeTable.js); ported to TypeScript.
 *
 * Usage:
 *   useRealtimeTable('orders', () => refetch())
 *   useRealtimeTable('orders', (p) => merge(p), { event: 'UPDATE' })
 */

import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../supabase'

const ECHO_WINDOW_MS = 1_200
const selfWrites = new Map<string, number>()

/** Mark a self-write so the immediate realtime echo can be suppressed by callers. */
export function markSelfWrite(table: string): void {
  if (!table) return
  selfWrites.set(table, Date.now())
}

function isEcho(table: string): boolean {
  const ts = selfWrites.get(table)
  if (!ts) return false
  return Date.now() - ts < ECHO_WINDOW_MS
}

export type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

interface UseRealtimeTableOptions {
  event?: RealtimeEvent
  schema?: string
  filter?: string
  debounceMs?: number
  enabled?: boolean
}

type Payload<T extends Record<string, unknown> = Record<string, unknown>> =
  RealtimePostgresChangesPayload<T> & { isEcho?: boolean }

type Handler<T extends Record<string, unknown>> = (payload: Payload<T>) => void

export function useRealtimeTable<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  onChange: Handler<T>,
  options: UseRealtimeTableOptions = {},
): void {
  const {
    event = '*',
    schema = 'public',
    filter,
    debounceMs = 250,
    enabled = true,
  } = options

  const cbRef = useRef<Handler<T>>(onChange)
  useEffect(() => {
    cbRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!enabled || !table) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastPayload: Payload<T> | null = null

    const handler = (payload: RealtimePostgresChangesPayload<T>): void => {
      const annotated = payload as Payload<T>
      annotated.isEcho = isEcho(table)
      lastPayload = annotated
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        try {
          if (lastPayload) cbRef.current(lastPayload)
        } catch (e) {
          if (import.meta.env.DEV) console.error('[useRealtimeTable]', table, e)
        }
      }, debounceMs)
    }

    const channelName = `rt:${schema}:${table}:${filter ?? 'all'}:${Date.now().toString()}`
    // Supabase types for channel config use `unknown` for filter — safe-cast OK.
    const config: Record<string, string> = { event, schema, table }
    if (filter) config.filter = filter

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes' as 'postgres_changes', config as never, handler)
      .subscribe((status, err) => {
        if (import.meta.env.DEV && (status === 'CHANNEL_ERROR' || err)) {
          console.warn('[useRealtimeTable] channel status', table, status, err)
        }
      })

    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [table, event, schema, filter, debounceMs, enabled])
}
