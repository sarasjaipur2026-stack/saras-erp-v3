/**
 * Stale-while-revalidate list hook.
 *
 * Imported from saras-erp-v2 (commit ea472e9 — the "always-show-stale" contract).
 * Ported to TypeScript with strict generics. The behaviour contract is identical
 * to v2 — DO NOT REGRESS without reading the prior incident report.
 *
 * Contract:
 *   - Cache renders synchronously on FIRST PAINT regardless of age. Always.
 *   - loading=true ONLY when there's no cache entry at all.
 *   - Background revalidation on mount + on tab refocus (after ≥30s hidden).
 *   - Concurrent refetches for the same key coalesce onto a single in-flight
 *     promise (35s grace timeout — solves CRIT-4 silent-fail).
 *   - invalidateSWR(key) wipes an entry; supports trailing `*` for prefix.
 *   - expectsData: true — silent retry once if first result is empty array
 *     (catches the CRIT-4 silent-empty variant). Use for tables that always
 *     have rows (suppliers, customers, products).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const CACHE_PREFIX = 'saras.swr.v3.'

type Fetcher<T> = () => Promise<T>

interface UseSWRListOptions {
  enabled?: boolean
  staleAfterMs?: number
  expectsData?: boolean
}

interface UseSWRListResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<T | null>
}

interface CacheEntry<T> {
  ts: number
  data: T
}

interface InFlightResult<T> {
  fresh: T | null
  error: Error | null
}

const inFlight = new Map<string, Promise<InFlightResult<unknown>>>()

const INFLIGHT_TIMEOUT_MS = 35_000
const EMPTY_RETRY_GAP_MS = 1_500

function readCache<T>(key: string): T | null {
  try {
    const raw = typeof window === 'undefined' ? null : sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T> | null
    return parsed?.data ?? null
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ ts: Date.now(), data } satisfies CacheEntry<T>),
    )
  } catch {
    /* quota exceeded — cache is nice-to-have */
  }
}

function cacheAge(key: string): number {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return Infinity
    const parsed = JSON.parse(raw) as CacheEntry<unknown> | null
    return Date.now() - (parsed?.ts ?? 0)
  } catch {
    return Infinity
  }
}

export function useSWRList<T>(
  key: string,
  fetcher: Fetcher<T>,
  { enabled = true, staleAfterMs = 30_000, expectsData = false }: UseSWRListOptions = {},
): UseSWRListResult<T> {
  const cached = enabled ? readCache<T>(key) : null
  const [data, setData] = useState<T | null>(cached)
  const [loading, setLoading] = useState<boolean>(enabled && cached === null)
  const [error, setError] = useState<Error | null>(null)

  const fetcherRef = useRef<Fetcher<T>>(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const cancelledRef = useRef(false)
  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
    }
  }, [])

  const refetch = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null
    let pending = inFlight.get(key) as Promise<InFlightResult<T>> | undefined
    if (!pending) {
      pending = (async (): Promise<InFlightResult<T>> => {
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
          const runOnce = (): Promise<T> =>
            Promise.race([
              fetcherRef.current(),
              new Promise<never>((_, reject) => {
                timer = setTimeout(
                  () => reject(new Error(`useSWRList timeout for ${key}`)),
                  INFLIGHT_TIMEOUT_MS,
                )
              }),
            ])
          let fresh = await runOnce()
          if (expectsData && Array.isArray(fresh) && fresh.length === 0) {
            if (timer) {
              clearTimeout(timer)
              timer = undefined
            }
            await new Promise((r) => setTimeout(r, EMPTY_RETRY_GAP_MS))
            try {
              const retry = await runOnce()
              if (Array.isArray(retry) && retry.length > 0) fresh = retry
            } catch {
              /* retry failure non-fatal — keep original empty */
            }
          }
          writeCache(key, fresh)
          return { fresh, error: null }
        } catch (e) {
          return { fresh: null, error: e instanceof Error ? e : new Error(String(e)) }
        } finally {
          if (timer) clearTimeout(timer)
          inFlight.delete(key)
        }
      })()
      inFlight.set(key, pending as Promise<InFlightResult<unknown>>)
    }
    const { fresh, error: err } = await pending
    if (cancelledRef.current) return fresh
    if (err) {
      setError(err)
    } else {
      setData(fresh)
      setError(null)
    }
    setLoading(false)
    return fresh
  }, [key, enabled, expectsData])

  // Mount / key change: refetch if cache is missing or stale
  useEffect(() => {
    if (!enabled) return
    const age = cacheAge(key)
    if (age === Infinity || age > staleAfterMs) {
      refetch().catch(() => {
        /* errors surfaced via state */
      })
    } else {
      setLoading(false)
    }
  }, [key, enabled, staleAfterMs, refetch])

  // Tab re-focus after ≥30s hidden: silent revalidation
  useEffect(() => {
    if (!enabled) return
    let hiddenAt = 0
    const handler = (): void => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (document.visibilityState === 'visible' && hiddenAt > 0) {
        if (Date.now() - hiddenAt >= 30_000) {
          refetch().catch(() => {
            /* surfaced via state */
          })
        }
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
    }
  }, [enabled, refetch])

  return { data, loading, error, refetch }
}

/** Evict a cache entry. Trailing `*` matches as a prefix. */
export function invalidateSWR(key: string): void {
  try {
    if (key.endsWith('*')) {
      const prefix = CACHE_PREFIX + key.slice(0, -1)
      const toDelete: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith(prefix)) toDelete.push(k)
      }
      toDelete.forEach((k) => {
        sessionStorage.removeItem(k)
      })
    } else {
      sessionStorage.removeItem(CACHE_PREFIX + key)
    }
  } catch {
    /* ignore */
  }
}
