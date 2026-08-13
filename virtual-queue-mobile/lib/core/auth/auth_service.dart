import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/auth_response.dart';
import '../../models/user_summary.dart';
import '../../wear/auth/pin_storage.dart';
import '../errors/api_exception.dart';
import '../storage/token_storage.dart';
import '../http/dio_client.dart';

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

final authStateProvider =
    StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(ref);
});

enum AuthStatus { loading, authenticated, anonymous, locked }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
  });

  final AuthStatus status;
  final UserSummary? user;

  AuthState copyWith({
    AuthStatus? status,
    UserSummary? user,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
    );
  }
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  AuthStateNotifier(this._ref)
      : super(const AuthState(status: AuthStatus.loading));

  final Ref _ref;

  Future<void> bootstrap() async {
    state = const AuthState(status: AuthStatus.loading);
    final user = await _ref.read(authServiceProvider).bootstrapUser();
    if (user == null) {
      state = const AuthState(status: AuthStatus.anonymous);
      return;
    }

    final wearHasPin = await PinStorage.hasPin(
      scope: PinScope.wear,
      userId: user.id,
    );
    state = AuthState(
      status: wearHasPin ? AuthStatus.locked : AuthStatus.authenticated,
      user: user,
    );
  }

  Future<void> login({
    required String username,
    required String password,
  }) async {
    final auth = await _ref.read(authServiceProvider).login(
          username: username,
          password: password,
        );
    await _ref.read(tokenStorageProvider).markUnlocked();
    state = AuthState(status: AuthStatus.authenticated, user: auth.user);
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String username,
    required String password,
  }) async {
    final auth = await _ref.read(authServiceProvider).register(
          fullName: fullName,
          email: email,
          username: username,
          password: password,
        );
    await _ref.read(tokenStorageProvider).markUnlocked();
    state = AuthState(status: AuthStatus.authenticated, user: auth.user);
  }

  Future<void> unlock() async {
    await _ref.read(tokenStorageProvider).markUnlocked();
    state = state.copyWith(status: AuthStatus.authenticated);
  }

  Future<void> lock() async {
    await _ref.read(tokenStorageProvider).markLocked();
    state = state.copyWith(status: AuthStatus.locked);
  }

  Future<void> logout() async {
    final userId = state.user?.id;
    await _ref.read(authServiceProvider).logout();
    if (userId != null && userId.isNotEmpty) {
      // Keep wear PIN for the same user; only clear session tokens.
    }
    state = const AuthState(status: AuthStatus.anonymous);
  }
}
