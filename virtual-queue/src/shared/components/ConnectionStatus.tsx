import { Chip } from '@heroui/react'
import { Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusProps {
  connected: boolean
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={connected ? 'success' : 'warning'}
      className="gap-1"
    >
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      {connected ? 'En vivo' : 'Reconectando…'}
    </Chip>
  )
}
