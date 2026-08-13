import type { ReactNode } from 'react'
import { Toast } from '@heroui/react'
import { I18nProvider } from '@heroui/react/rac'

interface AppI18nProviderProps {
  children: ReactNode
}

/** I18nProvider + Toast global para avisos de error/conexión. */
export function AppI18nProvider({ children }: AppI18nProviderProps) {
  return (
    <I18nProvider locale="es-MX">
      {children}
      <Toast.Provider placement="bottom end" />
    </I18nProvider>
  )
}
