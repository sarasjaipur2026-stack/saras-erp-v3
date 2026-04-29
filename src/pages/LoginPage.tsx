import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage(): JSX.Element {
  const { user, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (loading) return <div className="min-h-full grid place-items-center">Loading…</div>
  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="min-h-full grid place-items-center p-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border)] rounded-2xl p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold text-[color:var(--color-text)] mb-1">SARAS ERP v3</h1>
        <p className="text-xs text-[color:var(--color-text-muted)] mb-5">
          Sign in to continue. v3 has its own login — passwords reset on first use.
        </p>
        <label className="block mb-3">
          <span className="text-xs font-semibold text-[color:var(--color-text-muted)]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-[color:var(--color-border)] focus-ring"
          />
        </label>
        <label className="block mb-4">
          <span className="text-xs font-semibold text-[color:var(--color-text-muted)]">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-[color:var(--color-border)] focus-ring"
          />
        </label>
        {err && (
          <div className="mb-3 text-xs text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 text-sm font-bold rounded-lg bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-hover)] text-[color:var(--color-text-on-accent)] disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
