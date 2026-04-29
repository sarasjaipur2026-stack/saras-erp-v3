/**
 * SwitchToV2Pill — top-bar one-click hop to v2 at the equivalent route.
 * Symmetric pill ships in v2's Topbar pointing back at v3.
 */

import { useLocation } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'

const V2_BASE = import.meta.env.VITE_V2_URL ?? 'https://saras-erp-v2-rebuild.vercel.app'

export function SwitchToV2Pill(): JSX.Element {
  const { pathname } = useLocation()
  const target = `${V2_BASE}${pathname}`
  return (
    <a
      href={target}
      title={`Open the equivalent path on v2 — ${target}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-muted)]"
    >
      <ArrowLeftRight size={12} />
      Try v2
    </a>
  )
}
