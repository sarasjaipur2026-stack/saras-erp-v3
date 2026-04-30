/**
 * Router — v3 route map. Single persistent Shell parent route.
 *
 * Each module renders its own internal layout inside the Outlet:
 *   - Analytical (Dashboard, Reports): single column.
 *   - Transactional (Orders, Masters, etc): 3-panel via internal grid.
 *
 * Per design Q4=C — strict 3-panel for transactional, flexible for analytical.
 */

import { lazy, Suspense } from 'react'
import { Navigate, Outlet, createBrowserRouter, Link } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Shell } from './components/layout/Shell'
import { MasterPage } from './modules/masters/MasterPage'
import { customersConfig } from './modules/masters/configs/customers'
import { suppliersConfig } from './modules/masters/configs/suppliers'
import { productsConfig } from './modules/masters/configs/products'
import { hsnCodesConfig } from './modules/masters/configs/hsn-codes'
import { warehousesConfig } from './modules/masters/configs/warehouses'
import { unitsConfig } from './modules/masters/configs/units'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'))
const OrdersPage = lazy(() => import('./modules/orders/OrdersPage'))
const StockPage = lazy(() => import('./modules/stock/StockPage'))
const ProductionPage = lazy(() => import('./modules/production/ProductionPage'))

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
      <Suspense fallback={<div className="p-6">Loading module…</div>}>
        <Outlet />
      </Suspense>
    </Shell>
  )
}

function ComingSoon({ title }: { title: string }): JSX.Element {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-[color:var(--color-text)] mb-2">{title}</h1>
      <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
        Coming soon — this module ships in a later phase.
      </p>
      <Link
        to="/"
        className="text-sm text-[color:var(--color-accent)] hover:underline"
      >
        ← Back to dashboard
      </Link>
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
      { path: '/', element: <DashboardPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/pos', element: <ComingSoon title="POS" /> },
      { path: '/stock', element: <StockPage /> },
      { path: '/production', element: <ProductionPage /> },
      { path: '/purchase', element: <ComingSoon title="Purchase" /> },
      { path: '/dispatch', element: <ComingSoon title="Dispatch" /> },
      { path: '/invoices', element: <ComingSoon title="Invoices" /> },
      { path: '/payments', element: <ComingSoon title="Payments" /> },
      { path: '/quality', element: <ComingSoon title="Quality Check" /> },
      { path: '/jobwork', element: <ComingSoon title="Jobwork" /> },
      { path: '/calculator', element: <ComingSoon title="Calculator" /> },
      { path: '/reports', element: <ComingSoon title="Reports" /> },
      { path: '/notifications', element: <ComingSoon title="Notifications" /> },
      { path: '/settings', element: <ComingSoon title="Settings" /> },
      // Masters — generic page driven by config
      { path: '/masters', element: <Navigate to="/masters/customers" replace /> },
      { path: '/masters/customers', element: <MasterPage config={customersConfig} /> },
      { path: '/masters/suppliers', element: <MasterPage config={suppliersConfig} /> },
      { path: '/masters/products', element: <MasterPage config={productsConfig} /> },
      { path: '/masters/hsn-codes', element: <MasterPage config={hsnCodesConfig} /> },
      { path: '/masters/warehouses', element: <MasterPage config={warehousesConfig} /> },
      { path: '/masters/units', element: <MasterPage config={unitsConfig} /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
