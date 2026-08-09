import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '@heroui/react'
import { PublicLayout } from '@public/components/PublicLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { RoleRoute } from './features/auth/RoleRoute'
import { Layout } from './app/layout/Layout'
import NotFoundPage from './shared/components/NotFoundPage'

const LoginPage = lazy(() => import('./auth/LoginPage'))
const RegisterPage = lazy(() => import('./auth/RegisterPage'))
const LandingPage = lazy(() => import('@public/pages/LandingPage'))
const AboutPage = lazy(() => import('@public/pages/AboutPage'))
const FaqPage = lazy(() => import('@public/pages/FaqPage'))
const ContactPage = lazy(() => import('@public/pages/ContactPage'))
const PrivacyPage = lazy(() => import('@public/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@public/pages/TermsPage'))
const CookiesPage = lazy(() => import('@public/pages/CookiesPage'))
const HomePage = lazy(() => import('./app/HomePage'))
const SearchPage = lazy(() => import('./app/SearchPage'))
const PlaceQueuePage = lazy(() => import('./app/place/PlaceQueuePage'))
const StatsPage = lazy(() => import('./app/StatsPage'))
const StaffQueuePage = lazy(() => import('./features/staff/StaffQueuePage'))
const AdminPlacesPage = lazy(() => import('./features/admin/AdminPlacesPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3">
      <Spinner size="sm" />
      <span className="text-sm text-muted">Cargando…</span>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/place/:id/queue" element={<PlaceQueuePage />} />
            <Route path="/estadisticas" element={<StatsPage />} />
            <Route path="/cuenta" element={<SettingsPage />} />

            <Route element={<RoleRoute roles={['STAFF', 'ADMIN']} />}>
              <Route path="/staff" element={<StaffQueuePage />} />
            </Route>

            <Route element={<RoleRoute roles={['ADMIN']} />}>
              <Route path="/admin/places" element={<AdminPlacesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
