import type { UserRole } from '../../shared/types/api'

export function defaultAppRoute(role?: UserRole | string): string {
  if (role === 'STAFF') return '/staff'
  if (role === 'ADMIN') return '/search'
  return '/home'
}

export function defaultAppRouteForUser(
  hasRole: (role: UserRole) => boolean,
): string {
  if (hasRole('STAFF') && !hasRole('ADMIN')) return '/staff'
  if (hasRole('ADMIN')) return '/search'
  return '/home'
}
