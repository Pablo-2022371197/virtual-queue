import { useMemo, useState } from 'react'
import { usePlaces } from './usePlaces'
import { searchPlaces } from '../lib/searchPlaces'

export function useSearchPlaces() {
  const placesQuery = usePlaces()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!placesQuery.data) {
      return []
    }
    return searchPlaces(placesQuery.data, query)
  }, [placesQuery.data, query])

  return {
    ...placesQuery,
    query,
    setQuery,
    results,
  }
}
