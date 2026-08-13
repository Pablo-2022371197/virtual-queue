import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Chip, Spinner } from '@heroui/react'
import { getExperiencedPlaces } from '../shared/api/places'
import { usePlaceStats } from '../hooks/usePlace'
import { usePlaceStatsSocket } from '../shared/realtime/useQueueSocket'
import { ConnectionStatus } from '../shared/components/ConnectionStatus'
import { useQueueSocket } from '../shared/realtime/useQueueSocket'
import { useAuth } from '../features/auth/useAuth'

export default function StatsPage() {
  const { hasRole } = useAuth()
  const { data: places = [], isLoading } = useQuery({
    queryKey: ['places', 'experienced'],
    queryFn: getExperiencedPlaces,
  })
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>()
  const activePlaceId = selectedPlaceId ?? places[0]?.id

  const { data: stats, isLoading: statsLoading } = usePlaceStats(activePlaceId)
  const { connected } = useQueueSocket()
  usePlaceStatsSocket(activePlaceId)

  const emptyMessage = hasRole('STAFF')
    ? 'Tu usuario de personal no tiene un establecimiento asignado.'
    : hasRole('ADMIN')
      ? 'No hay establecimientos registrados.'
      : 'Aún no has pedido turno en ningún establecimiento. Las estadísticas aparecerán aquí después de tu primera visita.'

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Herramientas estadísticas
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {hasRole('STAFF')
              ? 'Métricas en vivo de tu establecimiento asignado.'
              : hasRole('ADMIN')
                ? 'Métricas en tiempo real de cualquier establecimiento.'
                : 'Solo ves establecimientos donde has pedido un turno.'}
          </p>
        </div>
        <ConnectionStatus connected={connected} />
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando establecimientos…</span>
        </div>
      )}

      {!isLoading && places.length === 0 && (
        <Alert status="warning">{emptyMessage}</Alert>
      )}

      {places.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlaceId(place.id)}
                className="rounded-full"
              >
                <Chip
                  variant={activePlaceId === place.id ? 'primary' : 'soft'}
                  color="accent"
                >
                  {place.name}
                </Chip>
              </button>
            ))}
          </div>

          {statsLoading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Spinner size="sm" />
            </div>
          )}

          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <Card.Content className="flex flex-col gap-1 py-2">
                  <span className="text-xs text-muted">Personas en fila</span>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.activeTickets}
                  </span>
                  <Chip size="sm" variant="soft" color="accent">
                    en vivo
                  </Chip>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="flex flex-col gap-1 py-2">
                  <span className="text-xs text-muted">Espera promedio</span>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.averageWaitMinutes} min
                  </span>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="flex flex-col gap-1 py-2">
                  <span className="text-xs text-muted">Cajas atendiendo</span>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.openCounters}
                  </span>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="flex flex-col gap-1 py-2">
                  <span className="text-xs text-muted">Turno llamado</span>
                  <span className="text-2xl font-bold text-foreground">
                    {stats.turnCalled ?? '—'}
                  </span>
                </Card.Content>
              </Card>
            </div>
          )}

        </>
      )}
    </section>
  )
}
