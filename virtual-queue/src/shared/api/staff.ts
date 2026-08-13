import type {
  CounterClaimState,
  Place,
  Ticket,
  TicketStatus,
} from '../types/api'
import client from './client'

export async function getStaffPlace(): Promise<Place> {
  return client<Place>('/api/staff/place')
}

export async function getStaffCounters(): Promise<CounterClaimState> {
  return client<CounterClaimState>('/api/staff/counters')
}

export async function claimStaffCounter(
  counterNumber: number,
): Promise<CounterClaimState> {
  return client<CounterClaimState>('/api/staff/counters/claim', {
    method: 'POST',
    body: { counterNumber },
  })
}

export async function releaseStaffCounter(): Promise<void> {
  return client<void>('/api/staff/counters/claim', { method: 'DELETE' })
}

export async function listQueueTickets(
  queueId: string,
  status: TicketStatus = 'WAITING',
): Promise<Ticket[]> {
  return client<Ticket[]>(`/api/staff/queues/${queueId}/tickets?status=${status}`)
}

export async function getLastDismissedTicket(
  queueId: string,
): Promise<Ticket | null> {
  return client<Ticket | null>(`/api/staff/queues/${queueId}/last-dismissed`)
}

export async function getStaffActiveTicket(queueId: string): Promise<Ticket | null> {
  return client<Ticket | null>(`/api/staff/queues/${queueId}/active-ticket`)
}

export async function callNextTicket(queueId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/queues/${queueId}/call-next`, { method: 'POST' })
}

export async function acceptTicket(ticketId: string): Promise<Ticket> {
  return client<Ticket>(`/api/staff/tickets/${ticketId}/accept`, {
    method: 'POST',
    body: {},
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
