import type { ProblemDetail } from '../types/api'

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa los datos ingresados.',
  RESOURCE_NOT_FOUND: 'El recurso solicitado no existe.',
  UNAUTHORIZED: 'Credenciales inválidas.',
  FORBIDDEN: 'No tienes permiso para esta acción.',
  CONFLICT: 'La operación no se pudo completar.',
  DUPLICATE_EMAIL: 'Este correo ya está registrado.',
  DUPLICATE_USERNAME: 'Este nombre de usuario ya existe.',
  ACTIVE_TICKET_EXISTS: 'Ya tienes un turno activo. Cancélalo antes de tomar otro.',
  QUEUE_ALREADY_JOINED:
    'Ya tienes un turno activo en este establecimiento. Cancélalo antes de tomar otro.',
  INVALID_TICKET_TRANSITION: 'No se puede cambiar el estado del turno.',
  STAFF_BUSY: 'Completa u omite el turno actual antes de llamar al siguiente.',
  TICKET_OWNED_BY_OTHER_COUNTER: 'Este turno pertenece a otra caja.',
  COUNTER_CLAIM_REQUIRED: 'Reclama una caja antes de operar la fila.',
  QUEUE_NOT_ACTIVE: 'La fila no está activa en este momento.',
  PLACE_NOT_ACTIVE: 'El establecimiento no está activo.',
  REFRESH_TOKEN_INVALID: 'Tu sesión expiró. Inicia sesión de nuevo.',
  REFRESH_TOKEN_REUSED: 'Sesión inválida. Inicia sesión de nuevo.',
  INTERNAL_ERROR: 'Error interno del servidor. Intenta más tarde.',
}

export async function parseProblemDetail(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    return { status: response.status, detail: response.statusText }
  }
}

export function getErrorMessage(problem: ProblemDetail): string {
  if (problem.code && ERROR_MESSAGES[problem.code]) {
    return ERROR_MESSAGES[problem.code]
  }
  return problem.detail ?? problem.title ?? 'Ocurrió un error inesperado.'
}
