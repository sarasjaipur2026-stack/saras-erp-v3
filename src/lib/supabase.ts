import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client for v3.
 *
 * Env vars validated at module-load. Missing vars produce a console.error
 * (not a throw) so dev/preview builds with a placeholder still render the
 * shell — useful while v3 Supabase project is being provisioned.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[saras-erp-v3] Supabase env vars missing — set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Disable navigator.locks — single-tab SPA, lock-based sync isn't needed
      // and has hung in some browser contexts (v2 lesson).
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
    global: {
      headers: { 'X-Client-Info': 'saras-erp-v3' },
    },
  },
)
