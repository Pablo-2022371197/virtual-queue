import { useState } from 'react'
import { usePlaces } from './usePlaces'

export function useSearchPlaces() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | undefined>()

  const placesQuery = usePlaces({
    query: query.length >= 2 ? query : undefined,
    category,
    size: 20,
  })

  const results = placesQuery.data?.content ?? []

  return {
    ...placesQuery,
    query,
    setQuery,
    category,
    setCategory,
    results,
  }
}
