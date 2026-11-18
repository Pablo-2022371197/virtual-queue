import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/models/user_summary.dart';
import 'package:virtual_queue_core/storage/token_storage.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('TokenStorage', () {
    test('saveSession round-trip reads tokens and user', () async {
      final storage = TokenStorage();
      const user = UserSummary(
        id: 'u1',
        username: 'customer',
        fullName: 'Cliente',
        role: UserRole.customer,
      );
      await storage.saveSession(
        accessToken: 'access-abc',
        refreshToken: 'refresh-xyz',
        user: user,
      );

      expect(await storage.readAccessToken(), 'access-abc');
      expect(await storage.readRefreshToken(), 'refresh-xyz');
      expect(await storage.hasRefreshToken(), isTrue);
      final readUser = await storage.readUser();
      expect(readUser?.username, 'customer');
      expect(readUser?.role, UserRole.customer);
    });

    test('readUser returns null when storage empty', () async {
      final storage = TokenStorage();
      expect(await storage.readUser(), isNull);
      expect(await storage.hasRefreshToken(), isFalse);
    });

    test('readUser returns null on corrupt JSON', () async {
      FlutterSecureStorage.setMockInitialValues({
        'user_summary': '{not-json',
      });
      final storage = TokenStorage();
      expect(await storage.readUser(), isNull);
    });

    test('clearSession removes all keys', () async {
      final storage = TokenStorage();
      await storage.saveSession(
        accessToken: 'a',
        refreshToken: 'r',
        user: const UserSummary(
          id: 'u1',
          username: 'x',
          fullName: 'X',
          role: UserRole.customer,
        ),
      );
      await storage.clearSession();
      expect(await storage.readAccessToken(), isNull);
      expect(await storage.readRefreshToken(), isNull);
      expect(await storage.readUser(), isNull);
      expect(await storage.hasRefreshToken(), isFalse);
    });
  });
}