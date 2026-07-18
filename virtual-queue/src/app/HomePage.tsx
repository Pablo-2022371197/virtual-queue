import { Link } from 'react-router-dom'
import { Alert, Button, Card, Chip, Separator, Spinner } from '@heroui/react'
import { Ticket } from 'lucide-react'
import { useMyTicket } from '../hooks/useMyTicket'

export default function HomePage() {
  const { data: ticket, isLoading, isError } = useMyTicket()

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mi turno
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Consulta el estado de tu turno activo en tiempo real.
        </p>
      </header>

      {isLoading && (
        <Card>
          <Card.Content className="flex items-center justify-center gap-3 py-12">
            <Spinner size="sm" />
            <span className="text-sm text-muted">
              Cargando tu turno…
            </span>
          </Card.Content>
        </Card>
      )}

      {isError && (
        <Alert status="warning">
          No se pudo obtener tu turno. Verifica que el servidor esté en línea.
        </Alert>
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
          {/* Accent banner — uses pure Tailwind, no conflicting Card padding */}
          <div className="bg-accent px-6 py-5 text-accent-foreground">
            <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground/70">
              Tu turno activo
            </p>
            <p className="mt-1 text-5xl font-bold tracking-tight">
              #{ticket.number ?? ticket.id}
            </p>
          </div>

          <Card.Content className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Posición en la fila</span>
              <Chip color="accent" variant="soft">
                {ticket.position ?? '—'}
              </Chip>
            </div>
            <Separator />
            <p className="text-sm text-muted">
              Recibirás un aviso en tu teléfono y wearable cuando se acerque tu
              turno.
            </p>
          </Card.Content>
        </Card>
      )}
    </section>
  )
}
