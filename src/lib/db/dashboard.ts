/**
 * Dashboard data access — single-RPC for the entire dashboard.
 */

import { safe, type SafeResult } from './core'
import { supabase } from '../supabase'

export interface DashboardActivity {
  id: string
  op: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE'
  table_name: string
  ts: string
}

export interface DashboardMetrics {
  today_orders: number
  new_enquiries: number
  pending_orders: number
  total_customers: number
  recent_activity: DashboardActivity[]
}

export async function getDashboardMetrics(): Promise<SafeResult<DashboardMetrics>> {
  return safe<DashboardMetrics>(() => supabase.rpc('dashboard_metrics'))
}
