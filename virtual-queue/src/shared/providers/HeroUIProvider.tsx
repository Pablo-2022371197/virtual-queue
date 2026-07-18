import type { ReactNode } from 'react'
import { I18nProvider } from '@heroui/react/rac'

interface AppI18nProviderProps {
  children: ReactNode
}

/** HeroUI v3 no requiere provider global; solo I18nProvider para locale es-MX. */
export function AppI18nProvider({ children }: AppI18nProviderProps) {
  return <I18nProvider locale="es-MX">{children}</I18nProvider>
}
