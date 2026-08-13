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
  callNextTicket,
  claimStaffCounter,
  completeTicket,
  expireTicket,
  getLastDismissedTicket,
  getStaffActiveTicket,
  getStaffCounters,
  getStaffPlace,
  listQueueTickets,
} from '../../shared/api/staff'
import { TicketStatusChip } from '../tickets/TicketStatusChip'
import { useAuth } from '../auth/useAuth'
import { useToastOnError } from '../../shared/hooks/useToastOnError'
import { toastFromError } from '../../shared/toast/appToast'
import { counterLabel } from '../../shared/format/counterLabel'
import type { CounterLabelMode, Ticket, TicketStatus } from '../../shared/types/api'

const STATUS_FILTERS: TicketStatus[] = ['WAITING', 'SERVING']

const STATUS_FILTER_LABELS: Record<TicketStatus, string> = {
  WAITING: 'En espera',
  NEARLY: 'Próximo',
  CALLED: 'Llamado',
  SERVING: 'En atención',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Ausente',
}

function isActiveStaffTicket(ticket: Ticket | null | undefined): ticket is Ticket {
  return (
    ticket != null &&
    (ticket.status === 'CALLED' || ticket.status === 'SERVING')
  )
}

function ticketBelongsToMyCounter(
  ticket: Ticket,
  claimedCounter: number | null | undefined,
  isStaffUser: boolean,
): boolean {
  if (!isStaffUser || claimedCounter == null) return true
  if (ticket.counterNumber == null) return true
  return ticket.counterNumber === claimedCounter
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
  const [statusFilter, setStatusFilter] = useState<TicketStatus>('WAITING')
  const [claimSelection, setClaimSelection] = useState<string>('')
  const [claimOpen, setClaimOpen] = useState(false)
  const activePlaceId = isAdmin
    ? (selectedPlaceId ?? places[0]?.id)
    : staffPlace?.id

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['places', activePlaceId, 'queue'],
    queryFn: () => getPlaceQueue(activePlaceId!),
    enabled: !!activePlaceId,
  })

  const labelMode: CounterLabelMode =
    queue?.counterLabelMode ?? staffPlace?.counterLabelMode ?? 'LETTERS'

  const {
    data: counterState,
    isLoading: countersLoading,
    isError: countersError,
    error: countersQueryError,
    refetch: refetchCounters,
  } = useQuery({
    queryKey: ['staff', 'counters'],
    queryFn: getStaffCounters,
    enabled: isStaff,
    refetchInterval: claimOpen ? 3_000 : 15_000,
    retry: 1,
  })

  useToastOnError(countersError, countersQueryError, {
    title: 'No se pudo cargar la disponibilidad de cajas',
    fallback: 'Reinicia el backend para aplicar la migración V6.',
    onRetry: () => refetchCounters(),
  })

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
            toastFromError(err, 'No se pudo asignar la caja'),
          )
        return
      }
    }

    setClaimOpen(true)

    const selectedStillFree =
      claimSelection !== '' &&
      counterState.counters.some(
        (c) => String(c.number) === claimSelection && (!c.occupied || c.claimedByMe),
      )
    if (!selectedStillFree) {
      const firstFree = counterState.counters.find((c) => !c.occupied)?.number
      setClaimSelection(firstFree != null ? String(firstFree) : '')
    }
  }, [counterState, isStaff, queryClient, claimSelection])

  const queueReady = !!queue?.id && (!isStaff || !needsClaim)

  const { data: activeTicket = null } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, 'active-ticket'],
    queryFn: () => getStaffActiveTicket(queue!.id),
    enabled: queueReady && isStaff,
    refetchInterval: 5_000,
  })

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, statusFilter],
    queryFn: async () => {
      if (statusFilter === 'WAITING') {
        const [waiting, nearly] = await Promise.all([
          listQueueTickets(queue!.id, 'WAITING'),
          listQueueTickets(queue!.id, 'NEARLY'),
        ])
        return [...waiting, ...nearly].sort((a, b) => a.position - b.position)
      }
      return listQueueTickets(queue!.id, statusFilter)
    },
    enabled: queueReady,
    refetchInterval: 10_000,
  })

  const { data: lastDismissed = null } = useQuery({
    queryKey: ['staff', 'queue', queue?.id, 'last-dismissed'],
    queryFn: () => getLastDismissedTicket(queue!.id),
    enabled: queueReady,
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
    onError: (err) => toastFromError(err, 'No se pudo reclamar la caja'),
  })

  const callNext = useMutation({
    mutationFn: () => callNextTicket(queue!.id),
    onSuccess: invalidate,
    onError: (err) => toastFromError(err, 'Error al llamar turno'),
  })

  const complete = useMutation({
    mutationFn: (id: string) => completeTicket(id),
    onSuccess: invalidate,
    onError: (err) => toastFromError(err, 'Error al completar'),
  })

  const expire = useMutation({
    mutationFn: (id: string) => expireTicket(id),
    onSuccess: invalidate,
    onError: (err) => toastFromError(err, 'Error al omitir turno'),
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
      ? counterLabel(counterState.claimedCounter, labelMode)
      : null)

  const hasActiveTicket = isActiveStaffTicket(activeTicket)
  const listTickets = hasActiveTicket
    ? tickets.filter((ticket) => ticket.id !== activeTicket.id)
    : tickets

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

      {hasActiveTicket && (
        <Card className="border-2 border-accent bg-accent/5">
          <Card.Header>
            <Card.Title className="text-lg">Turno en atención</Card.Title>
            <Card.Description>
              Caja{' '}
              {activeTicket.counterLabel ??
                counterLabel(activeTicket.counterNumber, labelMode)}
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col items-center gap-2 py-4">
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {activeTicket.number}
            </p>
            <TicketStatusChip status={activeTicket.status} />
          </Card.Content>
          <Card.Footer className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onPress={() => complete.mutate(activeTicket.id)}
              isDisabled={complete.isPending}
            >
              {complete.isPending ? <Spinner size="sm" color="current" /> : 'Completar'}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onPress={() => expire.mutate(activeTicket.id)}
              isDisabled={expire.isPending}
            >
              {expire.isPending ? <Spinner size="sm" color="current" /> : 'Omitir'}
            </Button>
          </Card.Footer>
        </Card>
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
              onPress={() => callNext.mutate()}
              isDisabled={
                callNext.isPending ||
                (isStaff && needsClaim) ||
                (isStaff && hasActiveTicket)
              }
            >
              {callNext.isPending ? <Spinner size="sm" color="current" /> : 'Llamar siguiente turno'}
            </Button>
          </Card.Footer>
        </Card>
      )}

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
        {listTickets.map((ticket) => {
          const canOperate = ticketBelongsToMyCounter(
            ticket,
            counterState?.claimedCounter,
            isStaff,
          )
          return (
            <Card key={ticket.id}>
              <Card.Content className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{ticket.number}</p>
                  <p className="text-xs text-muted">Posición {ticket.position}</p>
                  {(ticket.counterLabel || ticket.counterNumber != null) && (
                    <Chip size="sm" variant="soft" color="accent" className="mt-1">
                      Caja{' '}
                      {ticket.counterLabel ??
                        counterLabel(ticket.counterNumber, labelMode)}
                    </Chip>
                  )}
                </div>
                {(statusFilter !== 'WAITING' || ticket.status === 'NEARLY') && (
                  <TicketStatusChip status={ticket.status} />
                )}
                {canOperate && ticket.status === 'SERVING' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => complete.mutate(ticket.id)}
                      isDisabled={complete.isPending || (isStaff && needsClaim)}
                    >
                      Completar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onPress={() => expire.mutate(ticket.id)}
                      isDisabled={expire.isPending || (isStaff && needsClaim)}
                    >
                      Omitir
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>
          )
        })}
        {!ticketsLoading && !needsClaim && listTickets.length === 0 && (
          <Alert status="accent">
            No hay turnos con estado {STATUS_FILTER_LABELS[statusFilter]}.
          </Alert>
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
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="primary"
                isDisabled={!claimSelection || claimMutation.isPending}
                onPress={() => claimMutation.mutate(Number(claimSelection))}
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
