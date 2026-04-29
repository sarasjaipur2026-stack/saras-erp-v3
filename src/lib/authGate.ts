/**
 * Auth Gate — coalesced session refresh with warm-path zero overhead.
 *
 * Imported from saras-erp-v2 (commit 0c7d185). Solves v2 lesson #2 / CRIT-4:
 * after idle, two refreshes would race (visibilitychange + 401-retry on a
 * stale-JWT query) costing ~1.5-2.5s and occasionally deadlocking. The gate
 * coalesces all callers onto a single refresh promise.
 *
 * Contract:
 *   - Warm path (token still fresh): zero overhead.
 *   - Cold path: exactly one round-trip; concurrent callers share the promise.
 */

import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

const TOKEN_LIFETIME_MS = 60 * 60 * 1000
const SAFETY_MARGIN_MS = 5 * 60 * 1000

let lastKnownFreshUntil = 0
let inFlight: Promise<Session | null> | null = null

function logIfDev(...args: unknown[]): void {
  if (typeof import.meta !== 'undefined' && import.meta.env.DEV) {
    console.warn('[authGate]', ...args)
  }
}

function freshUntilFromSession(session: Session | null): number {
  if (!session) return 0
  if (session.expires_at) return session.expires_at * 1000 - SAFETY_MARGIN_MS
  if (session.expires_in) return Date.now() + session.expires_in * 1000 - SAFETY_MARGIN_MS
  return Date.now() + TOKEN_LIFETIME_MS - SAFETY_MARGIN_MS
}

async function doRefresh(): Promise<Session | null> {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    // getSession returns a cached session without network call when valid
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (session && freshUntilFromSession(session) > Date.now()) {
      lastKnownFreshUntil = freshUntilFromSession(session)
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
      logIfDev('getSession warm hit', `${dur.toFixed(0)}ms`)
      return session
    }
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      lastKnownFreshUntil = 0
      logIfDev('refreshSession FAILED', error.message)
      return null
    }
    const fresh = data.session
    lastKnownFreshUntil = freshUntilFromSession(fresh)
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    logIfDev('refreshSession took', `${dur.toFixed(0)}ms`)
    return fresh
  } catch (e) {
    lastKnownFreshUntil = 0
    logIfDev('refreshSession threw', e instanceof Error ? e.message : String(e))
    return null
  }
}

/**
 * Await this before any DB call. ~μs on the warm path; cold path coalesces
 * all concurrent callers onto a single refresh round-trip.
 */
export async function ensureFreshSession(): Promise<void> {
  if (lastKnownFreshUntil > Date.now()) return
  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null
    })
  }
  await inFlight
}

/** Pre-warm on tab resume / focus / login. Doesn't throw, doesn't await. */
export function prewarmSession(): void {
  if (lastKnownFreshUntil > Date.now()) return
  ensureFreshSession().catch(() => {
    // Non-critical — actual queries will surface real errors.
  })
}

/** Update gate state from an onAuthStateChange event without forcing a round-trip. */
export function markSessionFresh(session: Session | null): void {
  lastKnownFreshUntil = session ? freshUntilFromSession(session) : 0
}

/** Testing / debug only. */
export function __debugAuthGate(): { lastKnownFreshUntil: number; hasInFlight: boolean; nowMs: number } {
  return { lastKnownFreshUntil, hasInFlight: !!inFlight, nowMs: Date.now() }
}
