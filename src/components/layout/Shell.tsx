/**
 * Shell — TopBar + main content area.
 *
 * Mounts ONCE at the parent route. Modules render whatever shape they
 * want into the main area: 3-panel for transactional masters/orders,
 * single-column for analytical dashboard/reports, etc.
 *
 * Design spec §5.1 — universal chrome, flexible interior.
 */

import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps): JSX.Element {
  return (
    <div className="flex flex-col h-full bg-[color:var(--color-surface)]">
      <TopBar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
