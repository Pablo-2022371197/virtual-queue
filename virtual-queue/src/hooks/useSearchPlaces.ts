import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPlaces } from '../shared/api/places'
import { createPlaceFuse, fuseSearchPlaces } from '../lib/fuseSearchPlaces'

export function useSearchPlaces() {
  const [query, setQuery] = useState('')

  const placesQuery = useQuery({
    queryKey: ['places', 'catalog'],
    queryFn: () => searchPlaces({ size: 100 }),
  })

  const catalog = placesQuery.data?.content ?? []

  const fuse = useMemo(() => createPlaceFuse(catalog), [catalog])

  const results = useMemo(
    () => fuseSearchPlaces(fuse, catalog, query),
    [fuse, catalog, query],
  )

  return {
    ...placesQuery,
    query,
    setQuery,
    results,
    catalogLoaded: !placesQuery.isLoading && !placesQuery.isError,
    catalogEmpty: catalog.length === 0,
  }
}
