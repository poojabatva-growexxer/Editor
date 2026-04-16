import { useTheme } from '../../context/ThemeContext.jsx'
import { Button } from '../ui/Button.jsx'

const STATUS_META = {
  saving: {
    label: 'Saving...',
    className: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-950/60 dark:border-amber-900',
  },
  saved: {
    label: 'Saved',
    className: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900',
  },
  error: {
    label: 'Save failed',
    className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950/60 dark:border-red-900',
  },
}

export function Navbar({ saveStatus }) {
  const { dark, toggle } = useTheme()
  const status = saveStatus ? STATUS_META[saveStatus] : null

  return (
    <div className="flex items-center gap-2">
      {status && (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
          {status.label}
        </span>
      )}

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
        {dark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </Button>
    </div>
  )
}
