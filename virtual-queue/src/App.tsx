import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './app/layout/Layout'
import { PublicLayout } from '@public/components/PublicLayout'
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import LandingPage from '@public/pages/LandingPage'
import AboutPage from '@public/pages/AboutPage'
import FaqPage from '@public/pages/FaqPage'
import ContactPage from '@public/pages/ContactPage'
import PrivacyPage from '@public/pages/PrivacyPage'
import TermsPage from '@public/pages/TermsPage'
import CookiesPage from '@public/pages/CookiesPage'
import HomePage from './app/HomePage'
import SearchPage from './app/SearchPage'
import PlaceQueuePage from './app/place/PlaceQueuePage'
import StatsPage from './app/StatsPage'

export default function App() {
  return (
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

      <Route element={<Layout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/place/:id/queue" element={<PlaceQueuePage />} />
        <Route path="/estadisticas" element={<StatsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
