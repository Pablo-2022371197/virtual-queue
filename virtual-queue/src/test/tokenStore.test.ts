import { describe, expect, it } from 'vitest'
import { clearTokens, getAccessToken, setTokens, hasRefreshToken } from '../shared/api/tokenStore'

describe('tokenStore', () => {
  it('stores and clears tokens', () => {
    setTokens('access-123', 'refresh-456')
    expect(getAccessToken()).toBe('access-123')
    expect(hasRefreshToken()).toBe(true)
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(hasRefreshToken()).toBe(false)
  })
})
