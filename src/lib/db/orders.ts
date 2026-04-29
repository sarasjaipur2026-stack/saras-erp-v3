/**
 * Orders data access — typed RPCs + factory.
 */

import { createTable, safe, type SafeResult } from './core'
import { supabase } from '../supabase'

export type OrderStatus =
  | 'draft' | 'booking' | 'approved' | 'production'
  | 'qc' | 'dispatch' | 'completed' | 'cancelled' | 'on_hold'

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Order {
  id: string
  user_id: string
  order_number: string
  customer_id?: string | null
  order_type_id?: string | null
  broker_id?: string | null
  warehouse_id?: string | null
  status: OrderStatus
  priority: OrderPriority
  order_date: string
  delivery_date?: string | null
  subtotal: number
  discount_pct: number
  discount_amt: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax: number
  charges_total: number
  grand_total: number
  advance_paid: number
  balance_due: number
  notes?: string | null
  custom_fields?: Record<string, unknown>
  search_text?: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface OrderLineItem {
  id: string
  order_id: string
  product_id?: string | null
  description: string
  qty: number
  unit: string
  rate: number
  discount_pct: number
  discount_amt: number
  hsn_code?: string | null
  gst_rate: number
  taxable_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  line_total: number
  sort_order: number
}

export interface CreateOrderPayload {
  customer_id?: string | null
  order_type_id?: string | null
  warehouse_id?: string | null
  status?: OrderStatus
  priority?: OrderPriority
  order_date?: string
  delivery_date?: string | null
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax: number
  charges_total?: number
  grand_total: number
  notes?: string | null
  lines: Array<Omit<OrderLineItem, 'id' | 'order_id'>>
  charges?: Array<{ charge_type_id?: string; name?: string; amount: number; is_taxable?: boolean; hsn_code?: string; gst_rate?: number; cgst_amount?: number; sgst_amount?: number; igst_amount?: number }>
}

export const orders = createTable<Order>('orders')
export const orderLineItems = createTable<OrderLineItem>('order_line_items')

/** Atomically create an order. Returns the new order id in `data`. */
export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<SafeResult<string>> {
  return safe<string>(() =>
    supabase.rpc('create_order', { p_payload: payload, p_idempotency_key: idempotencyKey }),
  )
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<SafeResult<null>> {
  return safe<null>(() => supabase.rpc('update_order_status', { p_id: id, p_status: status }))
}
