/**
 * v2 → v3 data migration script.
 *
 * Reads from v2 Supabase via service-role, transforms to v3 shape, writes
 * to v3 Supabase. Idempotent on `id` — re-running is a no-op for already
 * migrated rows.
 *
 * Phase 0 deliverable is profile-only seed. Each module phase that adds a
 * v3 table also adds the migration logic for that table (see registry below).
 *
 * Run:  npm run migrate:v2-to-v3
 * Env:  V2_URL, V2_SERVICE_KEY, V3_URL, V3_SERVICE_KEY
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AnyClient = SupabaseClient<any, any, any, any, any>  // eslint-disable-line @typescript-eslint/no-explicit-any

interface MigrationConfig {
  v2Url: string
  v2Key: string
  v3Url: string
  v3Key: string
}

function readEnv(): MigrationConfig {
  const cfg: MigrationConfig = {
    v2Url: process.env.V2_URL ?? '',
    v2Key: process.env.V2_SERVICE_KEY ?? '',
    v3Url: process.env.V3_URL ?? '',
    v3Key: process.env.V3_SERVICE_KEY ?? '',
  }
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missing.length > 0) {
    console.error('Missing env: ' + missing.join(', '))
    process.exit(1)
  }
  return cfg
}

interface MigrationStep {
  name: string
  run: (v2: AnyClient, v3: AnyClient) => Promise<void>
}

/** Migration step registry — each phase appends its own step here. */
const steps: MigrationStep[] = [
  {
    name: 'profiles',
    async run(v2, v3) {
      const { data: rows, error } = await v2.from('profiles').select('*')
      if (error) throw new Error(`v2 profiles fetch: ${error.message}`)
      if (!rows || rows.length === 0) {
        console.log('  no profiles to migrate')
        return
      }
      // v3 profile shape mirrors v2 exactly for Phase 0.
      // Note: auth.users rows can't be migrated — Supabase service-role doesn't
      // expose them across projects. The user re-creates accounts in v3 (via
      // signup or admin invite) using the same emails, then this script seeds
      // matching profiles rows on first migration run.
      const upsertResult = await v3
        .from('profiles')
        .upsert(rows, { onConflict: 'id' })
      if (upsertResult.error) throw new Error(`v3 profiles upsert: ${upsertResult.error.message}`)
      console.log(`  migrated ${rows.length.toString()} profile(s)`)
    },
  },
  // Phase 2 onwards adds steps here:
  // { name: 'customers', run: ... },
  // { name: 'products',  run: ... },
  // ...
]

async function main(): Promise<void> {
  const cfg = readEnv()
  const v2 = createClient(cfg.v2Url, cfg.v2Key, { auth: { persistSession: false } })
  const v3 = createClient(cfg.v3Url, cfg.v3Key, { auth: { persistSession: false } })

  console.log('SARAS v2 → v3 migration')
  console.log(`  source: ${cfg.v2Url}`)
  console.log(`  target: ${cfg.v3Url}`)
  console.log()

  for (const step of steps) {
    console.log(`▸ ${step.name}`)
    const t0 = Date.now()
    try {
      await step.run(v2, v3)
      console.log(`  ok in ${(Date.now() - t0).toString()}ms`)
    } catch (err) {
      console.error(`  FAILED:`, err instanceof Error ? err.message : String(err))
      process.exit(1)
    }
  }
  console.log()
  console.log('Migration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
