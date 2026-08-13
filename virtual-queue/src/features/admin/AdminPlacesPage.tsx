import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  Spinner,
  Table,
  TextField,
} from '@heroui/react'
import { Eye, KeyRound, Pencil, Plus, Power } from 'lucide-react'
import { useAdminPlaces } from '../../hooks/useAdminPlaces'
import {
  createPlace,
  rotateStaffRegistrationKey,
  updatePlace,
  updatePlaceStatus,
  type StaffRegistrationKeyResponse,
} from '../../shared/api/places'
import { useToastOnError } from '../../shared/hooks/useToastOnError'
import { toastFromError } from '../../shared/toast/appToast'
import type { CounterLabelMode, Place } from '../../shared/types/api'

type StatusFilter = 'all' | 'active' | 'inactive'
type PlaceFormMode = 'create' | 'edit' | null

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'inactive', label: 'Inactivos' },
]

const LABEL_MODE_OPTIONS: { id: CounterLabelMode; label: string }[] = [
  { id: 'LETTERS', label: 'Letras (A, B, C…)' },
  { id: 'NUMBERS', label: 'Números (1, 2, 3…)' },
]

function PlaceFormFields({
  name,
  address,
  category,
  description,
  totalCounters,
  counterLabelMode,
  onNameChange,
  onAddressChange,
  onCategoryChange,
  onDescriptionChange,
  onTotalCountersChange,
  onCounterLabelModeChange,
}: {
  name: string
  address: string
  category: string
  description: string
  totalCounters: string
  counterLabelMode: CounterLabelMode
  onNameChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onTotalCountersChange: (value: string) => void
  onCounterLabelModeChange: (value: CounterLabelMode) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField name="name" isRequired className="w-full" value={name} onChange={onNameChange}>
        <Label>Nombre</Label>
        <Input placeholder="Nombre del establecimiento" />
      </TextField>
      <TextField name="address" className="w-full" value={address} onChange={onAddressChange}>
        <Label>Dirección</Label>
        <Input placeholder="Dirección" />
      </TextField>
      <TextField name="category" className="w-full" value={category} onChange={onCategoryChange}>
        <Label>Categoría</Label>
        <Input placeholder="Salud, Finanzas…" />
      </TextField>
      <TextField name="description" className="w-full" value={description} onChange={onDescriptionChange}>
        <Label>Descripción</Label>
        <Input placeholder="Descripción breve" />
      </TextField>
      <TextField
        name="totalCounters"
        isRequired
        className="w-full"
        value={totalCounters}
        onChange={onTotalCountersChange}
      >
        <Label>Cantidad de cajas</Label>
        <Input type="number" min={1} placeholder="1" />
      </TextField>
      <Select
        className="w-full sm:col-span-2"
        selectedKey={counterLabelMode}
        onSelectionChange={(key) => onCounterLabelModeChange(key as CounterLabelMode)}
      >
        <Label>Etiquetas de caja</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {LABEL_MODE_OPTIONS.map((option) => (
              <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  )
}

export default function AdminPlacesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const activeParam =
    statusFilter === 'all' ? undefined : statusFilter === 'active'

  const { data: placesPage, isLoading, isError, error } = useAdminPlaces({
    query: searchQuery.trim() || undefined,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    active: activeParam,
    size: 100,
  })

  useToastOnError(isError, error, {
    fallback: 'No se pudieron cargar los establecimientos.',
  })

  const places = placesPage?.content ?? []

  const categories = useMemo(() => {
    const values = new Set<string>()
    for (const place of places) {
      if (place.category?.trim()) values.add(place.category.trim())
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [places])

  const [formMode, setFormMode] = useState<PlaceFormMode>(null)
  const [editing, setEditing] = useState<Place | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [totalCounters, setTotalCounters] = useState('1')
  const [counterLabelMode, setCounterLabelMode] = useState<CounterLabelMode>('LETTERS')
  const [confirmRotatePlace, setConfirmRotatePlace] = useState<Place | null>(null)
  const [generatedKey, setGeneratedKey] = useState<StaffRegistrationKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['places'] })

  const createMutation = useMutation({
    mutationFn: () =>
      createPlace({
        name,
        address,
        category,
        description,
        totalCounters: Math.max(Number(totalCounters) || 1, 1),
        counterLabelMode,
      }),
    onSuccess: () => {
      invalidate()
      closeFormModal()
    },
    onError: (err) => toastFromError(err, 'Error al crear'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePlace(editing!.id, {
        name,
        address,
        category,
        description,
        totalCounters: Math.max(Number(totalCounters) || 1, 1),
        counterLabelMode,
      }),
    onSuccess: () => {
      invalidate()
      closeFormModal()
    },
    onError: (err) => toastFromError(err, 'Error al actualizar'),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePlaceStatus(id, active),
    onSuccess: invalidate,
    onError: (err) => toastFromError(err, 'No se pudo cambiar el estado'),
  })

  const rotateKeyMutation = useMutation({
    mutationFn: (placeId: string) => rotateStaffRegistrationKey(placeId),
    onSuccess: (response) => {
      setConfirmRotatePlace(null)
      setGeneratedKey(response)
      setCopied(false)
    },
    onError: (err) => toastFromError(err, 'No se pudo generar la clave'),
  })

  function openCreateModal() {
    setEditing(null)
    setName('')
    setAddress('')
    setCategory('')
    setDescription('')
    setTotalCounters('1')
    setCounterLabelMode('LETTERS')
    setFormMode('create')
  }

  function openEditModal(place: Place) {
    setEditing(place)
    setName(place.name)
    setAddress(place.address ?? '')
    setCategory(place.category ?? '')
    setDescription(place.description ?? '')
    setTotalCounters(String(place.totalCounters ?? 1))
    setCounterLabelMode(place.counterLabelMode ?? 'LETTERS')
    setFormMode('edit')
  }

  function closeFormModal() {
    setFormMode(null)
    setEditing(null)
    setName('')
    setAddress('')
    setCategory('')
    setDescription('')
    setTotalCounters('1')
    setCounterLabelMode('LETTERS')
  }

  async function copyKey() {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey.staffRegistrationKey)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="admin-places-title" className="text-xl font-semibold tracking-tight text-foreground">
            Establecimientos
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Administra sucursales, claves de personal y accede a la fila de cada una.
          </p>
        </div>
        <Button variant="primary" onPress={openCreateModal}>
          <Plus size={16} />
          Nuevo establecimiento
        </Button>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-end">
        <SearchField
          name="placeSearch"
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
        >
          <Label>Buscar</Label>
          <SearchField.Group className="w-full">
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Nombre o dirección…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Select
          className="w-full lg:w-48"
          selectedKey={statusFilter}
          onSelectionChange={(key) => setStatusFilter(key as StatusFilter)}
        >
          <Label>Estado</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUS_OPTIONS.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full lg:w-48"
          selectedKey={categoryFilter}
          onSelectionChange={(key) => setCategoryFilter(String(key))}
        >
          <Label>Categoría</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="Todas">
                Todas
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {categories.map((category) => (
                <ListBox.Item key={category} id={category} textValue={category}>
                  {category}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-14">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando establecimientos…</span>
        </div>
      ) : (
        <Table aria-labelledby="admin-places-title">
          <Table.ScrollContainer>
            <Table.Content aria-label="Listado de establecimientos" className="min-w-[760px]">
              <Table.Header>
                <Table.Column isRowHeader>Nombre</Table.Column>
                <Table.Column>Dirección</Table.Column>
                <Table.Column>Categoría</Table.Column>
                <Table.Column>Cajas</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column>Acciones</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <div className="py-10 text-center text-sm text-muted">
                    No hay establecimientos que coincidan con los filtros.
                  </div>
                )}
              >
                {places.map((place) => (
                  <Table.Row key={place.id}>
                    <Table.Cell>
                      <div className="font-medium text-foreground">{place.name}</div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-muted">{place.address || '—'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {place.category ? (
                        <Chip size="sm" variant="soft" color="accent">
                          {place.category}
                        </Chip>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-foreground">
                        {place.totalCounters ?? 1}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={place.active ? 'success' : 'danger'}
                      >
                        {place.active ? 'Activo' : 'Inactivo'}
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1.5">
                        <Link to={`/place/${place.id}/queue`}>
                          <Button size="sm" variant="secondary">
                            <Eye size={14} />
                            Ver fila
                          </Button>
                        </Link>
                        <Button size="sm" variant="secondary" onPress={() => openEditModal(place)}>
                          <Pencil size={14} />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={place.active ? 'danger' : 'primary'}
                          onPress={() =>
                            toggleStatus.mutate({ id: place.id, active: !place.active })
                          }
                          isDisabled={toggleStatus.isPending}
                        >
                          <Power size={14} />
                          {place.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => setConfirmRotatePlace(place)}
                        >
                          <KeyRound size={14} />
                          Clave
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      <Modal.Backdrop isOpen={formMode != null} onOpenChange={(open) => !open && closeFormModal()}>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {formMode === 'edit' ? 'Editar establecimiento' : 'Nuevo establecimiento'}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <PlaceFormFields
                name={name}
                address={address}
                category={category}
                description={description}
                totalCounters={totalCounters}
                counterLabelMode={counterLabelMode}
                onNameChange={setName}
                onAddressChange={setAddress}
                onCategoryChange={setCategory}
                onDescriptionChange={setDescription}
                onTotalCountersChange={setTotalCounters}
                onCounterLabelModeChange={setCounterLabelMode}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={closeFormModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                isDisabled={!name.trim() || Number(totalCounters) < 1 || isSaving}
                onPress={() =>
                  formMode === 'edit' ? updateMutation.mutate() : createMutation.mutate()
                }
              >
                {isSaving ? (
                  <Spinner size="sm" color="current" />
                ) : formMode === 'edit' ? (
                  'Guardar cambios'
                ) : (
                  'Crear establecimiento'
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={confirmRotatePlace != null}
        onOpenChange={() => setConfirmRotatePlace(null)}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Rotar clave de personal</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Se generará una nueva clave de 8 caracteres para{' '}
                <strong>{confirmRotatePlace?.name}</strong>. La clave anterior dejará de
                funcionar de inmediato.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => setConfirmRotatePlace(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                isDisabled={rotateKeyMutation.isPending}
                onPress={() =>
                  confirmRotatePlace && rotateKeyMutation.mutate(confirmRotatePlace.id)
                }
              >
                {rotateKeyMutation.isPending ? (
                  <Spinner size="sm" color="current" />
                ) : (
                  'Generar clave'
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={generatedKey != null}
        onOpenChange={() => setGeneratedKey(null)}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Clave generada</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <Alert status="warning">
                Esta clave solo se muestra una vez. Compártela de forma segura con el personal
                de {generatedKey?.placeName}.
              </Alert>
              <p className="rounded-lg bg-surface-secondary px-3 py-2 text-center font-mono text-xl tracking-widest text-foreground">
                {generatedKey?.staffRegistrationKey}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={copyKey}>
                {copied ? 'Copiada' : 'Copiar'}
              </Button>
              <Button variant="primary" onPress={() => setGeneratedKey(null)}>
                Listo
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  )
}
