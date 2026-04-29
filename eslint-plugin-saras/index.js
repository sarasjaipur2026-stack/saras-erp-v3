/**
 * eslint-plugin-saras — project-local ESLint rules for SARAS ERP v3.
 *
 * Rules baked into the design as architecture invariants:
 *   - use-safe-wrapper: every supabase.from() / supabase.rpc() call must be
 *     inside a safe(() => ...) callback. Solves v2 lesson #3 (`/settings`
 *     hung forever after idle because direct supabase calls bypassed the
 *     30s timeout + ensureFreshSession() pre-flight).
 *   - semantic-colors: raw Tailwind colour classes (text-slate-700,
 *     bg-indigo-600, etc) only allowed inside src/components/ui/. Solves
 *     v2 lesson #11 (design language drift across modules).
 */

import useSafeWrapper from './rules/use-safe-wrapper.js'
import semanticColors from './rules/semantic-colors.js'

export default {
  meta: { name: 'eslint-plugin-saras', version: '1.0.0' },
  rules: {
    'use-safe-wrapper': useSafeWrapper,
    'semantic-colors': semanticColors,
  },
}
