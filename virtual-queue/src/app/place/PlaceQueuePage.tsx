import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Card, Spinner } from '@heroui/react'
import { Clock, Users } from 'lucide-react'
import DashboardStats from './DashboardStats'
import { usePlace, usePlaceQueue, usePlaceStats } from '../../hooks/usePlace'
import { useMyTicket, useTakeTicket } from '../../hooks/useMyTicket'
import { ConnectionStatus } from '../../shared/components/ConnectionStatus'
import { useQueueSocket, usePlaceStatsSocket } from '../../shared/realtime/useQueueSocket'
import { ApiError } from '../../shared/api/client'

export default function PlaceQueuePage() {
  const { id: placeId } = useParams()
  const { data: place, isLoading: placeLoading } = usePlace(placeId)
  const { data: queue, isLoading: queueLoading } = usePlaceQueue(placeId)
  const { data: stats, isLoading: statsLoading } = usePlaceStats(placeId)
  const { data: myTicket } = useMyTicket()
  const takeMutation = useTakeTicket()
  const { connected } = useQueueSocket()
  usePlaceStatsSocket(placeId)
  const [showConfirm, setShowConfirm] = useState(false)
  const [takeError, setTakeError] = useState<string | null>(null)

  const isLoading = placeLoading || queueLoading || statsLoading
  const hasActiveTicket = !!myTicket
  const hasTicketHere = myTicket?.placeId === placeId

  async function handleTakeTicket() {
    if (!placeId) return
    setTakeError(null)
    try {
      await takeMutation.mutateAsync(placeId)
      setShowConfirm(false)
    } catch (err) {
      setTakeError(err instanceof ApiError ? err.message : 'No se pudo tomar el turno.')
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

      {!isLoading && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <Users size={20} className="text-accent" />
              <div>
                <p className="text-xs text-muted">En fila</p>
                <p className="text-xl font-bold">{stats.activeTickets}</p>
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <Clock size={20} className="text-accent" />
              <div>
                <p className="text-xs text-muted">Espera promedio</p>
                <p className="text-xl font-bold">~{stats.averageWaitMinutes} min</p>
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="flex items-center gap-3 py-2">
              <div>
                <p className="text-xs text-muted">Turno llamado</p>
                <p className="text-xl font-bold">{stats.turnCalled ?? '—'}</p>
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
              ? `${queue.openCounters} ventanilla(s) · ~${queue.averageServiceMinutes} min por turno`
              : 'Información actualizada del establecimiento.'}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <DashboardStats placeId={placeId} />
        </Card.Content>
        <Card.Footer className="flex-col gap-3">
          {hasTicketHere ? (
            <div className="flex w-full flex-col gap-2">
              <Alert status="success">
                Ya tienes el turno <strong>{myTicket?.number}</strong> en este establecimiento.
              </Alert>
              {(myTicket?.status === 'CALLED' || myTicket?.status === 'SERVING') &&
                myTicket.counterNumber != null && (
                  <Alert status="accent">
                    Dirígete a la ventanilla {myTicket.counterNumber}
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

          {takeError && <Alert status="danger">{takeError}</Alert>}

          <Link to="/home" className="w-full">
            <Button variant="secondary" fullWidth>
              Ver mi turno
            </Button>
          </Link>
        </Card.Footer>
      </Card>
    </section>
  )
}
