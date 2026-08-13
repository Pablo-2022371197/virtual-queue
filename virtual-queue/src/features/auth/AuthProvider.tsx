import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiLogin, apiLogout, apiMe, apiRefresh, apiRegister } from '../../shared/api/auth'
import { releaseStaffCounter } from '../../shared/api/staff'
import { clearTokens, hasRefreshToken } from '../../shared/api/tokenStore'
import { AuthContext, type AuthStatus } from './authContext'
import type { LoginRequest, RegisterRequest, UserRole } from '../../shared/types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasRefreshToken() ? 'loading' : 'anonymous',
  )
  const [user, setUser] = useState(() => null as import('../../shared/types/api').UserSummary | null)

  useEffect(() => {
    if (!hasRefreshToken()) return

    let active = true

    apiRefresh()
      .then((response) => {
        if (!active) return
        setUser(response.user)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return
        clearTokens()
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    // Release claimed counter while the access token is still valid.
    if (user?.role === 'STAFF') {
      try {
        await releaseStaffCounter()
      } catch {
        // Backend logout also clears the claim as a fallback.
      }
    }
    await apiLogout()
    queryClient.clear()
    setUser(null)
    setStatus('anonymous')
  }, [queryClient, user?.role])

  const refreshUser = useCallback(async () => {
    const me = await apiMe()
    setUser(me)
    setStatus('authenticated')
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user],
  )

  const value = useMemo(
    () => ({ status, user, login, register, logout, refreshUser, hasRole }),
    [status, user, login, register, logout, refreshUser, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
