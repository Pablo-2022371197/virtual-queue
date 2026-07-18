import { useEffect } from 'react'

interface TurnCalledMessage {
  type: 'TURN_CALLED'
  payload: unknown
}

interface DashboardStatsProps {
  placeId: string | undefined
  onTurnCalled?: (payload: unknown) => void
}

export default function DashboardStats({
  placeId,
  onTurnCalled,
}: DashboardStatsProps) {
  useEffect(() => {
    function handleMessage(event: MessageEvent<TurnCalledMessage>) {
      if (event.data?.type === 'TURN_CALLED') {
        onTurnCalled?.(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onTurnCalled])

  return (
    <iframe
      src={`/flutter/?placeId=${placeId}`}
      width="100%"
      height="140"
      style={{ border: 'none' }}
      title="Estadísticas del establecimiento"
    />
  )
}
