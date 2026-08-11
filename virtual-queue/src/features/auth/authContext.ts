import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UserRole, UserSummary } from '../../shared/types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: UserSummary | null
  login: (data: LoginRequest) => Promise<UserSummary>
  register: (data: RegisterRequest) => Promise<UserSummary>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
