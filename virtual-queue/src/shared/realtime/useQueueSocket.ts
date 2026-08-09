import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/useAuth'
import { realtimeClient } from './stompClient'
import type { PlaceStats, Ticket, TicketEvent } from '../types/api'

export function useQueueSocket() {
  const { status } = useAuth()
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      realtimeClient.disconnect()
      return
    }

    realtimeClient.connect()
    const unsub = realtimeClient.onConnectionChange(setConnected)

    const unsubTicket = realtimeClient.onTicketEvent((event: TicketEvent) => {
      queryClient.setQueryData<Ticket | null>(['tickets', 'mine'], (current) => {
        if (!current || current.id !== event.ticket.id) return current
        return {
          ...current,
          number: event.ticket.number,
          position: event.ticket.position,
          estimatedMinutes: event.ticket.estimatedMinutes,
          status: event.ticket.status,
        }
      })
      queryClient.invalidateQueries({ queryKey: ['places'] })
    })

    return () => {
      unsub()
      unsubTicket()
      realtimeClient.disconnect()
    }
  }, [status, queryClient])

  return { connected }
}

export function usePlaceStatsSocket(placeId: string | undefined) {
  const queryClient = useQueryClient()
  const { status } = useAuth()

  useEffect(() => {
    if (!placeId || status !== 'authenticated') return

    realtimeClient.connect()

    const unsub = realtimeClient.subscribeStats(placeId, (stats: PlaceStats) => {
      queryClient.setQueryData(['places', placeId, 'stats'], stats)
    })

    return unsub
  }, [placeId, status, queryClient])
}
