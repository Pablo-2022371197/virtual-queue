import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
} from '@heroui/react'
import { AuthPageShell } from './AuthPageShell'
import { PrivacyConsentField } from './PrivacyConsentField'
import { PasswordField } from '../shared/components/PasswordField'
import { useAuth } from '../features/auth/useAuth'
import {
  toastFromError,
  toastSuccess,
  toastWarning,
} from '../shared/toast/appToast'
import type { UserRole } from '../shared/types/api'

const STAFF_KEY_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, status } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER')
  const [staffRegistrationKey, setStaffRegistrationKey] = useState('')
  const [acceptedPolicies, setAcceptedPolicies] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'authenticated' && !success) {
    navigate(role === 'STAFF' ? '/staff' : '/home', { replace: true })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!acceptedPolicies) {
      toastWarning('Debes aceptar la política de privacidad.')
      return
    }

    if (password.length < 8) {
      toastWarning('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      toastWarning('Las contraseñas no coinciden.')
      return
    }

    if (role === 'STAFF') {
      const key = staffRegistrationKey.trim().toUpperCase()
      if (!STAFF_KEY_PATTERN.test(key)) {
        toastWarning(
          'La clave de sucursal debe tener exactamente 8 caracteres alfanuméricos (sin 0, O, 1, I ni L).',
        )
        return
      }
    }

    setIsLoading(true)

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        role: role as UserRole,
        ...(role === 'STAFF'
          ? { staffRegistrationKey: staffRegistrationKey.trim().toUpperCase() }
          : {}),
      }
      await register(payload)
      setSuccess(true)
      toastSuccess('Cuenta creada correctamente. Redirigiendo…')
      window.setTimeout(() => {
        navigate(role === 'STAFF' ? '/staff' : '/home', { replace: true })
      }, 1200)
    } catch (err) {
      toastFromError(err, 'No se pudo completar el registro. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <Card>
        <Card.Header>
          <Card.Title className="text-base">Crear cuenta</Card.Title>
          <Card.Description>
            Regístrate para tomar turnos o unirte como personal de un establecimiento.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <form
            id="register-form"
            className="auth-form flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-foreground">Tipo de cuenta</legend>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={role === 'CUSTOMER' ? 'primary' : 'secondary'}
                  onPress={() => setRole('CUSTOMER')}
                >
                  Cliente
                </Button>
                <Button
                  type="button"
                  variant={role === 'STAFF' ? 'primary' : 'secondary'}
                  onPress={() => setRole('STAFF')}
                >
                  Personal
                </Button>
              </div>
            </fieldset>

            <TextField
              name="fullName"
              isRequired
              fullWidth
              value={fullName}
              onChange={setFullName}
            >
              <Label>Nombre completo</Label>
              <Input placeholder="María López" autoComplete="name" />
            </TextField>

            <TextField
              name="email"
              type="email"
              isRequired
              fullWidth
              value={email}
              onChange={setEmail}
            >
              <Label>Correo electrónico</Label>
              <Input placeholder="maria@correo.com" autoComplete="email" />
            </TextField>

            <TextField
              name="username"
              isRequired
              fullWidth
              value={username}
              onChange={setUsername}
            >
              <Label>Usuario</Label>
              <Input placeholder="maria.lopez" autoComplete="username" />
            </TextField>

            {role === 'STAFF' && (
              <TextField
                name="staffRegistrationKey"
                isRequired
                fullWidth
                value={staffRegistrationKey}
                onChange={(value) => setStaffRegistrationKey(value.toUpperCase())}
              >
                <Label>Clave de sucursal</Label>
                <Input
                  placeholder="8 caracteres"
                  autoComplete="off"
                  maxLength={8}
                />
              </TextField>
            )}

            <PasswordField
              label="Contraseña"
              name="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />

            <PasswordField
              label="Confirmar contraseña"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
            />

            <PrivacyConsentField
              isSelected={acceptedPolicies}
              onChange={setAcceptedPolicies}
            />
          </form>
        </Card.Content>

        <Card.Footer className="flex-col gap-3">
          <Button
            type="submit"
            form="register-form"
            variant="primary"
            fullWidth
            isDisabled={isLoading || success}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="current" />
                Registrando…
              </>
            ) : (
              'Crear cuenta'
            )}
          </Button>

          <p className="text-center text-sm text-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Inicia sesión
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </AuthPageShell>
  )
}
