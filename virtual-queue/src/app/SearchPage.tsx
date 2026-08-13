import { Link } from 'react-router-dom'
import { Button, Card, Chip, Input, Spinner } from '@heroui/react'
import { useSearchPlaces } from '../hooks/useSearchPlaces'
import { useToastOnError } from '../shared/hooks/useToastOnError'

export default function SearchPage() {
  const { results, isLoading, isError, error, query, setQuery } = useSearchPlaces()

  useToastOnError(isError, error, {
    fallback: 'No se pudieron cargar los establecimientos.',
  })

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

      <Input
        aria-label="Buscar establecimientos"
        placeholder="Buscar por nombre, dirección o categoría…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-14">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando…</span>
        </div>
      )}

      {!isLoading && !isError && results.length === 0 && query.length >= 2 && (
        <Card variant="secondary">
          <Card.Content className="py-12 text-center text-sm text-muted">
            No se encontraron resultados para{' '}
            <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
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
                {place.description && (
                  <p className="mt-2 text-xs text-muted line-clamp-2">
                    {place.description}
                  </p>
                )}
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
