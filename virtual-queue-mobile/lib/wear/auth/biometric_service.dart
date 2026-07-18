import 'package:local_auth/local_auth.dart';

class BiometricService {
  BiometricService._();
  static final LocalAuthentication _auth = LocalAuthentication();

  static Future<bool> isAvailable() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> authenticate() async {
    try {
      return await _auth.authenticate(
        localizedReason: 'Autentícate para acceder a tu turno',
      );
    } catch (_) {
      return false;
    }
  }
}
