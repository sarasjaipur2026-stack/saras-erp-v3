/**
 * saras/use-safe-wrapper
 *
 * Flags any `supabase.from(...).<chain>` or `supabase.rpc(...)` that is NOT
 * inside a `safe(() => ...)` callback (or `safe(async () => ...)`).
 *
 * Background: in v2, direct supabase calls that bypassed safe() lacked the
 * 30s timeout and the ensureFreshSession() pre-flight. After ~5 min idle,
 * supabase-js could enter an auth-refresh queued state where the next call
 * would hang forever. The /settings page hit this. This rule catches the
 * class at lint time.
 *
 * Allowed patterns:
 *   safe(() => supabase.from('x').select('*'))                    OK
 *   safe(async () => { const r = await supabase.from(...).select(); ... }) OK
 *   safe(() => supabase.rpc('fn', {}))                            OK
 *   supabase.auth.getUser()                                       OK (auth namespace)
 *   supabase.storage.from(...)                                    OK (storage namespace)
 *   supabase.channel(...)                                         OK (realtime)
 *
 * Disallowed:
 *   supabase.from('x').select('*')           (top-level, not in safe)
 *   await supabase.from('x').select('*')     (top-level, not in safe)
 */

const SAFE_FN_NAMES = new Set(['safe'])

export default {
  meta: {
    type: 'problem',
    docs: { description: 'supabase data calls must go through safe() wrapper' },
    schema: [],
    messages: {
      bare: 'supabase.{{ chain }}() must be wrapped in safe(() => ...). See v2 lesson #3.',
    },
  },
  create(context) {
    /**
     * Walk up the AST from a node; return true iff some ancestor is a
     * CallExpression whose callee is `safe`.
     */
    function isInsideSafeCallback(node) {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'CallExpression') {
          const c = parent.callee
          if (c && c.type === 'Identifier' && SAFE_FN_NAMES.has(c.name)) {
            return true
          }
        }
        parent = parent.parent
      }
      return false
    }

    /** True iff the MemberExpression starts at an Identifier named `supabase`. */
    function rootIsSupabase(node) {
      let cur = node
      while (cur && cur.type === 'MemberExpression') cur = cur.object
      return cur && cur.type === 'Identifier' && cur.name === 'supabase'
    }

    /** Return the immediate property name after `supabase.` (e.g. 'from', 'rpc', 'auth'). */
    function firstPropName(callExpr) {
      // CallExpression.callee can be MemberExpression; we want the leftmost prop after supabase
      let cur = callExpr.callee
      while (cur && cur.type === 'MemberExpression') {
        if (cur.object.type === 'Identifier' && cur.object.name === 'supabase') {
          return cur.property && cur.property.name
        }
        cur = cur.object
      }
      return null
    }

    return {
      CallExpression(node) {
        const callee = node.callee
        if (!callee || callee.type !== 'MemberExpression') return
        if (!rootIsSupabase(callee)) return

        const prop = firstPropName(node)
        // Only flag data-mutating namespaces. Allow auth/storage/channel/realtime/rest.
        if (prop !== 'from' && prop !== 'rpc') return

        if (isInsideSafeCallback(node)) return

        context.report({
          node,
          messageId: 'bare',
          data: { chain: prop },
        })
      },
    }
  },
}
