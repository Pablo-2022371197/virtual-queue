import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../errors/api_exception.dart';
import '../http/dio_client.dart';
import '../models/auth_response.dart';
import '../models/user_summary.dart';
import '../storage/token_storage.dart';

class AuthService {
  AuthService(this._dio, this._tokenStorage);

  final Dio _dio;
  final TokenStorage _tokenStorage;

  Future<AuthResponse> login({
    required String username,
    required String password,
  }) async {
    final response = await _dio.post(
      '/api/auth/login',
      data: {'username': username, 'password': password},
    );
    if (response.statusCode != null && response.statusCode! >= 400) {
      throw _authError(response.data, response.statusCode);
    }
    final auth = AuthResponse.fromJson(response.data as Map<String, dynamic>);
    await _tokenStorage.saveSession(
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    );
    return auth;
  }

  Future<AuthResponse> register({
    required String fullName,
    required String email,
    required String username,
    required String password,
  }) async {
    final response = await _dio.post(
      '/api/auth/register',
      data: {
        'fullName': fullName,
        'email': email,
        'username': username,
        'password': password,
      },
    );
    if (response.statusCode != null && response.statusCode! >= 400) {
      throw _authError(response.data, response.statusCode);
    }
    final auth = AuthResponse.fromJson(response.data as Map<String, dynamic>);
    await _tokenStorage.saveSession(
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    );
    return auth;
  }

  ApiException _authError(dynamic data, int? statusCode) {
    if (data is Map<String, dynamic>) {
      return ApiException(
        message: data['detail']?.toString() ?? messageForCode(data['code']?.toString()),
        statusCode: statusCode,
        code: data['code']?.toString(),
      );
    }
    return ApiException(
      message: statusCode == 401
          ? 'Credenciales inválidas.'
          : 'No se pudo completar la autenticación.',
      statusCode: statusCode,
    );
  }

  Future<AuthResponse> refreshSession() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw const ApiException(
        message: 'No hay sesión activa.',
        statusCode: 401,
      );
    }

    final response = await _dio.post(
      '/api/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final auth = AuthResponse.fromJson(response.data as Map<String, dynamic>);
    await _tokenStorage.saveSession(
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    );
    return auth;
  }

  Future<void> logout() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await _dio.post(
          '/api/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      } catch (_) {
        // Best effort logout.
      }
    }
    await _tokenStorage.clearSession();
  }

  Future<UserSummary?> bootstrapUser() async {
    if (!await _tokenStorage.hasRefreshToken()) {
      return null;
    }
    try {
      final auth = await refreshSession();
      return auth.user;
    } catch (_) {
      await _tokenStorage.clearSession();
      return null;
    }
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
    ref.watch(dioProvider),
    ref.watch(tokenStorageProvider),
  );
});
