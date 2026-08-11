import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  Label,
  Modal,
  Radio,
  RadioGroup,
  Spinner,
} from '@heroui/react'
import { getPlaceQueue, searchPlaces } from '../../shared/api/places'
import {
  acceptTicket,
  callNextTicket,
  claimStaffCounter,
  completeTicket,
  expireTicket,
  getLastDismissedTicket,
  getStaffCounters,
  getStaffPlace,
  listQueueTickets,
  startTicket,
} from '../../shared/api/staff'
import { TicketStatusChip } from '../tickets/TicketStatusChip'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../../shared/api/client'
import { counterLabel } from '../../shared/format/counterLabel'
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
  const isStaff = hasRole('STAFF') && !isAdmin

  const { data: staffPlace, isLoading: staffPlaceLoading } = useQuery({
    queryKey: ['staff', 'place'],
    queryFn: getStaffPlace,
    enabled: isStaff,
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

  const {
    data: counterState,
    isLoading: countersLoading,
    refetch: refetchCounters,
  } = useQuery({
    queryKey: ['staff', 'counters'],
    queryFn: getStaffCounters,
    enabled: isStaff,
    refetchInterval: 15_000,
  })

  const [statusFilter, setStatusFilter] = useState<TicketStatus>('WAITING')
  const [actionError, setActionError] = useState<string | null>(null)
  const [claimSelection, setClaimSelection] = useState<string>('')
  const [claimOpen, setClaimOpen] = useState(false)

  const needsClaim =
    isStaff &&
    !!counterState &&
    counterState.claimedCounter == null

  useEffect(() => {
    if (!counterState || !isStaff) return

    if (counterState.claimedCounter != null) {
      setClaimOpen(false)
      setClaimSelection(String(counterState.claimedCounter))
      return
    }

    if (counterState.totalCounters <= 1) {
      const only = counterState.counters.find((c) => !c.occupied || c.claimedByMe)
      if (only) {
        claimStaffCounter(only.number)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'counters'] })
          })
          .catch((err) =>
            setActionError(
              err instanceof ApiError ? err.message : 'No se pudo asignar la caja',
            ),
          )
        return
      }
    }

    const firstFree = counterState.counters.find((c) => !c.occupied)?.number
    setClaimSelection(firstFree != null ? String(firstFree) : '')
    setClaimOpen(true)
  }, [counterState, isStaff, queryClient])

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, statusFilter],
    queryFn: () => listQueueTickets(queue!.id, statusFilter),
    enabled: !!queue?.id && (!isStaff || !needsClaim),
    refetchInterval: 10_000,
  })

  const { data: lastDismissed = null } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, 'last-dismissed'],
    queryFn: () => getLastDismissedTicket(queue!.id),
    enabled: !!queue?.id && (!isStaff || !needsClaim),
    refetchInterval: 10_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] })
    queryClient.invalidateQueries({ queryKey: ['places'] })
  }

  const claimMutation = useMutation({
    mutationFn: (counterNumber: number) => claimStaffCounter(counterNumber),
    onSuccess: () => {
      setClaimOpen(false)
      invalidate()
    },
    onError: (err) =>
      setActionError(err instanceof ApiError ? err.message : 'No se pudo reclamar la caja'),
  })

  const callNext = useMutation({
    mutationFn: () => callNextTicket(queue!.id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Error al llamar turno'),
  })

  const accept = useMutation({
    mutationFn: (ticketId: string) => acceptTicket(ticketId),
    onSuccess: invalidate,
    onError: (err) =>
      setActionError(err instanceof ApiError ? err.message : 'Error al aceptar turno'),
  })

  const start = useMutation({
    mutationFn: (id: string) => startTicket(id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Error al iniciar'),
  })

  const complete = useMutation({
    mutationFn: (id: string) => completeTicket(id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Error al completar'),
  })

  const expire = useMutation({
    mutationFn: (id: string) => expireTicket(id),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Error al marcar ausente'),
  })

  const isLoading =
    (isAdmin ? placesLoading : staffPlaceLoading) || queueLoading || (isStaff && countersLoading)
  const placeName = isAdmin
    ? places.find((place) => place.id === activePlaceId)?.name
    : staffPlace?.name

  const totalBoxes = queue?.totalCounters ?? queue?.openCounters ?? 1
  const claimedCode =
    counterState?.claimedCode ??
    (counterState?.claimedCounter != null
      ? counterLabel(counterState.claimedCounter)
      : null)

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
        </div>
        {isStaff && claimedCode && (
          <Chip color="accent" variant="soft">
            Tu caja: {claimedCode}
          </Chip>
        )}
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Spinner size="sm" />
        </div>
      )}

      {isStaff && !staffPlaceLoading && !staffPlace && (
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
            <Card.Title>Fila del establecimiento</Card.Title>
            <Card.Description>
              Prefijo {queue.prefix} · {totalBoxes} caja(s) · ~
              {queue.averageServiceMinutes} min/turno (promedio real)
              {queue.openCounters != null && (
                <> · {queue.openCounters} atendiendo ahora</>
              )}
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              variant="primary"
              className="w-full"
              onPress={() => {
                setActionError(null)
                callNext.mutate()
              }}
              isDisabled={callNext.isPending || (isStaff && needsClaim)}
            >
              {callNext.isPending ? <Spinner size="sm" color="current" /> : 'Llamar siguiente turno'}
            </Button>
          </Card.Footer>
        </Card>
      )}

      {actionError && <Alert status="danger">{actionError}</Alert>}

      {lastDismissed && (
        <Alert status={lastDismissed.status === 'CANCELLED' ? 'warning' : 'accent'}>
          Último turno saltado: <strong>{lastDismissed.number}</strong>
          {' — '}
          {lastDismissed.status === 'CANCELLED'
            ? 'Cancelado por el cliente'
            : 'Marcado como ausente'}
        </Alert>
      )}

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
                {(ticket.counterLabel || ticket.counterNumber != null) && (
                  <Chip size="sm" variant="soft" color="accent" className="mt-1">
                    Caja {ticket.counterLabel ?? counterLabel(ticket.counterNumber)}
                  </Chip>
                )}
              </div>
              <TicketStatusChip status={ticket.status} />
              <div className="flex flex-wrap gap-2">
                {(ticket.status === 'WAITING' || ticket.status === 'NEARLY') && (
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => {
                      setActionError(null)
                      accept.mutate(ticket.id)
                    }}
                    isDisabled={accept.isPending || (isStaff && needsClaim)}
                  >
                    Aceptar
                  </Button>
                )}
                {ticket.status === 'CALLED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => start.mutate(ticket.id)}
                    isDisabled={isStaff && needsClaim}
                  >
                    Iniciar
                  </Button>
                )}
                {ticket.status === 'SERVING' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => complete.mutate(ticket.id)}
                    isDisabled={isStaff && needsClaim}
                  >
                    Completar
                  </Button>
                )}
                {(ticket.status === 'CALLED' ||
                  ticket.status === 'WAITING' ||
                  ticket.status === 'NEARLY') && (
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={() => expire.mutate(ticket.id)}
                    isDisabled={isStaff && needsClaim}
                  >
                    Ausente
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        ))}
        {!ticketsLoading && !needsClaim && tickets.length === 0 && (
          <Alert status="accent">No hay turnos con estado {statusFilter}.</Alert>
        )}
      </div>

      <Modal.Backdrop
        isOpen={claimOpen}
        isDismissable={false}
        onOpenChange={() => {
          /* obligatorio: no cerrar sin claim */
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Seleccionar caja</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Elige la caja que atenderás en esta sesión. Quedará fija hasta que cierres
                sesión.
              </p>
              <RadioGroup
                name="staff-counter"
                orientation="horizontal"
                value={claimSelection}
                onChange={setClaimSelection}
              >
                <Label>Cajas disponibles</Label>
                {counterState?.counters.map((slot) => (
                  <Radio
                    key={slot.number}
                    value={String(slot.number)}
                    isDisabled={slot.occupied && !slot.claimedByMe}
                  >
                    <Radio.Content>
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      Caja {slot.code}
                    </Radio.Content>
                    {slot.occupied && !slot.claimedByMe && (
                      <Description>
                        Ocupada{slot.occupiedBy ? ` · ${slot.occupiedBy}` : ''}
                      </Description>
                    )}
                  </Radio>
                ))}
              </RadioGroup>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => refetchCounters()}
              >
                Actualizar disponibilidad
              </Button>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="primary"
                isDisabled={!claimSelection || claimMutation.isPending}
                onPress={() => {
                  setActionError(null)
                  claimMutation.mutate(Number(claimSelection))
                }}
              >
                {claimMutation.isPending ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  'Confirmar caja'
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  )
}
