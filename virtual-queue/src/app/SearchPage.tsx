import { Link } from 'react-router-dom'
import { Alert, Button, Card, Chip, Input, Spinner } from '@heroui/react'
import { useSearchPlaces } from '../hooks/useSearchPlaces'

export default function SearchPage() {
  const { results, isLoading, isError, query, setQuery } = useSearchPlaces()

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Establecimientos
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Encuentra un lugar y únete a su fila virtual.
        </p>
      </header>

      {/* Standalone Input (primitive) — no TextField wrapper needed when there's no label */}
      <Input
        aria-label="Buscar establecimientos"
        placeholder="Buscar por nombre, dirección o categoría…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />

      {isError && (
        <Alert status="warning">
          No se pudieron cargar los establecimientos. Verifica que el servidor
          esté en línea.
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-14">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando…</span>
        </div>
      )}

      {!isLoading && !isError && results.length === 0 && query.length > 0 && (
        <Card variant="secondary">
          <Card.Content className="py-12 text-center text-sm text-muted">
            No se encontraron resultados para{' '}
            <span className="font-medium text-foreground">"{query}"</span>.
          </Card.Content>
        </Card>
      )}

      {!isLoading && !isError && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((place) => (
            <Card key={place.id}>
              <Card.Header className="flex-row items-start justify-between gap-3">
                <Card.Title>{place.name}</Card.Title>
                {place.category && (
                  <Chip size="sm" variant="soft" color="accent">
                    {place.category}
                  </Chip>
                )}
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-muted">{place.address}</p>
              </Card.Content>
              <Card.Footer>
                <Link to={`/place/${place.id}/queue`} className="w-full">
                  <Button variant="primary" fullWidth>
                    Ver fila
                  </Button>
                </Link>
              </Card.Footer>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
