import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import {
  Alert,
  Button,
  Card,
  Input,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from '@heroui/react'
import { AuthPageShell } from './AuthPageShell'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../shared/api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'authenticated') {
    navigate('/home', { replace: true })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ username: username.trim(), password })
      navigate('/home', { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError
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
              <Label>Usuario o correo</Label>
              <Input
                placeholder="admin o admin@virtualqueue.local"
                autoComplete="username"
              />
            </TextField>

            <TextField
              name="password"
              isRequired
              fullWidth
              value={password}
              onChange={setPassword}
            >
              <Label>Contraseña</Label>
              <InputGroup fullWidth>
                <InputGroup.Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                <InputGroup.Suffix>
                  <Button
                    type="button"
                    variant="ghost"
                    isIconOnly
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
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
