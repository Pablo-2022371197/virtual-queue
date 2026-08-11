import { useQuery } from '@tanstack/react-query'
import { getPlace, getPlaceQueue, getPlaceStats } from '../shared/api/places'

export function usePlace(placeId: string | undefined) {
  return useQuery({
    queryKey: ['places', placeId],
    queryFn: () => getPlace(placeId!),
    enabled: !!placeId,
  })
}

export function usePlaceQueue(placeId: string | undefined) {
  return useQuery({
    queryKey: ['places', placeId, 'queue'],
    queryFn: () => getPlaceQueue(placeId!),
    enabled: !!placeId,
  })
}

export function usePlaceStats(
  placeId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['places', placeId, 'stats'],
    queryFn: () => getPlaceStats(placeId!),
    enabled: !!placeId && (options?.enabled ?? true),
    refetchInterval: 30_000,
  })
}
