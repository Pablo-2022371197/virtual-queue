import 'package:virtual_queue_core/virtual_queue_core.dart';

/// Validación de usuario/correo en login (extraída para pruebas White Box).
String? validateLoginUsername(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'El usuario es obligatorio';
  }
  return null;
}

/// Validación de contraseña en login (extraída para pruebas White Box).
String? validateLoginPassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'La contraseña es obligatoria';
  }
  return null;
}

/// La app de teléfono solo admite rol CUSTOMER tras autenticar.
bool canUsePhoneApp(UserRole? role) => role == UserRole.customer;
