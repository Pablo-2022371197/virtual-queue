import { useAuth } from '../features/auth/useAuth'
import AdminPlacesPage from '../features/admin/AdminPlacesPage'
import SearchPage from './SearchPage'
import { Navigate } from 'react-router-dom'

/** ADMIN → administración; STAFF → panel de personal; CUSTOMER → búsqueda. */
export default function EstablecimientosRoute() {
  const { hasRole } = useAuth()
  if (hasRole('ADMIN')) return <AdminPlacesPage />
  if (hasRole('STAFF')) return <Navigate to="/staff" replace />
  return <SearchPage />
}
