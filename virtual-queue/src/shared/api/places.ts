import type {
  CreatePlaceRequest,
  Page,
  Place,
  PlaceStats,
  Queue,
  UpdatePlaceRequest,
} from '../types/api'
import client from './client'

export interface PlaceSearchParams {
  query?: string
  category?: string
  active?: boolean
  page?: number
  size?: number
}

function buildQuery(params: PlaceSearchParams): string {
  const search = new URLSearchParams()
  if (params.query) search.set('query', params.query)
  if (params.category) search.set('category', params.category)
  if (params.active !== undefined) search.set('active', String(params.active))
  if (params.page !== undefined) search.set('page', String(params.page))
  if (params.size !== undefined) search.set('size', String(params.size))
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export async function searchPlaces(params: PlaceSearchParams = {}): Promise<Page<Place>> {
  return client<Page<Place>>(`/api/places${buildQuery(params)}`)
}

export async function searchManagedPlaces(params: PlaceSearchParams = {}): Promise<Page<Place>> {
  return client<Page<Place>>(`/api/places/manage${buildQuery(params)}`)
}

export async function getPlace(placeId: string): Promise<Place> {
  return client<Place>(`/api/places/${placeId}`)
}

export async function getPlaceQueue(placeId: string): Promise<Queue> {
  return client<Queue>(`/api/places/${placeId}/queue`)
}

export async function getPlaceStats(placeId: string): Promise<PlaceStats> {
  return client<PlaceStats>(`/api/places/${placeId}/stats`)
}

/** Places the current user may view stats for (history / staff assignment / all for admin). */
export async function getExperiencedPlaces(): Promise<Place[]> {
  return client<Place[]>('/api/places/experienced')
}

export async function createPlace(data: CreatePlaceRequest): Promise<Place> {
  return client<Place>('/api/places', { method: 'POST', body: data })
}

export async function updatePlace(placeId: string, data: UpdatePlaceRequest): Promise<Place> {
  return client<Place>(`/api/places/${placeId}`, { method: 'PUT', body: data })
}

export async function updatePlaceStatus(placeId: string, active: boolean): Promise<Place> {
  return client<Place>(`/api/places/${placeId}/status`, {
    method: 'PATCH',
    body: { active },
  })
}

export interface StaffRegistrationKeyResponse {
  placeId: string
  placeName: string
  staffRegistrationKey: string
}

export async function rotateStaffRegistrationKey(
  placeId: string,
): Promise<StaffRegistrationKeyResponse> {
  return client<StaffRegistrationKeyResponse>(
    `/api/places/${placeId}/staff-registration-key/rotate`,
    { method: 'POST' },
  )
}
