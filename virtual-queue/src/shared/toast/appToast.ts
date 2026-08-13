import { toast } from '@heroui/react'
import { ApiError } from '../api/client'

function retryAction(onRetry?: () => void) {
  if (!onRetry) return undefined
  return {
    children: 'Reintentar',
    onPress: onRetry,
    variant: 'tertiary' as const,
  }
}

export function toastError(
  message: string,
  options?: { description?: string; onRetry?: () => void },
) {
  toast.danger(message, {
    description: options?.description,
    actionProps: retryAction(options?.onRetry),
  })
}

export function toastConnectionError(
  description = 'Verifica que el servidor esté en línea.',
  onRetry?: () => void,
) {
  toast.warning('Error de conexión', {
    description,
    actionProps: retryAction(onRetry),
  })
}

export function toastFromError(err: unknown, fallback: string, onRetry?: () => void) {
  const message = err instanceof ApiError ? err.message : fallback
  toastError(message, { onRetry })
}

export function toastWarning(message: string, description?: string) {
  toast.warning(message, { description })
}

export function toastSuccess(message: string, description?: string) {
  toast.success(message, { description })
}
