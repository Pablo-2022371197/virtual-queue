import { useQuery } from '@tanstack/react-query'
import { searchPlaces, type PlaceSearchParams } from '../shared/api/places'

export function usePlaces(params: PlaceSearchParams = {}) {
  return useQuery({
    queryKey: ['places', params],
    queryFn: () => searchPlaces(params),
  })
}
