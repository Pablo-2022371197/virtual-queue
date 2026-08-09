export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export type TicketStatus =
  | 'WAITING'
  | 'NEARLY'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface UserSummary {
  id: string
  username: string
  fullName: string
  role: UserRole
  placeId?: string | null
  placeName?: string | null
}

export interface UpdateProfileRequest {
  fullName: string
  username: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserSummary
}

export interface RegisterRequest {
  fullName: string
  email: string
  username: string
  password: string
  role?: 'CUSTOMER' | 'STAFF'
  staffRegistrationKey?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface Place {
  id: string
  name: string
  address: string
  category: string
  description?: string
  active: boolean
  createdAt?: string
}

export interface Queue {
  id: string
  placeId: string
  prefix: string
  averageServiceMinutes: number
  openCounters: number
  active: boolean
}

export interface PlaceStats {
  placeId: string
  activeTickets: number
  averageWaitMinutes: number
  openCounters: number
  turnCalled: string | null
}

export interface Ticket {
  id: string
  placeId: string
  placeName: string
  number: string
  position: number
  estimatedMinutes: number
  status: TicketStatus
  issuedAt: string
  counterNumber?: number | null
}

export interface TicketEvent {
  eventId: string
  type: string
  occurredAt: string
  ticket: {
    id: string
    placeId: string
    number: string
    position: number
    estimatedMinutes: number
    status: TicketStatus
    counterNumber?: number | null
  }
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface CreatePlaceRequest {
  name: string
  address?: string
  category?: string
  description?: string
}

export interface UpdatePlaceRequest {
  name: string
  address?: string
  category?: string
  description?: string
}

export interface UpdateQueueSettingsRequest {
  averageServiceMinutes?: number
  openCounters?: number
}

export interface RegisterDeviceRequest {
  fcmToken: string
  platform: 'ANDROID' | 'WEB'
  deviceName?: string
}

export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
}
