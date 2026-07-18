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
import { AuthError, login } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(username.trim(), password)
      navigate('/home', { replace: true })
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : 'No se pudo iniciar sesión. Intenta de nuevo.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <Card>
        <Card.Header>
          <Card.Title className="text-base">Iniciar sesión</Card.Title>
          <Card.Description>
            Accede con tu cuenta para continuar.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          {error && <Alert status="danger">{error}</Alert>}

          <form
            id="login-form"
            className="auth-form flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <TextField
              name="username"
              isRequired
              fullWidth
              value={username}
              onChange={setUsername}
            >
              <Label>Usuario</Label>
              <Input placeholder="admin" autoComplete="username" />
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
              <Input placeholder="••••••" autoComplete="current-password" />
            </TextField>
          </form>
        </Card.Content>

        <Card.Footer className="flex-col gap-3">
          <Button
            type="submit"
            form="login-form"
            variant="primary"
            fullWidth
            isDisabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="current" />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <p className="text-center text-xs text-muted">
            Demo: usuario{' '}
            <span className="font-semibold text-foreground">admin</span>
            {' / '}contraseña{' '}
            <span className="font-semibold text-foreground">admin</span>
          </p>

          <p className="text-center text-sm text-muted">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-accent hover:underline">
              Regístrate
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </AuthPageShell>
  )
}
