/**
 * BottomTabs — phone navigation between Rail / Centre / Context panels.
 * Hidden on md+ where all three panels are visible side-by-side.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Filter, FileText, Info } from 'lucide-react'

type Tab = 'rail' | 'centre' | 'context'

interface BottomTabsProps {
  rail: ReactNode
  centre: ReactNode
  context: ReactNode
}

export function BottomTabs({ rail, centre, context }: BottomTabsProps): JSX.Element | null {
  const [active, setActive] = useState<Tab>('centre')

  const Icon =
    active === 'rail' ? Filter : active === 'centre' ? FileText : Info

  return (
    <>
      <div className="md:hidden flex-1 overflow-y-auto">
        {active === 'rail' && rail}
        {active === 'centre' && centre}
        {active === 'context' && context}
      </div>
      <nav className="md:hidden h-14 grid grid-cols-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] shrink-0">
        <button
          onClick={() => setActive('rail')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
            active === 'rail'
              ? 'text-[color:var(--color-accent)]'
              : 'text-[color:var(--color-text-muted)]'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
        <button
          onClick={() => setActive('centre')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
            active === 'centre'
              ? 'text-[color:var(--color-accent)]'
              : 'text-[color:var(--color-text-muted)]'
          }`}
        >
          <FileText size={16} />
          Work
        </button>
        <button
          onClick={() => setActive('context')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
            active === 'context'
              ? 'text-[color:var(--color-accent)]'
              : 'text-[color:var(--color-text-muted)]'
          }`}
        >
          <Info size={16} />
          Context
        </button>
      </nav>
      {/* Suppress unused */}
      <Icon className="hidden" />
    </>
  )
}
