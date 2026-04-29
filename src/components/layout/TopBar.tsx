import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SwitchToV2Pill } from './SwitchToV2Pill'

export function TopBar(): JSX.Element {
  const { user, profile, signOut } = useAuth()
  return (
    <header className="h-14 px-3 flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] shrink-0">
      <div className="flex items-center gap-3">
        <Link to="/" className="font-bold text-[color:var(--color-accent)] text-base">
          SARAS v3
        </Link>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]">
          BETA
        </span>
      </div>
      <div className="flex items-center gap-2">
        <SwitchToV2Pill />
        {profile && (
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {profile.full_name ?? user?.email}
          </span>
        )}
        {user && (
          <button
            onClick={() => void signOut()}
            className="text-xs px-2 py-1 rounded text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-sunken)]"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
