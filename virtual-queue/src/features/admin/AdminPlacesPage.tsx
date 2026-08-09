import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { usePlaces } from '../../hooks/usePlaces'
import {
  createPlace,
  rotateStaffRegistrationKey,
  updatePlace,
  updatePlaceStatus,
  type StaffRegistrationKeyResponse,
} from '../../shared/api/places'
import { ApiError } from '../../shared/api/client'
import type { Place } from '../../shared/types/api'

export default function AdminPlacesPage() {
  const queryClient = useQueryClient()
  const { data: placesPage, isLoading } = usePlaces({ size: 100 })
  const places = placesPage?.content ?? []

  const [editing, setEditing] = useState<Place | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmRotatePlace, setConfirmRotatePlace] = useState<Place | null>(null)
  const [generatedKey, setGeneratedKey] = useState<StaffRegistrationKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['places'] })

  const createMutation = useMutation({
    mutationFn: () => createPlace({ name, address, category, description }),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al crear'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePlace(editing!.id, { name, address, category, description }),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al actualizar'),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePlaceStatus(id, active),
    onSuccess: invalidate,
  })

  const rotateKeyMutation = useMutation({
    mutationFn: (placeId: string) => rotateStaffRegistrationKey(placeId),
    onSuccess: (response) => {
      setConfirmRotatePlace(null)
      setGeneratedKey(response)
      setCopied(false)
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'No se pudo generar la clave'),
  })

  function resetForm() {
    setEditing(null)
    setName('')
    setAddress('')
    setCategory('')
    setDescription('')
    setError(null)
  }

  function startEdit(place: Place) {
    setEditing(place)
    setName(place.name)
    setAddress(place.address ?? '')
    setCategory(place.category ?? '')
    setDescription(place.description ?? '')
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
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Administrar establecimientos
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Crea, edita y activa o desactiva establecimientos. Genera claves de registro para el personal.
        </p>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>{editing ? 'Editar establecimiento' : 'Nuevo establecimiento'}</Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" isRequired fullWidth value={name} onChange={setName}>
            <Label>Nombre</Label>
            <Input placeholder="Nombre del establecimiento" />
          </TextField>
          <TextField name="address" fullWidth value={address} onChange={setAddress}>
            <Label>Dirección</Label>
            <Input placeholder="Dirección" />
          </TextField>
          <TextField name="category" fullWidth value={category} onChange={setCategory}>
            <Label>Categoría</Label>
            <Input placeholder="Salud, Finanzas…" />
          </TextField>
          <TextField name="description" fullWidth value={description} onChange={setDescription}>
            <Label>Descripción</Label>
            <Input placeholder="Descripción breve" />
          </TextField>
        </Card.Content>
        <Card.Footer className="gap-2">
          <Button
            variant="primary"
            onPress={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
            isDisabled={!name.trim() || isSaving}
          >
            {isSaving ? <Spinner size="sm" color="current" /> : editing ? 'Guardar cambios' : 'Crear'}
          </Button>
          {editing && (
            <Button variant="tertiary" onPress={resetForm}>
              Cancelar
            </Button>
          )}
        </Card.Footer>
      </Card>

      {error && <Alert status="danger">{error}</Alert>}

      {isLoading && <Spinner size="sm" />}

      <div className="grid gap-3">
        {places.map((place) => (
          <Card key={place.id}>
            <Card.Content className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div>
                <p className="font-semibold text-foreground">{place.name}</p>
                <p className="text-xs text-muted">{place.address}</p>
              </div>
              <Chip
                size="sm"
                variant="soft"
                color={place.active ? 'success' : 'danger'}
              >
                {place.active ? 'Activo' : 'Inactivo'}
              </Chip>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onPress={() => startEdit(place)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setError(null)
                    setConfirmRotatePlace(place)
                  }}
                >
                  Generar/rotar clave
                </Button>
                <Button
                  size="sm"
                  variant={place.active ? 'danger' : 'primary'}
                  onPress={() =>
                    toggleStatus.mutate({ id: place.id, active: !place.active })
                  }
                >
                  {place.active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

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
