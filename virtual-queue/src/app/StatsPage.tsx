import { Card, Chip } from '@heroui/react'
import DashboardStats from './place/DashboardStats'

const summaryStats = [
  { label: 'Turnos hoy', value: '128', change: '+12%' },
  { label: 'Tiempo promedio', value: '8 min', change: '-2 min' },
  { label: 'Establecimientos', value: '6', change: 'activos' },
  { label: 'Usuarios en fila', value: '34', change: 'en vivo' },
]

export default function StatsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Herramientas estadísticas
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Panel de métricas disponible tras iniciar sesión.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <Card.Content className="flex flex-col gap-1 py-2">
              <span className="text-xs text-muted">{stat.label}</span>
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <Chip size="sm" variant="soft" color="accent">
                {stat.change}
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Fila en vivo — establecimiento demo</Card.Title>
          <Card.Description>
            Widget embebido con estadísticas en tiempo real vía WebSocket.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <DashboardStats
            placeId="demo"
            onTurnCalled={(payload) => {
              console.log('Turn called', payload)
            }}
          />
        </Card.Content>
      </Card>

      <Card variant="secondary">
        <Card.Content className="py-8">
          <div className="flex h-40 items-end justify-around gap-2 px-4">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <div
                key={i}
                className="w-full max-w-10 rounded-t-md bg-accent/70"
                style={{ height: `${height}%` }}
                title={`Día ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Turnos atendidos — últimos 7 días
          </p>
        </Card.Content>
      </Card>
    </section>
  )
}
