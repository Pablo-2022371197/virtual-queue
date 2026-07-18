import { Navigate, Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { UserMenu } from './UserMenu'
import { isAuthenticated } from '../../lib/auth'
import { siteConfig } from '../../lib/siteConfig'

export function Layout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <AppSidebar />

      <header className="fixed top-0 right-0 left-0 z-30 hidden h-14 items-center justify-end border-b border-border/60 bg-surface/95 px-6 backdrop-blur-md sm:left-56 sm:flex sm:px-8 lg:px-10">
        <UserMenu />
      </header>

      <div className="flex min-h-screen flex-col pt-14 sm:ml-56">
        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>

        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted sm:px-8">
          © {new Date().getFullYear()} {siteConfig.name} · Todos los derechos reservados
        </footer>
      </div>
    </div>
  )
}
