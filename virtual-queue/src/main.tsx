import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppI18nProvider } from './shared/providers/HeroUIProvider'
import { AuthProvider } from './features/auth/AuthProvider'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { queryClient } from './lib/queryClient'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppI18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AppI18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)
