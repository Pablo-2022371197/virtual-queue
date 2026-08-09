import { Chip } from '@heroui/react'
import type { TicketStatus } from '../shared/types/api'

const STATUS_LABELS: Record<TicketStatus, string> = {
  WAITING: 'En espera',
  NEARLY: 'Próximo',
  CALLED: 'Llamado',
  SERVING: 'En atención',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Ausente',
}

const STATUS_COLORS: Record<TicketStatus, 'accent' | 'warning' | 'success' | 'danger' | 'default'> = {
  WAITING: 'accent',
  NEARLY: 'warning',
  CALLED: 'warning',
  SERVING: 'success',
  COMPLETED: 'default',
  CANCELLED: 'danger',
  EXPIRED: 'danger',
}

interface TicketStatusChipProps {
  status: TicketStatus
}

export function TicketStatusChip({ status }: TicketStatusChipProps) {
  return (
    <Chip size="sm" variant="soft" color={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Chip>
  )
}
