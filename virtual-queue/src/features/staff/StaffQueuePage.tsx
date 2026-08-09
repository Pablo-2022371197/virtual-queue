import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from '@heroui/react'
import { getPlaceQueue, searchPlaces } from '../../shared/api/places'
import {
  acceptTicket,
  callNextTicket,
  completeTicket,
  expireTicket,
  getStaffPlace,
  listQueueTickets,
  startTicket,
  updateQueueSettings,
} from '../../shared/api/staff'
import { TicketStatusChip } from '../tickets/TicketStatusChip'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../../shared/api/client'
import type { Ticket, TicketStatus } from '../../shared/types/api'

const STATUS_FILTERS: TicketStatus[] = ['WAITING', 'NEARLY', 'CALLED', 'SERVING']

const STATUS_FILTER_LABELS: Record<TicketStatus, string> = {
  WAITING: 'En espera',
  NEARLY: 'Próximo',
  CALLED: 'Llamado',
  SERVING: 'En atención',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Ausente',
}

export default function StaffQueuePage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const { data: staffPlace, isLoading: staffPlaceLoading } = useQuery({
    queryKey: ['staff', 'place'],
    queryFn: getStaffPlace,
    enabled: !isAdmin,
  })

  const { data: placesPage, isLoading: placesLoading } = useQuery({
    queryKey: ['places', { size: 50 }],
    queryFn: () => searchPlaces({ size: 50 }),
    enabled: isAdmin,
  })

  const places = placesPage?.content ?? []
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>()
  const activePlaceId = isAdmin
    ? (selectedPlaceId ?? places[0]?.id)
    : staffPlace?.id

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['places', activePlaceId, 'queue'],
    queryFn: () => getPlaceQueue(activePlaceId!),
    enabled: !!activePlaceId,
  })

  const [statusFilter, setStatusFilter] = useState<TicketStatus>('WAITING')
  const [openCounters, setOpenCounters] = useState('')
  const [avgMinutes, setAvgMinutes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [acceptTarget, setAcceptTarget] = useState<Ticket | null>(null)
  const [selectedCounter, setSelectedCounter] = useState('1')

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, statusFilter],
    queryFn: () => listQueueTickets(queue!.id, statusFilter),
    enabled: !!queue?.id,
    refetchInterval: 10_000,
  })

  const counterOptions = useMemo(() => {
    const count = queue?.openCounters ?? 1
    return Array.from({ length: count }, (_, index) => index + 1)
  }, [queue?.openCounters])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] })
    queryClient.invalidateQueries({ queryKey: ['places'] })
  }

  const callNext = useMutation({
    mutationFn: () => callNextTicket(queue!.id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Error al llamar turno'),
  })

  const accept = useMutation({
    mutationFn: ({ ticketId, counter }: { ticketId: string; counter?: number }) =>
      acceptTicket(ticketId, counter),
    onSuccess: () => {
      setAcceptTarget(null)
      invalidate()
    },
    onError: (err) =>
      setActionError(err instanceof ApiError ? err.message : 'Error al aceptar turno'),
  })

  const start = useMutation({
    mutationFn: (id: string) => startTicket(id),
    onSuccess: invalidate,
  })

  const complete = useMutation({
    mutationFn: (id: string) => completeTicket(id),
    onSuccess: invalidate,
  })

  const expire = useMutation({
    mutationFn: (id: string) => expireTicket(id),
    onSuccess: invalidate,
  })

  const updateSettings = useMutation({
    mutationFn: () =>
      updateQueueSettings(queue!.id, {
        openCounters: openCounters ? Number(openCounters) : undefined,
        averageServiceMinutes: avgMinutes ? Number(avgMinutes) : undefined,
      }),
    onSuccess: invalidate,
  })

  function handleAcceptClick(ticket: Ticket) {
    setActionError(null)
    if ((queue?.openCounters ?? 1) > 1) {
      setSelectedCounter('1')
      setAcceptTarget(ticket)
      return
    }
    accept.mutate({ ticketId: ticket.id })
  }

  function confirmAccept() {
    if (!acceptTarget) return
    accept.mutate({
      ticketId: acceptTarget.id,
      counter: Number(selectedCounter),
    })
  }

  const isLoading = (isAdmin ? placesLoading : staffPlaceLoading) || queueLoading
  const placeName = isAdmin
    ? places.find((place) => place.id === activePlaceId)?.name
    : staffPlace?.name

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Panel de personal
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {isAdmin
            ? 'Opera la fila del establecimiento seleccionado.'
            : placeName
              ? `Establecimiento asignado: ${placeName}`
              : 'Cargando establecimiento asignado…'}
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Spinner size="sm" />
        </div>
      )}

      {!isAdmin && !staffPlaceLoading && !staffPlace && (
        <Alert status="warning">
          Tu usuario STAFF no tiene un establecimiento asignado. Contacta al administrador.
        </Alert>
      )}

      {isAdmin && places.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => setSelectedPlaceId(place.id)}
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
      )}

      {queue && (
        <Card>
          <Card.Header>
            <Card.Title>Configuración de fila</Card.Title>
            <Card.Description>
              Prefijo {queue.prefix} · {queue.openCounters} ventanilla(s) · ~
              {queue.averageServiceMinutes} min/turno
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <TextField
              name="openCounters"
              fullWidth
              value={openCounters}
              onChange={setOpenCounters}
            >
              <Label>Ventanillas abiertas</Label>
              <Input placeholder={String(queue.openCounters)} type="number" />
            </TextField>
            <TextField
              name="avgMinutes"
              fullWidth
              value={avgMinutes}
              onChange={setAvgMinutes}
            >
              <Label>Minutos promedio</Label>
              <Input placeholder={String(queue.averageServiceMinutes)} type="number" />
            </TextField>
            <Button
              variant="secondary"
              onPress={() => updateSettings.mutate()}
              isDisabled={updateSettings.isPending}
            >
              Guardar
            </Button>
          </Card.Content>
          <Card.Footer>
            <Button
              variant="primary"
              fullWidth
              onPress={() => callNext.mutate()}
              isDisabled={callNext.isPending}
            >
              {callNext.isPending ? <Spinner size="sm" color="current" /> : 'Llamar siguiente turno'}
            </Button>
          </Card.Footer>
        </Card>
      )}

      {actionError && <Alert status="danger">{actionError}</Alert>}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button key={status} type="button" onClick={() => setStatusFilter(status)}>
            <Chip variant={statusFilter === status ? 'primary' : 'soft'} color="accent">
              {STATUS_FILTER_LABELS[status]}
            </Chip>
          </button>
        ))}
      </div>

      {ticketsLoading && <Spinner size="sm" />}

      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <Card.Content className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{ticket.number}</p>
                <p className="text-xs text-muted">Posición {ticket.position}</p>
                {ticket.counterNumber != null && (
                  <Chip size="sm" variant="soft" color="accent" className="mt-1">
                    Ventanilla {ticket.counterNumber}
                  </Chip>
                )}
              </div>
              <TicketStatusChip status={ticket.status} />
              <div className="flex flex-wrap gap-2">
                {(ticket.status === 'WAITING' || ticket.status === 'NEARLY') && (
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => handleAcceptClick(ticket)}
                    isDisabled={accept.isPending}
                  >
                    Aceptar
                  </Button>
                )}
                {ticket.status === 'CALLED' && (
                  <Button size="sm" variant="primary" onPress={() => start.mutate(ticket.id)}>
                    Iniciar
                  </Button>
                )}
                {ticket.status === 'SERVING' && (
                  <Button size="sm" variant="primary" onPress={() => complete.mutate(ticket.id)}>
                    Completar
                  </Button>
                )}
                {(ticket.status === 'CALLED' ||
                  ticket.status === 'WAITING' ||
                  ticket.status === 'NEARLY') && (
                  <Button size="sm" variant="danger" onPress={() => expire.mutate(ticket.id)}>
                    Ausente
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        ))}
        {!ticketsLoading && tickets.length === 0 && (
          <Alert status="accent">No hay turnos con estado {statusFilter}.</Alert>
        )}
      </div>

      <Modal.Backdrop isOpen={acceptTarget != null} onOpenChange={() => setAcceptTarget(null)}>
        <Modal.Container>
          <Modal.Dialog className="max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Seleccionar ventanilla</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Turno {acceptTarget?.number}. Elige la ventanilla donde atenderás al cliente.
              </p>
              <TextField
                name="counter"
                isRequired
                fullWidth
                value={selectedCounter}
                onChange={setSelectedCounter}
              >
                <Label>Ventanilla</Label>
                <Input type="number" min={1} max={queue?.openCounters ?? 1} />
              </TextField>
              <div className="flex flex-wrap gap-2">
                {counterOptions.map((counter) => (
                  <Button
                    key={counter}
                    size="sm"
                    variant={selectedCounter === String(counter) ? 'primary' : 'secondary'}
                    onPress={() => setSelectedCounter(String(counter))}
                  >
                    {counter}
                  </Button>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setAcceptTarget(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={confirmAccept} isDisabled={accept.isPending}>
                {accept.isPending ? <Spinner size="sm" color="current" /> : 'Confirmar'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  )
}
