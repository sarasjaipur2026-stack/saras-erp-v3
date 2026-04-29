/**
 * Shell — root 3-panel layout primitive.
 *
 * Spec design §5.1. Composes TopBar + Rail + Centre + Context (desktop)
 * or TopBar + bottom-tab navigated panels (phone).
 *
 * Modules use:
 *   <Shell>
 *     <Shell.Rail>...</Shell.Rail>
 *     <Shell.Centre>...</Shell.Centre>
 *     <Shell.Context>...</Shell.Context>
 *   </Shell>
 */

import { Children, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { TopBar } from './TopBar'
import { BottomTabs } from './BottomTabs'

interface ShellProps {
  children: ReactNode
}

interface PanelProps {
  children: ReactNode
}

function Rail({ children }: PanelProps): JSX.Element {
  return <>{children}</>
}
function Centre({ children }: PanelProps): JSX.Element {
  return <>{children}</>
}
function Context({ children }: PanelProps): JSX.Element {
  return <>{children}</>
}

export function Shell({ children }: ShellProps): JSX.Element {
  // Slot extraction — children are the named subcomponents
  let railNode: ReactNode = null
  let centreNode: ReactNode = null
  let contextNode: ReactNode = null
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const c = child as ReactElement
    if (c.type === Rail) railNode = c
    else if (c.type === Centre) centreNode = c
    else if (c.type === Context) contextNode = c
  })

  return (
    <div className="flex flex-col h-full bg-[color:var(--color-surface)]">
      <TopBar />
      <div className="flex-1 grid overflow-hidden md:grid-cols-[220px_1fr_360px] grid-cols-1">
        <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-r border-[color:var(--color-border)] overflow-y-auto">
          {railNode}
        </aside>
        <main className="overflow-y-auto">{centreNode}</main>
        <aside className="hidden md:block bg-[color:var(--color-surface-elevated)] border-l border-[color:var(--color-border)] overflow-y-auto">
          {contextNode}
        </aside>
      </div>
      <BottomTabs rail={railNode} centre={centreNode} context={contextNode} />
    </div>
  )
}

Shell.Rail = Rail
Shell.Centre = Centre
Shell.Context = Context
