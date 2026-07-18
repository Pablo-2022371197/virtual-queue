const TOKEN_KEY = 'jwt'
const USER_KEY = 'vq_user'

// Credenciales estáticas temporales mientras el backend de autenticación se implementa.
const STATIC_USERNAME = 'admin'
const STATIC_PASSWORD = 'admin'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function login(
  username: string,
  password: string,
): Promise<string> {
  if (username !== STATIC_USERNAME || password !== STATIC_PASSWORD) {
    throw new AuthError('Usuario o contraseña incorrectos.')
  }

  return persistSession(username)
}

export interface RegisterInput {
  fullName: string
  email: string
  username: string
  password: string
  confirmPassword: string
  acceptedPolicies: boolean
}

export async function register(input: RegisterInput): Promise<string> {
  const username = input.username.trim()
  const email = input.email.trim()
  const fullName = input.fullName.trim()

  if (!fullName || !email || !username) {
    throw new AuthError('Completa todos los campos obligatorios.')
  }

  if (!input.acceptedPolicies) {
    throw new AuthError('Debes aceptar la política de privacidad y los términos de uso.')
  }

  if (input.password.length < 6) {
    throw new AuthError('La contraseña debe tener al menos 6 caracteres.')
  }

  if (input.password !== input.confirmPassword) {
    throw new AuthError('Las contraseñas no coinciden.')
  }

  return persistSession(username)
}

function persistSession(username: string): string {
  const token = `static.${btoa(`${username}:${Date.now()}`)}`
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, username)
  return token
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
