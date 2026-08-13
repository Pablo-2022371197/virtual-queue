import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Place } from '../shared/types/api'

export const PLACE_FUSE_OPTIONS: IFuseOptions<Place> = {
  keys: ['name', 'address', 'category'],
  threshold: 0.4,
  minMatchCharLength: 2,
}

export function createPlaceFuse(places: Place[]): Fuse<Place> {
  return new Fuse(places, PLACE_FUSE_OPTIONS)
}

export function fuseSearchPlaces(
  fuse: Fuse<Place>,
  places: Place[],
  query: string,
): Place[] {
  if (!query || query.length < 2) {
    return places
  }

  return fuse.search(query).map((result) => result.item)
}
