const REFRESH_KEY = 'vq_refresh'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_KEY, token)
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access
  sessionStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  accessToken = null
  sessionStorage.removeItem(REFRESH_KEY)
}

export function hasRefreshToken(): boolean {
  return sessionStorage.getItem(REFRESH_KEY) !== null
}
