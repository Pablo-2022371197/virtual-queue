import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '../shared/errors/problemDetail'

describe('getErrorMessage', () => {
  it('returns mapped message for known error codes', () => {
    expect(getErrorMessage({ code: 'ACTIVE_TICKET_EXISTS' })).toContain('turno activo')
    expect(getErrorMessage({ code: 'QUEUE_ALREADY_JOINED' })).toContain('este establecimiento')
  })

  it('falls back to detail', () => {
    expect(getErrorMessage({ detail: 'Custom error' })).toBe('Custom error')
  })
})
