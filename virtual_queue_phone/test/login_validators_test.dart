import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';
import 'package:virtual_queue_phone/features/auth/login_validators.dart';

void main() {
  group('validateLoginUsername', () {
    test('null returns error', () {
      expect(validateLoginUsername(null), 'El usuario es obligatorio');
    });

    test('empty or whitespace returns error', () {
      expect(validateLoginUsername(''), 'El usuario es obligatorio');
      expect(validateLoginUsername('   '), 'El usuario es obligatorio');
    });

    test('non-empty after trim is valid', () {
      expect(validateLoginUsername('customer'), isNull);
      expect(validateLoginUsername('  customer  '), isNull);
    });
  });

  group('validateLoginPassword', () {
    test('null or empty returns error', () {
      expect(validateLoginPassword(null), 'La contraseña es obligatoria');
      expect(validateLoginPassword(''), 'La contraseña es obligatoria');
    });

    test('any non-empty password is valid', () {
      expect(validateLoginPassword('demo123'), isNull);
      expect(validateLoginPassword(' '), isNull);
    });
  });

  group('canUsePhoneApp', () {
    test('only CUSTOMER allowed', () {
      expect(canUsePhoneApp(UserRole.customer), isTrue);
      expect(canUsePhoneApp(UserRole.staff), isFalse);
      expect(canUsePhoneApp(UserRole.admin), isFalse);
      expect(canUsePhoneApp(null), isFalse);
    });
  });
}
