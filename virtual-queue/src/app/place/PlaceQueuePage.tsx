import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Card, Spinner } from '@heroui/react'
import { Clock, Users } from 'lucide-react'
import { usePlace, usePlaceQueue, usePlaceStats } from '../../hooks/usePlace'
import { useMyTicket, useTakeTicket } from '../../hooks/useMyTicket'
import { ConnectionStatus } from '../../shared/components/ConnectionStatus'
import { formatDateTime } from '../../shared/format/datetime'
import { counterLabel } from '../../shared/format/counterLabel'
import { useToastOnError } from '../../shared/hooks/useToastOnError'
import { useQueueSocket, usePlaceStatsSocket } from '../../shared/realtime/useQueueSocket'
import { toastFromError } from '../../shared/toast/appToast'
import { useAuth } from '../../features/auth/useAuth'

export default function PlaceQueuePage() {
  const { id: placeId } = useParams()
  const { hasRole } = useAuth()
  const canTakeTicket = hasRole('CUSTOMER')
  const {
    data: place,
    isLoading: placeLoading,
    isError: placeLoadError,
    error: placeQueryError,
  } = usePlace(placeId)
  const {
    data: queue,
    isLoading: queueLoading,
    isError: queueLoadError,
    error: queueQueryError,
  } = usePlaceQueue(placeId)
  const { data: myTicket } = useMyTicket()
  const hasTicketHere = myTicket?.placeId === placeId
  const canViewStats = hasRole('ADMIN') || !!hasTicketHere
  const { data: stats, isLoading: statsLoading } = usePlaceStats(placeId, {
    enabled: canViewStats,
  })
  const takeMutation = useTakeTicket()
  const { connected } = useQueueSocket()
  usePlaceStatsSocket(canViewStats ? placeId : undefined)
  const [showConfirm, setShowConfirm] = useState(false)

  useToastOnError(placeLoadError, placeQueryError, {
    title: 'No se pudo cargar el establecimiento',
  })
  useToastOnError(queueLoadError, queueQueryError, {
    title: 'No se pudo cargar la fila',
  })

  const isLoading = placeLoading || queueLoading || (canViewStats && statsLoading)
  const hasActiveTicket = !!myTicket

  async function handleTakeTicket() {
    if (!placeId || !canTakeTicket) return
    try {
      await takeMutation.mutateAsync(placeId)
      setShowConfirm(false)
    } catch (err) {
      toastFromError(err, 'No se pudo tomar el turno.')
      setShowConfirm(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <Link
          to="/search"
          className="text-sm font-medium text-accent hover:text-accent-hover hover:underline"
        >
          ← Volver a establecimientos
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {place?.name ?? 'Establecimiento'}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {place?.address ?? 'Cargando información…'}
            </p>
          </div>
          <ConnectionStatus connected={connected} />
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-14">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando…</span>
        </div>
      )}

      {!isLoading && (stats || queue) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <Users size={20} className="text-accent" />
              <div>
                <p className="text-xs text-muted">En fila</p>
                <p className="text-xl font-bold">
                  {stats?.activeTickets ?? '—'}
                </p>
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <Clock size={20} className="text-accent" />
              <div>
                <p className="text-xs text-muted">Espera promedio</p>
                <p className="text-xl font-bold">
                  ~{stats?.averageWaitMinutes ?? queue?.averageServiceMinutes ?? '—'} min
                </p>
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <div>
                <p className="text-xs text-muted">Turno llamado</p>
                <p className="text-xl font-bold">{stats?.turnCalled ?? '—'}</p>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Fila en vivo</Card.Title>
          <Card.Description>
            {queue
              ? `${queue.totalCounters ?? queue.openCounters} caja(s) · ~${queue.averageServiceMinutes} min por turno`
              : 'Información actualizada del establecimiento.'}
          </Card.Description>
        </Card.Header>
        {!canViewStats && (
          <Card.Content>
            <Alert status="accent">
              Las estadísticas en vivo se habilitan después de tomar un turno aquí.
            </Alert>
          </Card.Content>
        )}
        <Card.Footer className="flex-col gap-3">
          {!canTakeTicket ? (
            <Alert status="warning">
              El personal no toma turnos. Usa el panel de Personal para atender la fila.
            </Alert>
          ) : hasTicketHere ? (
            <div className="flex w-full flex-col gap-2">
              <Alert status="success">
                Ya tienes el turno <strong>{myTicket?.number}</strong> en este establecimiento.
                {myTicket?.issuedAt && (
                  <>
                    {' '}
                    Expedido el {formatDateTime(myTicket.issuedAt)}.
                  </>
                )}
              </Alert>
              {(myTicket?.status === 'CALLED' || myTicket?.status === 'SERVING') &&
                myTicket.counterNumber != null && (
                  <Alert status="accent">
                    Dirígete a la caja{' '}
                    {myTicket.counterLabel ?? counterLabel(myTicket.counterNumber)}
                  </Alert>
                )}
            </div>
          ) : hasActiveTicket ? (
            <Alert status="warning">
              Ya tienes un turno activo en otro establecimiento. Cancélalo primero.
            </Alert>
          ) : !showConfirm ? (
            <Button
              variant="primary"
              fullWidth
              onPress={() => setShowConfirm(true)}
              isDisabled={!queue?.active || takeMutation.isPending}
            >
              Tomar turno
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Alert status="accent">
                ¿Confirmas que deseas tomar un turno en {place?.name}?
              </Alert>
              <div className="flex gap-2">
                <Button variant="tertiary" fullWidth onPress={() => setShowConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onPress={handleTakeTicket}
                  isDisabled={takeMutation.isPending}
                >
                  {takeMutation.isPending ? <Spinner size="sm" color="current" /> : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}

          {canTakeTicket && (
            <Link to="/home" className="w-full">
              <Button variant="secondary" fullWidth>
                Ver mi turno
              </Button>
            </Link>
          )}
        </Card.Footer>
      </Card>
    </section>
  )
}
