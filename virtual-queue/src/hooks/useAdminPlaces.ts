import { useQuery } from '@tanstack/react-query'
import { searchManagedPlaces, type PlaceSearchParams } from '../shared/api/places'

export function useAdminPlaces(params: PlaceSearchParams = {}) {
  return useQuery({
    queryKey: ['places', 'manage', params],
    queryFn: () => searchManagedPlaces(params),
  })
}
