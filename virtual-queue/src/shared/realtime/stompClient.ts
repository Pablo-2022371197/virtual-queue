import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getAccessToken } from '../api/tokenStore'
import type { PlaceStats, TicketEvent } from '../types/api'

const wsUrl = import.meta.env.VITE_WS_URL ?? '/ws'

type ConnectionListener = (connected: boolean) => void
type TicketListener = (event: TicketEvent) => void
type StatsListener = (stats: PlaceStats) => void

class RealtimeClient {
  private client: Client | null = null
  private connectionListeners = new Set<ConnectionListener>()
  private ticketListeners = new Set<TicketListener>()
  private statsListeners = new Map<string, Set<StatsListener>>()
  private statsSubscriptions = new Map<string, { unsubscribe: () => void }>()
  private seenEventIds = new Set<string>()
  private ticketSubscribed = false

  connect(): void {
    if (this.client?.active) return

    const token = getAccessToken()
    if (!token) return

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.notifyConnection(true)
        this.subscribeTicket()
        this.resubscribeStats()
      },
      onDisconnect: () => this.notifyConnection(false),
      onStompError: () => this.notifyConnection(false),
      onWebSocketClose: () => this.notifyConnection(false),
    })

    this.client.activate()
  }

  disconnect(): void {
    this.statsSubscriptions.forEach((sub) => sub.unsubscribe())
    this.statsSubscriptions.clear()
    this.statsListeners.clear()
    this.ticketSubscribed = false
    this.client?.deactivate()
    this.client = null
    this.notifyConnection(false)
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener)
    return () => this.connectionListeners.delete(listener)
  }

  onTicketEvent(listener: TicketListener): () => void {
    this.ticketListeners.add(listener)
    return () => this.ticketListeners.delete(listener)
  }

  subscribeStats(placeId: string, listener: StatsListener): () => void {
    if (!this.statsListeners.has(placeId)) {
      this.statsListeners.set(placeId, new Set())
    }
    this.statsListeners.get(placeId)!.add(listener)

    if (!this.statsSubscriptions.has(placeId) && this.client?.connected) {
      const sub = this.client.subscribe(`/topic/stats/${placeId}`, (message) => {
        const stats = JSON.parse(message.body) as PlaceStats
        this.statsListeners.get(placeId)?.forEach((l) => l(stats))
      })
      this.statsSubscriptions.set(placeId, { unsubscribe: () => sub.unsubscribe() })
    }

    return () => {
      this.statsListeners.get(placeId)?.delete(listener)
      if (this.statsListeners.get(placeId)?.size === 0) {
        this.statsListeners.delete(placeId)
        const existing = this.statsSubscriptions.get(placeId)
        if (existing) {
          existing.unsubscribe()
          this.statsSubscriptions.delete(placeId)
        }
      }
    }
  }

  private subscribeTicket(): void {
    if (!this.client?.connected || this.ticketSubscribed) return

    this.client.subscribe('/user/queue/ticket', (message) => {
      const event = JSON.parse(message.body) as TicketEvent
      if (this.seenEventIds.has(event.eventId)) return
      this.seenEventIds.add(event.eventId)
      if (this.seenEventIds.size > 200) {
        const first = this.seenEventIds.values().next().value
        if (first) this.seenEventIds.delete(first)
      }
      this.ticketListeners.forEach((l) => l(event))
    })
    this.ticketSubscribed = true
  }

  private resubscribeStats(): void {
    for (const placeId of this.statsListeners.keys()) {
      if (!this.statsSubscriptions.has(placeId) && this.client?.connected) {
        const sub = this.client.subscribe(`/topic/stats/${placeId}`, (message) => {
          const stats = JSON.parse(message.body) as PlaceStats
          this.statsListeners.get(placeId)?.forEach((l) => l(stats))
        })
        this.statsSubscriptions.set(placeId, { unsubscribe: () => sub.unsubscribe() })
      }
    }
  }

  private notifyConnection(connected: boolean): void {
    this.connectionListeners.forEach((l) => l(connected))
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const realtimeClient = new RealtimeClient()
