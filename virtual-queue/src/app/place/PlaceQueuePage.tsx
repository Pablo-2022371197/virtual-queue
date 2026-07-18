import { Link, useParams } from 'react-router-dom'
import { Button, Card } from '@heroui/react'
import DashboardStats from './DashboardStats'

export default function PlaceQueuePage() {
  const { id: placeId } = useParams()

  return (
    <section className="flex flex-col gap-6">
      <header>
        <Link
          to="/search"
          className="text-sm font-medium text-accent hover:text-accent-hover hover:underline"
        >
          ← Volver a establecimientos
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Estado del establecimiento
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Estadísticas de la fila en tiempo real.
        </p>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>Fila en vivo</Card.Title>
          <Card.Description>
            Información actualizada del establecimiento seleccionado.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <DashboardStats
            placeId={placeId}
            onTurnCalled={(payload) => {
              console.log('Turn called', payload)
            }}
          />
        </Card.Content>
        <Card.Footer>
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
