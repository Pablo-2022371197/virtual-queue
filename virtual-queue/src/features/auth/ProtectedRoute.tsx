import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '@heroui/react'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm text-muted">Verificando sesión…</span>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
