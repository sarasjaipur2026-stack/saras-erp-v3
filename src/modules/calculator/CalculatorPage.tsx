/**
 * Calculator — production planning. 2-card layout (Input | Output).
 * Inputs flow into a pure computeCalculator(); output card auto-updates.
 * Save / load named profiles in calculator_profiles.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  computeCalculator,
  calculatorProfiles,
  DEFAULT_INPUTS,
  type CalculatorInputs,
  type CalculatorYarn,
  type CalculatorProfile,
} from '../../lib/db/calculator'
import { useSWRList } from '../../hooks/useSWRList'
import { Save, FolderOpen, RotateCcw, Plus, Trash2 } from 'lucide-react'

const SWR_KEY = 'calculator_profiles.list'

export default function CalculatorPage(): JSX.Element {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS)
  const [profileName, setProfileName] = useState('')
  const [showLoad, setShowLoad] = useState(false)
  const [savingMsg, setSavingMsg] = useState('')

  const outputs = useMemo(() => computeCalculator(inputs), [inputs])

  const { data: profiles, refetch } = useSWRList<CalculatorProfile[]>(
    SWR_KEY,
    async () => {
      const r = await calculatorProfiles.getAll()
      if (r.error) throw r.error
      return (r.data ?? []).filter((p) => !p.deleted_at)
    },
  )

  useEffect(() => {
    if (savingMsg) {
      const t = setTimeout(() => { setSavingMsg(''); }, 2500)
      return () => { clearTimeout(t); }
    }
  }, [savingMsg])

  const update = <K extends keyof CalculatorInputs>(k: K, v: CalculatorInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [k]: v }))
  }

  const updateYarn = (
    bucket: 'covering_yarns' | 'filler_yarns',
    idx: number,
    patch: Partial<CalculatorYarn>,
  ): void => {
    setInputs((prev) => ({
      ...prev,
      [bucket]: prev[bucket].map((y, i) => (i === idx ? { ...y, ...patch } : y)),
    }))
  }

  const addYarn = (bucket: 'covering_yarns' | 'filler_yarns'): void => {
    setInputs((prev) => ({
      ...prev,
      [bucket]: [...prev[bucket], { rate_per_kg: 0, weight_pct: 0 }],
    }))
  }

  const removeYarn = (bucket: 'covering_yarns' | 'filler_yarns', idx: number): void => {
    setInputs((prev) => ({
      ...prev,
      [bucket]: prev[bucket].filter((_, i) => i !== idx),
    }))
  }

  const reset = (): void => {
    setInputs(DEFAULT_INPUTS)
    setProfileName('')
  }

  const save = async (): Promise<void> => {
    const name = profileName.trim()
    if (!name) {
      setSavingMsg('Enter a profile name first')
      return
    }
    const r = await calculatorProfiles.create({
      name,
      inputs,
      outputs,
    })
    if (r.error) {
      setSavingMsg(`Save failed: ${r.error.message}`)
    } else {
      setSavingMsg(`Saved "${name}"`)
      refetch().catch(() => {/* swallow */})
    }
  }

  const load = (p: CalculatorProfile): void => {
    setInputs({ ...DEFAULT_INPUTS, ...p.inputs })
    setProfileName(p.name)
    setShowLoad(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
      {/* INPUT CARD */}
      <section className="flex flex-col h-full overflow-hidden border-r border-[color:var(--color-border)]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]">
          <div className="flex items-center gap-2">
            <input
              value={profileName}
              onChange={(e) => { setProfileName(e.target.value); }}
              placeholder="Profile name"
              className="text-sm font-semibold bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-[color:var(--color-accent)]"
            />
            {savingMsg && (
              <span className="text-xs text-[color:var(--color-accent)] font-semibold">{savingMsg}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ToolbarBtn onClick={() => void save()} icon={<Save size={14} />} label="Save" />
            <ToolbarBtn onClick={() => { setShowLoad((v) => !v); }} icon={<FolderOpen size={14} />} label="Load" />
            <ToolbarBtn onClick={reset} icon={<RotateCcw size={14} />} label="Reset" />
          </div>
        </header>

        {showLoad && (
          <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-sunken)] max-h-48 overflow-y-auto">
            {(profiles ?? []).length === 0 ? (
              <div className="p-3 text-xs text-[color:var(--color-text-muted)] italic">No saved profiles yet.</div>
            ) : (
              (profiles ?? []).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { load(p); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[color:var(--color-surface-elevated)] border-b border-[color:var(--color-border)]"
                >
                  <div className="font-semibold text-[color:var(--color-text)]">{p.name}</div>
                  <div className="text-[10px] text-[color:var(--color-text-muted)]">
                    {new Date(p.updated_at).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ① Sample naap-tol */}
          <Section title="① Sample Naap-Tol">
            <Grid cols={3}>
              <NumField label="Length (m)" value={inputs.sample_length_m} onChange={(v) => { update('sample_length_m', v); }} />
              <NumField label="Total Wt (g)" value={inputs.sample_total_g} onChange={(v) => { update('sample_total_g', v); }} />
              <NumField label="Width (mm)" value={inputs.sample_width_mm} onChange={(v) => { update('sample_width_mm', v); }} />
              <NumField label="Cov Wt (g)" value={inputs.sample_cov_g} onChange={(v) => { update('sample_cov_g', v); }} />
              <NumField label="Fil Wt (g)" value={inputs.sample_fil_g} onChange={(v) => { update('sample_fil_g', v); }} />
            </Grid>
          </Section>

          {/* ② Customer Order */}
          <Section title="② Customer Order">
            <Grid cols={3}>
              <NumField label="Meters" value={inputs.order_meters} onChange={(v) => { update('order_meters', v); }} />
              <NumField label="Waste %" value={inputs.waste_pct} onChange={(v) => { update('waste_pct', v); }} />
              <NumField label="Actual Sell ₹/kg" value={inputs.actual_sell_per_kg ?? 0} onChange={(v) => { update('actual_sell_per_kg', v); }} />
            </Grid>
          </Section>

          {/* ③ Material */}
          <Section title="③ Yarns">
            <YarnList
              label="Covering"
              yarns={inputs.covering_yarns}
              onChange={(idx, patch) => { updateYarn('covering_yarns', idx, patch); }}
              onAdd={() => { addYarn('covering_yarns'); }}
              onRemove={(idx) => { removeYarn('covering_yarns', idx); }}
            />
            <YarnList
              label="Filler"
              yarns={inputs.filler_yarns}
              onChange={(idx, patch) => { updateYarn('filler_yarns', idx, patch); }}
              onAdd={() => { addYarn('filler_yarns'); }}
              onRemove={(idx) => { removeYarn('filler_yarns', idx); }}
            />
          </Section>

          {/* ④ Pricing */}
          <Section title="④ Pricing">
            <Grid cols={3}>
              <NumField label="Labor ₹/kg" value={inputs.labor_per_kg} onChange={(v) => { update('labor_per_kg', v); }} />
              <NumField label="Overhead ₹/kg" value={inputs.overhead_per_kg} onChange={(v) => { update('overhead_per_kg', v); }} />
              <NumField label="Profit %" value={inputs.profit_pct} onChange={(v) => { update('profit_pct', v); }} />
            </Grid>
          </Section>

          {/* ⑤ Production Plan */}
          <Section title="⑤ Production Plan">
            <Grid cols={3}>
              <NumField label="Speed (m/min)" value={inputs.speed_m_per_min} onChange={(v) => { update('speed_m_per_min', v); }} />
              <NumField label="Machines" value={inputs.machines} onChange={(v) => { update('machines', v); }} />
              <NumField label="Efficiency %" value={inputs.efficiency_pct} onChange={(v) => { update('efficiency_pct', v); }} />
            </Grid>
          </Section>
        </div>
      </section>

      {/* OUTPUT CARD */}
      <section className="flex flex-col h-full overflow-hidden bg-[color:var(--color-surface-sunken)]">
        <header className="px-4 py-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]">
          <div className="text-xs uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold">Output</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profit comparison — top */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Profit Comparison
            </div>
            <Stat label="Calculated Cost" value={`₹${fmt(outputs.total_cost_per_kg)}/kg`} />
            <Stat label="Calculated Sell" value={`₹${fmt(outputs.sell_per_kg)}/kg`} />
            {inputs.actual_sell_per_kg != null && inputs.actual_sell_per_kg > 0 && (
              <Stat
                label="Actual Sell"
                value={`₹${fmt(inputs.actual_sell_per_kg)}/kg`}
                accent
              />
            )}
            <Stat label="Calculated Margin" value={`₹${fmt(outputs.margin_per_kg)}/kg`} />
            {outputs.actual_margin_per_kg != null && (
              <Stat
                label="Actual Margin"
                value={`₹${fmt(outputs.actual_margin_per_kg)}/kg`}
                accent={outputs.actual_margin_per_kg >= outputs.margin_per_kg}
                danger={outputs.actual_margin_per_kg < outputs.margin_per_kg}
              />
            )}
          </div>

          {/* Cost breakdown */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Cost Breakdown
            </div>
            <Stat label="Material" value={`₹${fmt(outputs.material_cost_per_kg)}/kg`} />
            <Stat label="Process (labor + ohd)" value={`₹${fmt(outputs.process_cost_per_kg)}/kg`} />
            <Stat label="Total Cost" value={`₹${fmt(outputs.total_cost_per_kg)}/kg`} bold />
          </div>

          {/* Material requirement */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Material Requirement (with waste)
            </div>
            <Stat label="Covering" value={`${fmt(outputs.cover_kg_total)} kg`} />
            <Stat label="Filler" value={`${fmt(outputs.filler_kg_total)} kg`} />
            <Stat label="Total Yarn" value={`${fmt(outputs.total_yarn_kg)} kg`} bold />
          </div>

          {/* Conversions */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Conversions
            </div>
            <Stat label="1 m weighs" value={`${fmt(outputs.weight_per_m_g)} g`} />
            <Stat label="1 kg" value={`${fmt(outputs.meters_per_kg)} m`} />
            <Stat label="GSM" value={fmt(outputs.gsm)} />
          </div>

          {/* Production estimate */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Production Estimate
            </div>
            <Stat label="Per hour" value={`${fmt(outputs.output_per_hour_m)} m`} />
            <Stat label="Per day (8h)" value={`${fmt(outputs.output_per_day_m)} m`} />
            <Stat label="Days to complete" value={fmt(outputs.days_to_complete)} bold />
          </div>

          {/* Order totals */}
          <div className="rounded-2xl bg-[color:var(--color-surface-elevated)] p-4 border border-[color:var(--color-border)]">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-2">
              Order Totals
            </div>
            <Stat label="Order weight" value={`${fmt(outputs.order_kg)} kg`} />
            <Stat label="Order revenue" value={`₹${fmt(outputs.order_revenue)}`} bold />
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Building blocks ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text)] mb-2">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }): JSX.Element {
  const cls = cols === 3 ? 'grid-cols-3' : 'grid-cols-2'
  return <div className={`grid ${cls} gap-2`}>{children}</div>
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}): JSX.Element {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold mb-1">
        {label}
      </div>
      <input
        type="number"
        step="any"
        value={value === 0 ? '' : value}
        onChange={(e) => { onChange(e.target.value === '' ? 0 : Number(e.target.value)); }}
        className="w-full text-sm bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[color:var(--color-accent)]"
      />
    </label>
  )
}

function YarnList({
  label,
  yarns,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  yarns: CalculatorYarn[]
  onChange: (idx: number, patch: Partial<CalculatorYarn>) => void
  onAdd: () => void
  onRemove: (idx: number) => void
}): JSX.Element {
  return (
    <div className="rounded-xl bg-[color:var(--color-surface-sunken)] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide text-[color:var(--color-text-muted)] font-semibold">
          {label}
        </div>
        <button
          onClick={onAdd}
          className="text-[10px] text-[color:var(--color-accent)] font-semibold flex items-center gap-1 hover:underline"
        >
          <Plus size={10} /> Yarn
        </button>
      </div>
      {yarns.length === 0 && (
        <div className="text-[10px] text-[color:var(--color-text-faint)] italic">No yarns added.</div>
      )}
      {yarns.map((y, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_80px_60px_24px] gap-2 mb-2 items-center">
          <input
            value={y.name ?? ''}
            onChange={(e) => { onChange(idx, { name: e.target.value }); }}
            placeholder="Yarn name"
            className="text-xs bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[color:var(--color-accent)]"
          />
          <input
            type="number"
            step="any"
            value={y.rate_per_kg === 0 ? '' : y.rate_per_kg}
            onChange={(e) => { onChange(idx, { rate_per_kg: e.target.value === '' ? 0 : Number(e.target.value) }); }}
            placeholder="₹/kg"
            className="text-xs bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[color:var(--color-accent)]"
          />
          <input
            type="number"
            step="any"
            value={y.weight_pct === 0 ? '' : y.weight_pct}
            onChange={(e) => { onChange(idx, { weight_pct: e.target.value === '' ? 0 : Number(e.target.value) }); }}
            placeholder="wt%"
            className="text-xs bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[color:var(--color-accent)]"
          />
          <button
            onClick={() => { onRemove(idx); }}
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-danger)]"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

function Stat({
  label,
  value,
  bold,
  accent,
  danger,
}: {
  label: string
  value: string
  bold?: boolean
  accent?: boolean
  danger?: boolean
}): JSX.Element {
  const valueClass = [
    'text-sm tabular-nums',
    bold && 'font-bold text-base',
    accent && 'text-[color:var(--color-accent)]',
    danger && 'text-[color:var(--color-danger)]',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-[color:var(--color-text-muted)]">{label}</span>
      <span className={valueClass || 'text-sm tabular-nums text-[color:var(--color-text)]'}>{value}</span>
    </div>
  )
}

function ToolbarBtn({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text)]"
    >
      {icon}
      {label}
    </button>
  )
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 100) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}
