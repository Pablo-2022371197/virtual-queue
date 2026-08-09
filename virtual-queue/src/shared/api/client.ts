import { getErrorMessage, parseProblemDetail } from '../errors/problemDetail'
import type { AuthResponse } from '../types/api'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStore'

const baseURL = import.meta.env.VITE_API_URL ?? ''
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data = (await response.json()) as AuthResponse
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

type ClientOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function client<T = unknown>(
  url: string,
  options: ClientOptions = {},
  retried = false,
): Promise<T> {
  if (useMock) {
    const { mockRequest } = await import('./mock')
    return mockRequest<T>(url, options)
  }

  const headers: Record<string, string> = {
  ...(options.headers as Record<string, string> | undefined),
  }

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const requestUrl = url.startsWith('http') ? url : `${baseURL}${url}`

  const response = await fetch(requestUrl, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401 && !retried && !url.includes('/api/auth/')) {
    const refreshed = await tryRefreshSession()
    if (refreshed) {
      return client<T>(url, options, true)
    }
    clearTokens()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new ApiError('Sesión expirada', 401)
  }

  if (!response.ok) {
    const problem = await parseProblemDetail(response)
    throw new ApiError(getErrorMessage(problem), response.status, problem.code)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export default client
