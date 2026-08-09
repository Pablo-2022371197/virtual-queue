import type { Ticket } from '../types/api'
import client from './client'

export async function takeTicket(placeId: string): Promise<Ticket> {
  return client<Ticket>(`/api/places/${placeId}/tickets`, { method: 'POST' })
}

export async function getMyTicket(): Promise<Ticket | null> {
  return client<Ticket | null>('/api/tickets/mine')
}

export async function getTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/tickets/${ticketId}`)
}

export async function cancelTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/tickets/${ticketId}`, { method: 'DELETE' })
}
