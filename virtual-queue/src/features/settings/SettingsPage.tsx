import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Input, Label, Spinner, TextField } from '@heroui/react'
import { PasswordField } from '../../shared/components/PasswordField'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../../shared/api/client'
import { apiChangePassword, apiPatchProfile } from '../../shared/api/auth'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setUsername(user.username)
    }
  }, [user])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setProfileLoading(true)

    try {
      await apiPatchProfile({
        fullName: fullName.trim(),
        username: username.trim(),
      })
      await refreshUser()
      setProfileSuccess('Perfil actualizado correctamente.')
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil.',
      )
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setPasswordLoading(true)
    try {
      await apiChangePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Contraseña actualizada correctamente.')
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.',
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mi cuenta
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Actualiza tu nombre de usuario, nombre completo o contraseña.
        </p>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>Datos de perfil</Card.Title>
          <Card.Description>Información visible en tu sesión.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {profileError && <Alert status="danger">{profileError}</Alert>}
          {profileSuccess && <Alert status="success">{profileSuccess}</Alert>}
          <form id="profile-form" className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
            <TextField
              name="fullName"
              isRequired
              fullWidth
              value={fullName}
              onChange={setFullName}
            >
              <Label>Nombre completo</Label>
              <Input autoComplete="name" />
            </TextField>
            <TextField
              name="username"
              isRequired
              fullWidth
              value={username}
              onChange={setUsername}
            >
              <Label>Usuario</Label>
              <Input autoComplete="username" />
            </TextField>
          </form>
        </Card.Content>
        <Card.Footer>
          <Button
            type="submit"
            form="profile-form"
            variant="primary"
            fullWidth
            isDisabled={profileLoading}
          >
            {profileLoading ? <Spinner size="sm" color="current" /> : 'Guardar perfil'}
          </Button>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Cambiar contraseña</Card.Title>
          <Card.Description>Usa al menos 8 caracteres.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {passwordError && <Alert status="danger">{passwordError}</Alert>}
          {passwordSuccess && <Alert status="success">{passwordSuccess}</Alert>}
          <form id="password-form" className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
            <PasswordField
              label="Contraseña actual"
              name="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              label="Nueva contraseña"
              name="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
            <PasswordField
              label="Confirmar contraseña"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </form>
        </Card.Content>
        <Card.Footer>
          <Button
            type="submit"
            form="password-form"
            variant="secondary"
            fullWidth
            isDisabled={passwordLoading}
          >
            {passwordLoading ? <Spinner size="sm" color="current" /> : 'Cambiar contraseña'}
          </Button>
        </Card.Footer>
      </Card>
    </section>
  )
}
