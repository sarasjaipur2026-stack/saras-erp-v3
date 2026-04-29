/**
 * Router — v3 route map.
 *
 * Persistent <LayoutShell> parent route + child routes. Modules ship as
 * lazy chunks so the shell loads fast and modules code-split.
 *
 * Phase 0 ships placeholders for every module so the sidebar is fully
 * navigable from day 1; modules fill in per Phase 1-16.
 */

import { lazy, Suspense } from 'react'
import { Navigate, Outlet, createBrowserRouter, Link } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Shell } from './components/layout/Shell'

const LoginPage = lazy(() => import('./pages/LoginPage'))

function ShellGuarded(): JSX.Element {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-full grid place-items-center text-[color:var(--color-text-muted)]">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return (
    <Shell>
      <Shell.Rail>
        <ComingSoonRail />
      </Shell.Rail>
      <Shell.Centre>
        <Suspense fallback={<div className="p-6">Loading module…</div>}>
          <Outlet />
        </Suspense>
      </Shell.Centre>
      <Shell.Context>
        <ContextPlaceholder />
      </Shell.Context>
    </Shell>
  )
}

function ComingSoonRail(): JSX.Element {
  const items: { path: string; label: string }[] = [
    { path: '/', label: 'Dashboard' },
    { path: '/orders', label: 'Orders' },
    { path: '/pos', label: 'POS' },
    { path: '/stock', label: 'Stock' },
    { path: '/production', label: 'Production' },
    { path: '/purchase', label: 'Purchase' },
    { path: '/dispatch', label: 'Dispatch' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/payments', label: 'Payments' },
    { path: '/quality', label: 'Quality' },
    { path: '/jobwork', label: 'Jobwork' },
    { path: '/calculator', label: 'Calculator' },
    { path: '/reports', label: 'Reports' },
    { path: '/masters', label: 'Masters' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/settings', label: 'Settings' },
  ]
  return (
    <nav className="p-2 space-y-0.5 text-sm">
      {items.map((it) => (
        <Link
          key={it.path}
          to={it.path}
          className="block px-3 py-2 rounded-lg text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-sunken)] hover:text-[color:var(--color-text)]"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}

function ContextPlaceholder(): JSX.Element {
  return (
    <div className="p-4 text-xs text-[color:var(--color-text-faint)]">
      Right-side context panel. Each module fills this with live state.
    </div>
  )
}

function ComingSoon({ title }: { title: string }): JSX.Element {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-[color:var(--color-text)] mb-2">{title}</h1>
      <p className="text-sm text-[color:var(--color-text-muted)]">
        Coming soon — this module ships in a later phase.
      </p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<div className="min-h-full grid place-items-center">Loading…</div>}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    element: <ShellGuarded />,
    children: [
      { path: '/', element: <ComingSoon title="Dashboard" /> },
      { path: '/orders', element: <ComingSoon title="Orders" /> },
      { path: '/pos', element: <ComingSoon title="POS" /> },
      { path: '/stock', element: <ComingSoon title="Stock" /> },
      { path: '/production', element: <ComingSoon title="Production" /> },
      { path: '/purchase', element: <ComingSoon title="Purchase" /> },
      { path: '/dispatch', element: <ComingSoon title="Dispatch" /> },
      { path: '/invoices', element: <ComingSoon title="Invoices" /> },
      { path: '/payments', element: <ComingSoon title="Payments" /> },
      { path: '/quality', element: <ComingSoon title="Quality Check" /> },
      { path: '/jobwork', element: <ComingSoon title="Jobwork" /> },
      { path: '/calculator', element: <ComingSoon title="Calculator" /> },
      { path: '/reports', element: <ComingSoon title="Reports" /> },
      { path: '/masters', element: <ComingSoon title="Masters" /> },
      { path: '/notifications', element: <ComingSoon title="Notifications" /> },
      { path: '/settings', element: <ComingSoon title="Settings" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
