import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserSummary,
} from '../types/api'
import client from './client'
import { clearTokens, getRefreshToken, setTokens } from './tokenStore'

export async function apiRegister(data: RegisterRequest): Promise<AuthResponse> {
  const response = await client<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
  })
  setTokens(response.accessToken, response.refreshToken)
  return response
}

export async function apiLogin(data: LoginRequest): Promise<AuthResponse> {
  const response = await client<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
  })
  setTokens(response.accessToken, response.refreshToken)
  return response
}

export async function apiRefresh(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  const response = await client<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  })
  setTokens(response.accessToken, response.refreshToken)
  return response
}

export async function apiLogout(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await client('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      })
    } catch {
      // ignore logout errors
    }
  }
  clearTokens()
}

export async function apiMe(): Promise<UserSummary> {
  return client<UserSummary>('/api/auth/me')
}

export async function apiPatchProfile(data: UpdateProfileRequest): Promise<UserSummary> {
  return client<UserSummary>('/api/auth/me', {
    method: 'PATCH',
    body: data,
  })
}

export async function apiChangePassword(data: ChangePasswordRequest): Promise<void> {
  await client<void>('/api/auth/password', {
    method: 'PUT',
    body: data,
  })
}
