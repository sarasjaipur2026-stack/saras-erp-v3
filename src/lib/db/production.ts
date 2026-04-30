import { createTable, safe, type SafeResult } from './core'
import { supabase } from '../supabase'

export type ProductionStatus =
  | 'queued' | 'cone_winding' | 'bobbin_winding' | 'braiding'
  | 'qc' | 'packing' | 'completed' | 'on_hold' | 'cancelled'

export interface ProductionPlan {
  id: string
  user_id: string
  plan_number: string
  order_id?: string | null
  product_id?: string | null
  machine_type_id?: string | null
  machine_unit_id?: string | null
  operator_id?: string | null
  qty_planned: number
  qty_done: number
  unit: string
  status: ProductionStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export const productionPlans = createTable<ProductionPlan>('production_plans')

export async function advanceProductionStatus(
  id: string,
  status: ProductionStatus,
): Promise<SafeResult<null>> {
  return safe<null>(() => supabase.rpc('advance_production_status', { p_id: id, p_status: status }))
}

export const PRODUCTION_STAGES: { key: ProductionStatus; label: string }[] = [
  { key: 'queued', label: 'Queue' },
  { key: 'cone_winding', label: 'Cone' },
  { key: 'bobbin_winding', label: 'Bobbin' },
  { key: 'braiding', label: 'Braid' },
  { key: 'qc', label: 'QC' },
  { key: 'packing', label: 'Pack' },
  { key: 'completed', label: 'Done' },
]
