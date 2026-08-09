export { AuthProvider } from '../features/auth/AuthProvider'
export { useAuth } from '../features/auth/useAuth'
export { apiLogout as logout } from '../shared/api/auth'
export { getAccessToken as getToken } from '../shared/api/tokenStore'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function isAuthenticated(): boolean {
  return false
}

export function getCurrentUser(): string | null {
  return null
}
