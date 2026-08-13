import { Link, Navigate } from 'react-router-dom'
import { Alert, Button, Card, Chip, Separator, Spinner } from '@heroui/react'
import { CalendarClock, Clock, MapPin, Ticket } from 'lucide-react'
import { useState } from 'react'
import { useMyTicket, useCancelTicket } from '../hooks/useMyTicket'
import { TicketStatusChip } from '../features/tickets/TicketStatusChip'
import { ConnectionStatus } from '../shared/components/ConnectionStatus'
import { formatDateTime } from '../shared/format/datetime'
import { counterLabel } from '../shared/format/counterLabel'
import { useToastOnError } from '../shared/hooks/useToastOnError'
import { toastFromError } from '../shared/toast/appToast'
import { useQueueSocket } from '../shared/realtime/useQueueSocket'
import { useAuth } from '../features/auth/useAuth'

export default function HomePage() {
  const { hasRole } = useAuth()
  const { data: ticket, isLoading, isError, error } = useMyTicket()
  const cancelMutation = useCancelTicket()
  const { connected } = useQueueSocket()
  const [showConfirm, setShowConfirm] = useState(false)

  useToastOnError(isError, error, {
    fallback: 'No se pudo obtener tu turno. Verifica que el servidor esté en línea.',
  })

  if (hasRole('ADMIN')) {
    return <Navigate to="/search" replace />
  }

  if (hasRole('STAFF') && !hasRole('ADMIN')) {
    return <Navigate to="/staff" replace />
  }

  async function handleCancel() {
    if (!ticket) return
    try {
      await cancelMutation.mutateAsync(ticket.id)
      setShowConfirm(false)
    } catch (err) {
      toastFromError(err, 'No se pudo cancelar el turno. Intenta de nuevo.')
    }
  }

  const isBeingServed = ticket?.status === 'SERVING'

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mi turno
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Consulta el estado de tu turno activo en tiempo real.
          </p>
        </div>
        <ConnectionStatus connected={connected} />
      </header>

      {isLoading && (
        <Card>
          <Card.Content className="flex items-center justify-center gap-3 py-12">
            <Spinner size="sm" />
            <span className="text-sm text-muted">Cargando tu turno…</span>
          </Card.Content>
        </Card>
      )}


      {!isLoading && !isError && !ticket && (
        <Card>
          <Card.Content className="flex flex-col items-center gap-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
              <Ticket size={28} strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No tienes un turno activo
              </p>
              <p className="mt-1 text-sm text-muted">
                Busca un establecimiento y toma tu lugar en la fila.
              </p>
            </div>
            <Link to="/search">
              <Button variant="primary">Buscar establecimientos</Button>
            </Link>
          </Card.Content>
        </Card>
      )}

      {!isLoading && !isError && ticket && (
        <Card className="overflow-hidden">
          <div className="bg-accent px-6 py-5 text-accent-foreground">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground/70">
                Tu turno activo
              </p>
              <TicketStatusChip status={ticket.status} />
            </div>
            <p className="mt-1 text-5xl font-bold tracking-tight">
              {ticket.number}
            </p>
            <p className="mt-1 text-sm text-accent-foreground/80">
              {ticket.placeName}
            </p>
          </div>

          <Card.Content className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Posición en la fila</span>
              <Chip color="accent" variant="soft">
                {ticket.position}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Clock size={14} />
                Tiempo estimado
              </span>
              <span className="text-sm font-medium text-foreground">
                ~{ticket.estimatedMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <CalendarClock size={14} />
                Expedido
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDateTime(ticket.issuedAt)}
              </span>
            </div>
            {(ticket.status === 'CALLED' || ticket.status === 'SERVING') &&
              ticket.counterNumber != null && (
                <Alert status="accent">
                  Dirígete a la caja{' '}
                  {ticket.counterLabel ?? counterLabel(ticket.counterNumber)}
                </Alert>
              )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={14} />
                Establecimiento
              </span>
              <Link
                to={`/place/${ticket.placeId}/queue`}
                className="text-sm font-medium text-accent hover:underline"
              >
                Ver fila
              </Link>
            </div>
            <Separator />
            <p className="text-sm text-muted">
              Recibirás un aviso cuando se acerque tu turno.
            </p>

            {isBeingServed ? (
              <p className="text-center text-lg font-semibold text-foreground">
                Es tu turno
              </p>
            ) : !showConfirm ? (
              <Button
                variant="danger"
                fullWidth
                onPress={() => setShowConfirm(true)}
                isDisabled={cancelMutation.isPending}
              >
                Cancelar turno
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Alert status="warning">
                  ¿Confirmas que deseas cancelar tu turno?
                </Alert>
                <div className="flex gap-2">
                  <Button
                    variant="tertiary"
                    fullWidth
                    onPress={() => setShowConfirm(false)}
                  >
                    No, mantener
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onPress={handleCancel}
                    isDisabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Spinner size="sm" color="current" />
                    ) : (
                      'Sí, cancelar'
                    )}
                  </Button>
                </div>
              </div>
            )}

          </Card.Content>
        </Card>
      )}
    </section>
  )
}
