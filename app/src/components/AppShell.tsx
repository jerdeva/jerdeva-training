import type { ReactNode } from 'react'
import './AppShell.css'

export type NavId = 'clients' | 'schedule' | 'payments'

type NavItem = {
  id: NavId
  label: string
  available: boolean
  icon: ReactNode
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  'aria-hidden': true,
} as const

const NAV_ITEMS: NavItem[] = [
  {
    id: 'clients',
    label: 'Клієнти',
    available: true,
    icon: (
      <svg {...iconProps}>
        <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
        <circle cx="10" cy="8" r="3" />
        <path d="M20 19v-1a3 3 0 0 0-2-2.8M16 5.2a3 3 0 0 1 0 5.6" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Розклад',
    available: false,
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
  {
    id: 'payments',
    label: 'Оплати',
    available: false,
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
]

function NavList({ active, variant }: { active: NavId; variant: 'side' | 'bottom' }) {
  return (
    <nav className={`nav nav--${variant}`} aria-label="Основна навігація">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="nav__item"
          disabled={!item.available}
          aria-current={item.id === active ? 'page' : undefined}
          title={item.available ? undefined : 'Розділ буде доступний пізніше'}
        >
          {item.icon}
          <span className="nav__label">{item.label}</span>
          {!item.available && <span className="nav__badge">Скоро</span>}
        </button>
      ))}
    </nav>
  )
}

export default function AppShell({ active, children }: { active: NavId; children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="brand">
          <span className="brand__mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />
            </svg>
          </span>
          <span className="brand__name">Кабінет тренера</span>
        </div>
        <NavList active={active} variant="side" />
      </aside>

      <main className="shell__main">{children}</main>

      <NavList active={active} variant="bottom" />
    </div>
  )
}