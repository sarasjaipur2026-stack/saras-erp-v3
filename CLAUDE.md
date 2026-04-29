# SARAS ERP v3 — Project Brief

## What is this?
A parallel ERP redesign for **RPK Industries**, Jaipur. Built sibling to
`saras-erp-v2` so both can be used side-by-side and compared on real daily
work; the easier one wins and becomes primary.

## Spec
- Design: `saras-erp-v2/docs/specs/2026-04-29-erp-v3-design.md`
- Plan:   `saras-erp-v2/docs/specs/2026-04-29-erp-v3-plan.md`

## Tech stack
- React 19 + Vite 8 + Tailwind v4 + TypeScript strict
- Supabase (separate project from v2)
- PWA via vite-plugin-pwa
- Vitest + Playwright + axe-core

## Architecture invariants (non-negotiable)
1. Every supabase data call wrapped in `safe()` — enforced by `saras/use-safe-wrapper`
2. Every list page uses `useSWRList`, never raw useState/useEffect for fetching
3. Every async fn returns `SafeResult<T> = { data: T \| null; error: Error \| null }`
4. No nested hook calls inside hook factories (Rules of Hooks at error level)
5. All Context values are useMemo'd
6. Every mutable table has idempotency_key, soft_delete, audit_log via universal trigger
7. Cross-source FKs nullable from day 1 (orders, payments, invoices, dispatch)
8. RLS-on with owner policy on every public table
9. SECURITY DEFINER functions: anon EXECUTE revoked + auth.uid() null-guard
10. Layout shell mounts ONCE; modules use `<Outlet>`
11. No raw Tailwind color classes outside src/components/ui/ — enforced by `saras/semantic-colors`

## Imported v2 primitives (frozen)
These five files are battle-tested through 56 v2 hot-fixes. Edit only on real bug:
- src/hooks/useSWRList.ts
- src/lib/db/core.ts (safe + fetchAllPaged + createTable)
- src/lib/authGate.ts
- src/lib/perfMark.ts
- src/lib/realtime/useRealtimeTable.ts

## Module sequence
0. Foundations  (this phase)
1. Dashboard
2. Masters
3. Orders
4. Stock
5. Production
6. Purchase
7. Dispatch
8. Invoices
9. Payments
10. Quality
11. Jobwork
12. Notifications
13. Calculator
14. Settings
15. Reports
16. POS port
17. Audit
18. Comparison verdict

Each module gets a sub-spec at `docs/specs/v3-<module>.md` BEFORE build,
ships independently, runs Comparison Day before next phase advances.

## Switch pill
v3 topbar shows "Try v2 →" pointing at the equivalent path on
`saras-erp-v2-rebuild.vercel.app`. v2's topbar will mirror it pointing here.

## Owner
RPK · rachitrpk@gmail.com · RPK Industries · Jaipur
