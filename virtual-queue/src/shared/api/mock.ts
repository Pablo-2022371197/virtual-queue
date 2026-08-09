import type {
  AuthResponse,
  Page,
  Place,
  PlaceStats,
  Queue,
  Ticket,
  UserSummary,
} from '../types/api'

const MOCK_USER: UserSummary = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'demo',
  fullName: 'Usuario Demo',
  role: 'CUSTOMER',
}

const MOCK_PLACES: Place[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Farmacia Central',
    address: 'Av. Principal 123',
    category: 'Salud',
    description: 'Farmacia con servicio de fila virtual.',
    active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Banco del Pueblo',
    address: 'Calle Reforma 456',
    category: 'Finanzas',
    description: 'Atención bancaria con turnos digitales.',
    active: true,
  },
]

let mockTicket: Ticket | null = null
const mockAccessToken = 'mock-access-token'
const mockRefreshToken = 'mock-refresh-token'

function authResponse(user: UserSummary = MOCK_USER): AuthResponse {
  return {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user,
  }
}

function page<T>(content: T[]): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
  }
}

export async function mockRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  await new Promise((r) => setTimeout(r, 200))

  const method = options.method ?? 'GET'
  const body = options.body as Record<string, unknown> | undefined

  if (url === '/api/auth/register' && method === 'POST') {
    return authResponse({
      ...MOCK_USER,
      username: String(body?.username ?? 'demo'),
      fullName: String(body?.fullName ?? 'Usuario Demo'),
    }) as T
  }

  if (url === '/api/auth/login' && method === 'POST') {
    return authResponse() as T
  }

  if (url === '/api/auth/refresh' && method === 'POST') {
    return authResponse() as T
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    return null as T
  }

  if (url === '/api/auth/me') {
    return MOCK_USER as T
  }

  if (url.startsWith('/api/places') && method === 'GET' && !url.includes('/queue') && !url.includes('/stats')) {
    if (url === '/api/places' || url.startsWith('/api/places?')) {
      return page(MOCK_PLACES) as T
    }
    const placeId = url.split('/api/places/')[1]
    const place = MOCK_PLACES.find((p) => p.id === placeId)
    if (!place) throw new Error('Not found')
    return place as T
  }

  if (url.includes('/queue')) {
    const placeId = url.split('/api/places/')[1]?.split('/')[0]
    return {
      id: '20000000-0000-0000-0000-000000000001',
      placeId,
      prefix: 'A',
      averageServiceMinutes: 8,
      openCounters: 2,
      active: true,
    } satisfies Queue as T
  }

  if (url.includes('/stats')) {
    const placeId = url.split('/api/places/')[1]?.split('/')[0]
    return {
      placeId,
      activeTickets: 12,
      averageWaitMinutes: 15,
      openCounters: 2,
      turnCalled: 'A-042',
    } satisfies PlaceStats as T
  }

  if (url === '/api/tickets/mine') {
    return mockTicket as T
  }

  if (url.match(/\/api\/places\/[^/]+\/tickets/) && method === 'POST') {
    const placeId = url.split('/api/places/')[1]?.split('/')[0] ?? ''
    const place = MOCK_PLACES.find((p) => p.id === placeId)
    mockTicket = {
      id: '30000000-0000-0000-0000-000000000001',
      placeId,
      placeName: place?.name ?? 'Establecimiento',
      number: 'A-048',
      position: 5,
      estimatedMinutes: 20,
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
    }
    return mockTicket as T
  }

  if (url.match(/\/api\/tickets\/[^/]+$/) && method === 'DELETE') {
    const cancelled = mockTicket
    mockTicket = null
    return { ...cancelled!, status: 'CANCELLED' } as T
  }

  throw new Error(`Mock not implemented: ${method} ${url}`)
}
