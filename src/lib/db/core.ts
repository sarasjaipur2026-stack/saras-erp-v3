/**
 * Generic CRUD factory + safe() wrapper + fetchAllPaged.
 *
 * Imported from saras-erp-v2 (lib/db/core.js), ported to TypeScript with a
 * canonical SafeResult<T> envelope (v2 lesson #12 — typed envelope catches
 * the {data, error} drift at compile time).
 *
 * Usage:
 *   const customers = createTable<Customer>('customers')
 *   const { data, error } = await customers.list(userId)
 */

import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'
import { ensureFreshSession } from '../authGate'
import { supabase } from '../supabase'

const REQUEST_TIMEOUT_MS = 30_000
const MAX_PAGED_ROWS = 50_000
const PAGE_SIZE = 1_000

/**
 * Universal envelope for every async DB call.
 * On success: { data: T, error: null }. On failure: { data: null, error: Error }.
 */
export interface SafeResult<T> {
  data: T | null
  error: Error | null
}

export interface PagedResult<T> extends SafeResult<T[]> {
  truncated?: boolean
}

/**
 * Paginate through a Supabase query using .range() to bypass the 1000-row
 * default. v2 lesson #4 — this hid 2,449 of 3,449 customers from masters
 * until rebuilt with this pattern.
 */
export async function fetchAllPaged<T>(
  buildQuery: (from: number, to: number) => PromiseLike<PostgrestResponse<T>>,
): Promise<PagedResult<T>> {
  try {
    await ensureFreshSession()
  } catch {
    /* non-fatal — query will surface the real error */
  }

  const all: T[] = []
  let from = 0
  while (from < MAX_PAGED_ROWS) {
    const to = from + PAGE_SIZE - 1
    let timer: ReturnType<typeof setTimeout> | undefined
    let result: PostgrestResponse<T>
    try {
      result = await Promise.race([
        Promise.resolve(buildQuery(from, to)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('fetchAllPaged page timeout after 30s')),
            REQUEST_TIMEOUT_MS,
          )
        }),
      ])
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    } finally {
      if (timer) clearTimeout(timer)
    }
    const { data, error } = result
    if (error) return { data: null, error: new Error(error.message) }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  const truncated = all.length >= MAX_PAGED_ROWS
  const result: PagedResult<T> = { data: all, error: null }
  if (truncated) result.truncated = true
  return result
}

/**
 * The mandatory wrapper for every supabase data call. Pre-warms the auth
 * gate, races against a 30s timeout, and returns the canonical
 * `{data, error}` envelope. Solves v2 lessons #2, #3, #12.
 */
export async function safe<T>(
  fn: () => PromiseLike<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
): Promise<SafeResult<T>> {
  try {
    await ensureFreshSession()
  } catch {
    /* non-fatal */
  }
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      Promise.resolve(fn()),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Request timed out after 30s')),
          REQUEST_TIMEOUT_MS,
        )
      }),
    ])
    const { data, error } = result
    if (error) return { data: null, error: new Error(error.message) }
    return { data: (data as T) ?? null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

interface CreateTableOptions {
  orderBy?: string
  orderAsc?: boolean
  select?: string
  ownerFilter?: boolean
}

export interface TableApi<TRow> {
  list: (userId?: string) => Promise<PagedResult<TRow>>
  getAll: () => Promise<PagedResult<TRow>>
  get: (id: string) => Promise<SafeResult<TRow>>
  create: (data: Partial<TRow> | Partial<TRow>[]) => Promise<SafeResult<TRow>>
  createMany: (items: Partial<TRow>[]) => Promise<SafeResult<TRow[]>>
  update: (id: string, data: Partial<TRow>) => Promise<SafeResult<TRow>>
  delete: (id: string) => Promise<SafeResult<TRow>>
}

/**
 * Generic CRUD factory. Returns typed list/get/create/update/delete for any table.
 *
 * @example
 *   const customers = createTable<Customer>('customers')
 *   const { data } = await customers.list(user.id)
 */
export function createTable<TRow extends { id?: string; user_id?: string }>(
  table: string,
  opts: CreateTableOptions = {},
): TableApi<TRow> {
  const { orderBy = 'created_at', orderAsc = false, select = '*', ownerFilter = true } = opts

  return {
    list: async (userId?: string) =>
      fetchAllPaged<TRow>((lo, hi) => {
        let q = supabase.from(table).select(select)
        if (ownerFilter && userId) q = q.eq('user_id', userId)
        return q.order(orderBy, { ascending: orderAsc }).range(lo, hi) as unknown as PromiseLike<PostgrestResponse<TRow>>
      }),

    getAll: async () =>
      fetchAllPaged<TRow>((lo, hi) =>
        supabase
          .from(table)
          .select(select)
          .order(orderBy, { ascending: orderAsc })
          .range(lo, hi) as unknown as PromiseLike<PostgrestResponse<TRow>>,
      ),

    get: async (id: string) =>
      safe<TRow>(() =>
        supabase.from(table).select(select).eq('id', id).single() as unknown as PromiseLike<PostgrestSingleResponse<TRow>>,
      ),

    create: async (data: Partial<TRow> | Partial<TRow>[]) =>
      safe<TRow>(() => {
        const rows = (Array.isArray(data) ? data : [data]) as unknown as Record<string, unknown>[]
        return supabase
          .from(table)
          .insert(rows)
          .select()
          .single() as unknown as PromiseLike<PostgrestSingleResponse<TRow>>
      }),

    createMany: async (items: Partial<TRow>[]) =>
      safe<TRow[]>(() =>
        supabase
          .from(table)
          .insert(items as unknown as Record<string, unknown>[])
          .select() as unknown as PromiseLike<PostgrestResponse<TRow>>,
      ),

    update: async (id: string, data: Partial<TRow>) =>
      safe<TRow>(() =>
        supabase
          .from(table)
          .update(data as unknown as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single() as unknown as PromiseLike<PostgrestSingleResponse<TRow>>,
      ),

    delete: async (id: string) =>
      safe<TRow>(() =>
        supabase.from(table).delete().eq('id', id) as unknown as PromiseLike<PostgrestSingleResponse<TRow>>,
      ),
  }
}
