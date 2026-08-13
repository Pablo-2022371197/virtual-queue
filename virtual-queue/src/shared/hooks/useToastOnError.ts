import { useEffect, useRef } from 'react'
import { ApiError } from '../api/client'
import { toast } from '@heroui/react'

function retryAction(onRetry?: () => void) {
  if (!onRetry) return undefined
  return {
    children: 'Reintentar',
    onPress: onRetry,
    variant: 'tertiary' as const,
  }
}

type UseToastOnErrorOptions = {
  title?: string
  fallback?: string
  onRetry?: () => void
}

export function useToastOnError(
  isError: boolean,
  error: unknown,
  options: UseToastOnErrorOptions = {},
) {
  const onRetryRef = useRef(options.onRetry)
  onRetryRef.current = options.onRetry

  useEffect(() => {
    if (!isError) return

    const description =
      error instanceof ApiError
        ? error.message
        : options.fallback ?? 'Verifica que el servidor esté en línea.'

    toast.warning(options.title ?? 'Error de conexión', {
      description,
      actionProps: retryAction(onRetryRef.current),
    })
  }, [isError, error, options.title, options.fallback])
}
