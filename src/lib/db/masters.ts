/**
 * Master table factories — every master gets a typed createTable instance.
 */

import { createTable } from './core'

export interface MasterRow {
  id: string
  user_id: string
  active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface Customer extends MasterRow {
  firm_name: string
  contact_name?: string
  phone?: string
  whatsapp?: string
  email?: string
  gstin?: string
  state_code?: string
  pan?: string
  credit_limit?: number
  customer_group?: string
  notes?: string
  search_text?: string
}

export interface Supplier extends MasterRow {
  firm_name: string
  contact_name?: string
  phone?: string
  email?: string
  gstin?: string
  state_code?: string
  quality_rating?: number
  blacklisted?: boolean
  search_text?: string
}

export interface Product extends MasterRow {
  code: string
  name: string
  hsn_code?: string
  gst_rate?: number
  rate_unit: 'per_meter' | 'per_kg' | 'per_piece'
  default_rate?: number
  uses_filler?: boolean
  category?: string
  search_text?: string
}

export interface HsnCode extends MasterRow {
  code: string
  description?: string
  cgst_pct?: number
  sgst_pct?: number
  igst_pct?: number
}

export interface Unit extends MasterRow {
  name: string
  symbol: string
  unit_type?: 'length' | 'weight' | 'quantity'
}

export interface Warehouse extends MasterRow {
  name: string
  address?: string
  warehouse_type?: 'raw_material' | 'finished_goods' | 'both'
}

export const customers = createTable<Customer>('customers')
export const suppliers = createTable<Supplier>('suppliers')
export const products = createTable<Product>('products')
export const hsnCodes = createTable<HsnCode>('hsn_codes')
export const units = createTable<Unit>('units')
export const warehouses = createTable<Warehouse>('warehouses')
