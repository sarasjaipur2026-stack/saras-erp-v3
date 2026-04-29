/**
 * AuthContext — wraps Supabase Auth.
 *
 * Pre-warms ensureFreshSession on visibilitychange (tab return) so the
 * cold-path refresh is in-flight before any data call fires.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { markSessionFresh, prewarmSession } from '../lib/authGate'

interface Profile {
  id: string
  email: string
  full_name?: string
  role?: 'admin' | 'manager' | 'staff' | 'viewer' | 'cashier'
  permissions?: Record<string, Record<string, boolean>>
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  hasPermission: (module: string, action?: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap from existing session
  useEffect(() => {
    let alive = true
    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      setSession(data.session)
      markSessionFresh(data.session)
      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      markSessionFresh(newSession)
    })

    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') prewarmSession()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      alive = false
      sub.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Load profile when session changes
  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setProfile(null)
      return
    }
    let alive = true
    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, permissions')
        .eq('id', userId)
        .maybeSingle()
      if (!alive) return
      if (error) {
        console.warn('[auth] profile fetch failed', error.message)
        return
      }
      setProfile((data as Profile | null) ?? null)
    })()
    return () => {
      alive = false
    }
  }, [session])

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    },
    [],
  )

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
  }, [])

  const hasPermission = useCallback(
    (module: string, action?: string): boolean => {
      if (!profile) return false
      if (profile.role === 'admin') return true
      const perms = profile.permissions?.[module]
      if (!perms) return profile.role !== 'viewer' // permissive default for non-viewers
      if (!action) return Object.values(perms).some((v) => v === true)
      return perms[action] === true
    },
    [profile],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      signIn,
      signOut,
      hasPermission,
    }),
    [session, profile, loading, signIn, signOut, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
