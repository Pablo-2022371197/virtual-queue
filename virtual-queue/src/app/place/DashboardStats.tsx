import { useEffect, useRef, useState } from 'react'
import { toastWarning } from '../../shared/toast/appToast'

interface TurnCalledMessage {
  type: 'TURN_CALLED'
  payload: unknown
}

interface DashboardStatsProps {
  placeId: string | undefined
  onTurnCalled?: (payload: unknown) => void
}

const ALLOWED_ORIGIN = window.location.origin

export default function DashboardStats({
  placeId,
  onTurnCalled,
}: DashboardStatsProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [widgetAvailable, setWidgetAvailable] = useState(true)
  const [widgetChecked, setWidgetChecked] = useState(false)
  const warnedRef = useRef(false)

  useEffect(() => {
    if (!placeId) return

    fetch(`/flutter/?placeId=${encodeURIComponent(placeId)}`, { method: 'HEAD' })
      .then((res) => setWidgetAvailable(res.ok))
      .catch(() => setWidgetAvailable(false))
      .finally(() => setWidgetChecked(true))
  }, [placeId])

  useEffect(() => {
    if (!widgetChecked || widgetAvailable || warnedRef.current) return
    warnedRef.current = true
    toastWarning(
      'Widget de estadísticas no disponible',
      'Los datos se muestran en el panel superior.',
    )
  }, [widgetChecked, widgetAvailable])

  useEffect(() => {
    function handleMessage(event: MessageEvent<TurnCalledMessage>) {
      if (event.origin !== ALLOWED_ORIGIN) return
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) return
      if (event.data?.type === 'TURN_CALLED') {
        onTurnCalled?.(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onTurnCalled])

  if (!placeId) return null

  if (widgetChecked && !widgetAvailable) {
    return null
  }

  return (
    <iframe
      ref={iframeRef}
      src={`/flutter/?placeId=${encodeURIComponent(placeId)}`}
      width="100%"
      height="140"
      style={{ border: 'none' }}
      title="Estadísticas del establecimiento"
    />
  )
}
