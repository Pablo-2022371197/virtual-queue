import type { Place, Ticket, TicketStatus, UpdateQueueSettingsRequest } from '../types/api'
import client from './client'

export async function getStaffPlace(): Promise<Place> {
  return client<Place>('/api/staff/place')
}

export async function listQueueTickets(
  queueId: string,
  status: TicketStatus = 'WAITING',
): Promise<Ticket[]> {
  return client<Ticket[]>(`/api/staff/queues/${queueId}/tickets?status=${status}`)
}

export async function callNextTicket(queueId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/queues/${queueId}/call-next`, { method: 'POST' })
}

export async function acceptTicket(
  ticketId: string,
  counterNumber?: number,
): Promise<Ticket> {
  return client<Ticket>(`/api/staff/tickets/${ticketId}/accept`, {
    method: 'POST',
    body: counterNumber != null ? { counterNumber } : {},
  })
}

export async function startTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/tickets/${ticketId}/start`, { method: 'POST' })
}

export async function completeTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/tickets/${ticketId}/complete`, { method: 'POST' })
}

export async function expireTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/tickets/${ticketId}/expire`, { method: 'POST' })
}

export async function updateQueueSettings(
  queueId: string,
  data: UpdateQueueSettingsRequest,
): Promise<void> {
  return client<void>(`/api/staff/queues/${queueId}`, { method: 'PATCH', body: data })
}
