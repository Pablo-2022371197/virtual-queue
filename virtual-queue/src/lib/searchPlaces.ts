import Fuse from 'fuse.js'
import type { Place } from '../types'

export function searchPlaces(places: Place[], query: string): Place[] {
  if (!query || query.length < 2) {
    return places
  }

  const fuse = new Fuse(places, {
    keys: ['name', 'address', 'category'],
    threshold: 0.4,
    minMatchCharLength: 2,
  })

  return fuse.search(query).map((result) => result.item)
}
