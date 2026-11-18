import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/auth/auth_service.dart';
import 'package:virtual_queue_core/errors/api_exception.dart';
import 'package:virtual_queue_core/storage/token_storage.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('AuthService.login integration', () {
    test('200 persists session in TokenStorage', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((_) {
          return ResponseBody.fromString(
            '''
            {
              "accessToken": "at",
              "refreshToken": "rt",
              "tokenType": "Bearer",
              "expiresIn": 3600,
              "user": {
                "id": "u1",
                "username": "cust",
                "fullName": "Cust",
                "role": "CUSTOMER"
              }
            }
            ''',
            200,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final storage = TokenStorage();
      final auth = AuthService(dio, storage);

      final response = await auth.login(
        username: 'cust',
        password: 'secret',
      );

      expect(response.user.username, 'cust');
      expect(await storage.readAccessToken(), 'at');
      expect(await storage.readRefreshToken(), 'rt');
      expect((await storage.readUser())?.username, 'cust');
    });

    test('401 does not persist and throws ApiException', () async {
      final dio = Dio(
        BaseOptions(
          baseUrl: 'http://localhost',
          validateStatus: (status) => status != null && status < 500,
        ),
      )
        ..httpClientAdapter = _Adapter((_) {
          return ResponseBody.fromString(
            '{"code":"UNAUTHORIZED","detail":"Invalid"}',
            401,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final storage = TokenStorage();
      final auth = AuthService(dio, storage);

      await expectLater(
        auth.login(username: 'x', password: 'y'),
        throwsA(isA<ApiException>()),
      );
      expect(await storage.hasRefreshToken(), isFalse);
    });
  });

  group('AuthService.bootstrapUser', () {
    test('returns null when no refresh token', () async {
      final dio = Dio();
      final auth = AuthService(dio, TokenStorage());
      expect(await auth.bootstrapUser(), isNull);
    });
  });
}

class _Adapter implements HttpClientAdapter {
  _Adapter(this._handler);

  final ResponseBody Function(RequestOptions options) _handler;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return _handler(options);
  }
}