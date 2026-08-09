import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyTicket, takeTicket, cancelTicket } from '../shared/api/tickets'

export function useMyTicket() {
  return useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: getMyTicket,
  })
}

export function useTakeTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (placeId: string) => takeTicket(placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['places'] })
    },
  })
}

export function useCancelTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => cancelTicket(ticketId),
    onSuccess: () => {
      queryClient.setQueryData(['tickets', 'mine'], null)
      queryClient.invalidateQueries({ queryKey: ['places'] })
    },
  })
}
