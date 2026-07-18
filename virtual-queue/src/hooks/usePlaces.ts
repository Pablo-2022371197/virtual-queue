import { useQuery } from '@tanstack/react-query'
import client from '../lib/client'
import type { Place } from '../types'

export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: () => client<Place[]>('/api/places'),
  })
}
