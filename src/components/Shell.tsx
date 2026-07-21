import {
  BarChart3,
  Columns3,
  FileText,
  LayoutDashboard,
  Settings2,
  Table2,
  UserSquare2,
} from 'lucide-react'
import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../store/store'
import { TopBar } from './TopBar'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/my', label: 'My Projects', icon: UserSquare2 },
  { to: '/projects', label: 'All Projects', icon: Table2 },
  { to: '/board', label: 'Board', icon: Columns3 },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export function Shell({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.role)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-accent text-white shadow-card">
            <span className="font-mono text-xs font-bold">PT</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">ProjectTrack</div>
            <div className="text-2xs text-faint">billing &amp; delivery</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
          {role === 'Admin' && <NavItem to="/admin" label="Admin" icon={Settings2} />}
        </nav>

        <div className="px-5 py-3 text-2xs leading-relaxed text-faint">
          Demo data · stored in your browser. No backend.
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-accent-soft text-accent'
            : 'text-muted hover:bg-raised hover:text-ink'
        }`
      }
    >
      <Icon size={17} className="shrink-0" />
      {label}
    </NavLink>
  )
}
