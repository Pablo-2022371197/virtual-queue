import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Separator } from '@heroui/react'
import { Ticket, Building2, BarChart3, Menu, X, Users, UserCircle } from 'lucide-react'
import { Brand } from '@shared/brand/Brand'
import { appVersion } from '@lib/siteConfig'
import { UserMenu } from './UserMenu'
import { useAuth } from '../../features/auth/useAuth'

type NavItem = { to: string; label: string; Icon: typeof Ticket }

function SidebarVersion() {
  return (
    <p className="text-center text-xs text-muted">
      v{appVersion}
    </p>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { hasRole } = useAuth()
  const isStaff = hasRole('STAFF') && !hasRole('ADMIN')
  const isAdmin = hasRole('ADMIN')

  const links: NavItem[] = isStaff
    ? [
        { to: '/staff', label: 'Personal', Icon: Users },
        { to: '/estadisticas', label: 'Estadísticas', Icon: BarChart3 },
        { to: '/cuenta', label: 'Mi cuenta', Icon: UserCircle },
      ]
    : [
        { to: '/home', label: 'Mi turno', Icon: Ticket },
        {
          to: '/search',
          label: isAdmin ? 'Establecimientos' : 'Establecimientos',
          Icon: Building2,
        },
        { to: '/estadisticas', label: 'Estadísticas', Icon: BarChart3 },
        { to: '/cuenta', label: 'Mi cuenta', Icon: UserCircle },
        ...(isAdmin ? [{ to: '/staff', label: 'Personal', Icon: Users }] : []),
      ]

  const navLinks = (onClick?: () => void) =>
    links.map(({ to, label, Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-accent-soft text-accent-soft-foreground'
              : 'text-muted hover:bg-default hover:text-foreground'
          }`
        }
      >
        <Icon size={17} strokeWidth={1.75} />
        {label}
      </NavLink>
    ))

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-border bg-surface/95 backdrop-blur-md sm:flex">
        <div className="flex h-14 shrink-0 items-center px-5">
          <NavLink to={isStaff ? '/staff' : '/home'}>
            <Brand />
          </NavLink>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navLinks()}
        </nav>

        <Separator />

        <div className="shrink-0 px-3 py-3">
          <SidebarVersion />
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-surface/95 px-4 backdrop-blur-md sm:hidden">
        <NavLink to={isStaff ? '/staff' : '/home'} className="shrink-0">
          <Brand />
        </NavLink>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-default hover:text-foreground"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-20 sm:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-14 flex w-64 flex-col border-b border-r border-border bg-surface shadow-lg"
            style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {navLinks(() => setMobileOpen(false))}
            </nav>
            <Separator />
            <div className="shrink-0 px-3 py-3">
              <SidebarVersion />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
