import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../shared/types/api'
import { useAuth } from './useAuth'
import { defaultAppRouteForUser } from './defaultAppRoute'

interface RoleRouteProps {
  roles: UserRole[]
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { user, hasRole } = useAuth()

  if (!user || !hasRole(...roles)) {
    return <Navigate to={defaultAppRouteForUser(hasRole)} replace />
  }

  return <Outlet />
}
