import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../http/dio_client.dart';
import '../models/user_summary.dart';
import 'auth_service.dart';

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

/// Sesión sin lógica de PIN (cliente teléfono y base para Wear).
class CoreAuthStateNotifier extends StateNotifier<AuthState> {
  CoreAuthStateNotifier(this._ref)
      : super(const AuthState(status: AuthStatus.loading));

  final Ref _ref;

  Future<void> bootstrap() async {
    state = const AuthState(status: AuthStatus.loading);
    final user = await _ref.read(authServiceProvider).bootstrapUser();
    if (user == null) {
      state = const AuthState(status: AuthStatus.anonymous);
      return;
    }
    state = AuthState(status: AuthStatus.authenticated, user: user);
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
    await _ref.read(authServiceProvider).logout();
    state = const AuthState(status: AuthStatus.anonymous);
  }
}

final coreAuthStateProvider =
    StateNotifierProvider<CoreAuthStateNotifier, AuthState>((ref) {
  return CoreAuthStateNotifier(ref);
});
