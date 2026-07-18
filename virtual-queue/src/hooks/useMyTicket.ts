import { useQuery } from '@tanstack/react-query'
import client from '../lib/client'
import type { Ticket } from '../types'

export function useMyTicket() {
  return useQuery({
    queryKey: ['my-ticket'],
    queryFn: () => client<Ticket>('/api/tickets/mine'),
  })
}
