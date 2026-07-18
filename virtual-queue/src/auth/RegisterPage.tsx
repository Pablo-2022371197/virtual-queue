import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
} from '@heroui/react'
import { AuthPageShell } from './AuthPageShell'
import { PrivacyConsentField } from './PrivacyConsentField'
import { AuthError, register } from '../lib/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedPolicies, setAcceptedPolicies] = useState(false)
  const [showConsentError, setShowConsentError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setShowConsentError(false)

    if (!acceptedPolicies) {
      setShowConsentError(true)
      return
    }

    setIsLoading(true)

    try {
      await register({
        fullName,
        email,
        username,
        password,
        confirmPassword,
        acceptedPolicies,
      })
      setSuccess(true)
      window.setTimeout(() => {
        navigate('/home', { replace: true })
      }, 1200)
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : 'No se pudo completar el registro. Intenta de nuevo.'
      setError(message)
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
            Registro simulado para el proyecto académico. Acepta las políticas
            para continuar.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          {error && <Alert status="danger">{error}</Alert>}
          {success && (
            <Alert status="success">
              Cuenta creada correctamente. Redirigiendo al panel…
            </Alert>
          )}

          <form
            id="register-form"
            className="auth-form flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
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

            <TextField
              name="password"
              type="password"
              isRequired
              fullWidth
              value={password}
              onChange={setPassword}
            >
              <Label>Contraseña</Label>
              <Input placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
            </TextField>

            <TextField
              name="confirmPassword"
              type="password"
              isRequired
              fullWidth
              value={confirmPassword}
              onChange={setConfirmPassword}
            >
              <Label>Confirmar contraseña</Label>
              <Input placeholder="Repite tu contraseña" autoComplete="new-password" />
            </TextField>

            <PrivacyConsentField
              isSelected={acceptedPolicies}
              onChange={(value) => {
                setAcceptedPolicies(value)
                if (value) setShowConsentError(false)
              }}
              isInvalid={showConsentError}
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
