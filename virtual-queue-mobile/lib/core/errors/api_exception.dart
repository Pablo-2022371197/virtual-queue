class ApiException implements Exception {
  const ApiException({
    required this.message,
    this.statusCode,
    this.code,
    this.isNetworkError = false,
  });

  final String message;
  final int? statusCode;
  final String? code;
  final bool isNetworkError;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;

  @override
  String toString() => message;
}

String messageForCode(String? code) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Revisa los datos ingresados.';
    case 'ACTIVE_TICKET_EXISTS':
      return 'Ya tienes un turno activo. Cancélalo antes de tomar otro.';
    case 'QUEUE_ALREADY_JOINED':
      return 'Ya tienes un turno activo en este establecimiento. Cancélalo antes de tomar otro.';
    case 'DUPLICATE_EMAIL':
      return 'El correo ya está registrado.';
    case 'DUPLICATE_USERNAME':
      return 'El usuario ya existe.';
    case 'INVALID_STAFF_REGISTRATION_KEY':
      return 'Clave de sucursal inválida.';
    case 'STAFF_REGISTRATION_KEY_REQUIRED':
      return 'Se requiere la clave de sucursal.';
    case 'COUNTER_ALREADY_CLAIMED':
      return 'Esa caja ya está ocupada por otro miembro del personal.';
    case 'COUNTER_CLAIM_REQUIRED':
      return 'Selecciona tu caja antes de operar la fila.';
    case 'REFRESH_TOKEN_INVALID':
    case 'REFRESH_TOKEN_REUSED':
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}
