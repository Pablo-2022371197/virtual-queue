import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createPlaceFuse, fuseSearchPlaces } from '../lib/fuseSearchPlaces'
import { searchManagedPlaces, type PlaceSearchParams } from '../shared/api/places'

export type AdminPlaceFilters = Omit<PlaceSearchParams, 'query'>

export function useAdminPlaces(filters: AdminPlaceFilters = {}, query = '') {
  const placesQuery = useQuery({
    queryKey: ['places', 'manage', filters],
    queryFn: () => searchManagedPlaces({ ...filters, size: filters.size ?? 100 }),
  })

  const catalog = placesQuery.data?.content ?? []

  const fuse = useMemo(() => createPlaceFuse(catalog), [catalog])

  const places = useMemo(
    () => fuseSearchPlaces(fuse, catalog, query),
    [fuse, catalog, query],
  )

  return {
    ...placesQuery,
    catalog,
    places,
    catalogLoaded: !placesQuery.isLoading && !placesQuery.isError,
    catalogEmpty: catalog.length === 0,
  }
}
