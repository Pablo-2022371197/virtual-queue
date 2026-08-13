import { describe, expect, it } from 'vitest'
import type { Place } from '../shared/types/api'
import { createPlaceFuse, fuseSearchPlaces } from '../lib/fuseSearchPlaces'

const samplePlaces: Place[] = [
  {
    id: '1',
    name: 'Farmacia Central',
    address: 'Av. Principal 100',
    category: 'Salud',
    active: true,
  },
  {
    id: '2',
    name: 'Banco del Pueblo',
    address: 'Calle Juárez 45',
    category: 'Finanzas',
    active: true,
  },
  {
    id: '3',
    name: 'Cafetería Norte',
    address: 'Blvd. Reforma 12',
    category: 'Alimentos',
    active: true,
  },
]

describe('fuseSearchPlaces', () => {
  const fuse = createPlaceFuse(samplePlaces)

  it('returns the full catalog when query is shorter than 2 characters', () => {
    expect(fuseSearchPlaces(fuse, samplePlaces, '')).toEqual(samplePlaces)
    expect(fuseSearchPlaces(fuse, samplePlaces, 'f')).toEqual(samplePlaces)
  })

  it('matches by name', () => {
    const results = fuseSearchPlaces(fuse, samplePlaces, 'farmacia')
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Farmacia Central')
  })

  it('matches by address', () => {
    const results = fuseSearchPlaces(fuse, samplePlaces, 'juarez')
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Banco del Pueblo')
  })

  it('matches by category', () => {
    const results = fuseSearchPlaces(fuse, samplePlaces, 'alimentos')
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Cafetería Norte')
  })

  it('tolerates close typos with fuzzy matching', () => {
    const results = fuseSearchPlaces(fuse, samplePlaces, 'farmcia')
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Farmacia Central')
  })

  it('returns an empty array when nothing matches', () => {
    const results = fuseSearchPlaces(fuse, samplePlaces, 'zzzznotfound')
    expect(results).toEqual([])
  })
})
