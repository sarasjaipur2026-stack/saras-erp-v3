/**
 * Lightweight perf timer for fetch / heavy ops.
 * Imported from saras-erp-v2; ported to TypeScript.
 *
 * Usage:
 *   const data = await perfMark('orders.list', () => listOrders(...))
 */

const BUDGET_MS = {
  fetch: 800,
  render: 200,
} as const

export type PerfBudgetKey = keyof typeof BUDGET_MS

interface PerfMarkOptions {
  budget?: number
}

export async function perfMark<T>(
  label: string,
  fn: () => Promise<T>,
  { budget = BUDGET_MS.fetch }: PerfMarkOptions = {},
): Promise<T> {
  if (typeof performance === 'undefined' || !performance.now) return fn()
  const start = performance.now()
  try {
    const result = await fn()
    const dur = performance.now() - start
    try {
      performance.measure(`perf:${label}`, { start, duration: dur })
    } catch {
      /* performance.measure may not accept options on older browsers */
    }
    if (import.meta.env.DEV && dur > budget) {
      console.warn(`[perf] ${label} took ${dur.toFixed(0)}ms (budget ${budget.toString()}ms)`)
    }
    return result
  } catch (err) {
    const dur = performance.now() - start
    if (import.meta.env.DEV) {
      console.warn(`[perf] ${label} FAILED after ${dur.toFixed(0)}ms`, err)
    }
    throw err
  }
}

export const PERF_BUDGET = BUDGET_MS
