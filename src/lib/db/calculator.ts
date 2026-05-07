/**
 * Calculator — production planning. Persists named profiles in
 * `calculator_profiles` (inputs jsonb + outputs jsonb).
 */

import { createTable } from './core'

export interface CalculatorYarn {
  yarn_type_id?: string | null
  name?: string
  rate_per_kg: number
  weight_pct: number  // % of total cover/filler weight
}

export interface CalculatorInputs {
  // Sample naap-tol
  sample_length_m: number
  sample_total_g: number
  sample_cov_g: number
  sample_fil_g: number
  sample_width_mm: number

  // Customer order
  order_meters: number
  waste_pct: number

  // Product / material
  product_id?: string | null
  machine_type_id?: string | null
  chaal_type_id?: string | null
  covering_yarns: CalculatorYarn[]
  filler_yarns: CalculatorYarn[]

  // Pricing
  labor_per_kg: number
  overhead_per_kg: number
  profit_pct: number

  // Production plan
  speed_m_per_min: number
  machines: number
  efficiency_pct: number

  // Optional order link + actual sell price for comparison
  order_id?: string | null
  actual_sell_per_kg?: number | null
}

export interface CalculatorOutputs {
  // Per-meter
  weight_per_m_g: number
  meters_per_kg: number
  gsm: number

  // Material requirement (with waste)
  cover_kg_total: number
  filler_kg_total: number
  total_yarn_kg: number

  // Cost (₹ / kg)
  material_cost_per_kg: number
  process_cost_per_kg: number
  total_cost_per_kg: number
  sell_per_kg: number          // computed sell from profit_pct
  margin_per_kg: number        // computed margin
  actual_margin_per_kg?: number // from actual_sell_per_kg (if linked)

  // Production estimate
  output_per_hour_m: number
  output_per_day_m: number
  days_to_complete: number

  // Order totals
  order_kg: number
  order_revenue: number
}

export interface CalculatorProfile {
  id: string
  user_id: string
  name: string
  inputs: CalculatorInputs
  outputs: CalculatorOutputs | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export const calculatorProfiles = createTable<CalculatorProfile>('calculator_profiles')

// ── Pure calc engine ──────────────────────────────────────────────

export function computeCalculator(i: CalculatorInputs): CalculatorOutputs {
  const length = num(i.sample_length_m)
  const totalG = num(i.sample_total_g)
  const widthMm = num(i.sample_width_mm)
  const orderMeters = num(i.order_meters)
  const wasteFactor = 1 + num(i.waste_pct) / 100

  // Per-meter weight (g/m)
  const weight_per_m_g = length > 0 ? totalG / length : 0
  const meters_per_kg = weight_per_m_g > 0 ? 1000 / weight_per_m_g : 0
  // Approx GSM = (g/m) / width(m)
  const gsm = widthMm > 0 ? weight_per_m_g / (widthMm / 1000) : 0

  // Order weight (kg, with waste)
  const order_kg_no_waste = (orderMeters * weight_per_m_g) / 1000
  const order_kg = order_kg_no_waste * wasteFactor

  // Cover vs filler split from sample
  const sampleCovG = num(i.sample_cov_g)
  const sampleFilG = num(i.sample_fil_g)
  const sampleSplitTotal = sampleCovG + sampleFilG || totalG || 1
  const coverShare = sampleSplitTotal ? sampleCovG / sampleSplitTotal : 1
  const fillerShare = sampleSplitTotal ? sampleFilG / sampleSplitTotal : 0

  const cover_kg_total = order_kg * coverShare
  const filler_kg_total = order_kg * fillerShare
  const total_yarn_kg = cover_kg_total + filler_kg_total

  // Material cost (₹/kg of finished product)
  const coverRate = blendedRate(i.covering_yarns)
  const fillerRate = blendedRate(i.filler_yarns)
  const material_cost_per_kg = coverRate * coverShare + fillerRate * fillerShare

  const process_cost_per_kg = num(i.labor_per_kg) + num(i.overhead_per_kg)
  const total_cost_per_kg = material_cost_per_kg + process_cost_per_kg
  const sell_per_kg = total_cost_per_kg * (1 + num(i.profit_pct) / 100)
  const margin_per_kg = sell_per_kg - total_cost_per_kg
  const hasActual = i.actual_sell_per_kg != null && num(i.actual_sell_per_kg) > 0
  const actual_margin_per_kg = hasActual
    ? num(i.actual_sell_per_kg) - total_cost_per_kg
    : undefined

  // Production estimate
  const speed = num(i.speed_m_per_min)
  const machines = Math.max(1, num(i.machines))
  const eff = num(i.efficiency_pct) / 100
  const output_per_hour_m = speed * 60 * machines * eff
  const output_per_day_m = output_per_hour_m * 8
  const days_to_complete = output_per_day_m > 0 ? orderMeters / output_per_day_m : 0

  const order_revenue = order_kg * sell_per_kg

  const out: CalculatorOutputs = {
    weight_per_m_g,
    meters_per_kg,
    gsm,
    cover_kg_total,
    filler_kg_total,
    total_yarn_kg,
    material_cost_per_kg,
    process_cost_per_kg,
    total_cost_per_kg,
    sell_per_kg,
    margin_per_kg,
    output_per_hour_m,
    output_per_day_m,
    days_to_complete,
    order_kg,
    order_revenue,
  }
  if (actual_margin_per_kg !== undefined) {
    out.actual_margin_per_kg = actual_margin_per_kg
  }
  return out
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function blendedRate(yarns: CalculatorYarn[] | undefined): number {
  if (!yarns?.length) return 0
  const totalPct = yarns.reduce((a, y) => a + num(y.weight_pct), 0)
  if (totalPct <= 0) {
    // If no weights provided, simple average
    const avg = yarns.reduce((a, y) => a + num(y.rate_per_kg), 0) / yarns.length
    return avg
  }
  const weighted = yarns.reduce((a, y) => a + num(y.rate_per_kg) * (num(y.weight_pct) / totalPct), 0)
  return weighted
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  sample_length_m: 0,
  sample_total_g: 0,
  sample_cov_g: 0,
  sample_fil_g: 0,
  sample_width_mm: 0,
  order_meters: 0,
  waste_pct: 5,
  covering_yarns: [{ rate_per_kg: 0, weight_pct: 100 }],
  filler_yarns: [],
  labor_per_kg: 0,
  overhead_per_kg: 0,
  profit_pct: 25,
  speed_m_per_min: 0,
  machines: 1,
  efficiency_pct: 85,
}
