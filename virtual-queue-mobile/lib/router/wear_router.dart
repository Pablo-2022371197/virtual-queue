import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/auth_service.dart';
import '../core/navigation/navigatorKey.dart';
import '../wear/auth/login_screen.dart';
import '../wear/auth/pin_screen.dart';
import '../wear/auth/pin_storage.dart';
import '../wear/auth/session_manager.dart';
import '../wear/turnoWearWidget.dart';

class WearRouterRefreshNotifier extends ChangeNotifier {
  WearRouterRefreshNotifier(this._ref) {
    _ref.listen<AuthState>(authStateProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}

final wearRouterRefreshNotifierProvider =
    Provider<WearRouterRefreshNotifier>((ref) {
  return WearRouterRefreshNotifier(ref);
});

GoRouter createWearRouter(Ref ref) {
  final refresh = ref.read(wearRouterRefreshNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/wear/login',
    refreshListenable: refresh,
    redirect: (context, state) async {
      final auth = ref.read(authStateProvider);
      final location = state.matchedLocation;
      final isLogin = location == '/wear/login';
      final isPinSetup = location == '/wear/pin/setup';
      final isPinVerify = location == '/wear/pin/verify';

      if (auth.status == AuthStatus.loading) {
        return null;
      }

      if (auth.status == AuthStatus.anonymous) {
        return isLogin ? null : '/wear/login';
      }

      final userId = auth.user?.id ?? '';
      if (userId.isEmpty) {
        return '/wear/login';
      }

      final hasDecision = await PinStorage.hasPinDecision(userId);
      final hasPin = await PinStorage.hasPin(scope: PinScope.wear, userId: userId);

      if (!hasDecision) {
        return isPinSetup ? null : '/wear/pin/setup';
      }

      if (auth.status == AuthStatus.locked ||
          (hasPin && !SessionManager.isSessionValid())) {
        return isPinVerify ? null : '/wear/pin/verify';
      }

      if (auth.status == AuthStatus.authenticated) {
        if (isLogin || isPinSetup || isPinVerify) {
          return '/wear/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/wear/login',
        builder: (_, __) => const WearLoginScreen(),
      ),
      GoRoute(
        path: '/wear/pin/setup',
        builder: (_, __) => const PinScreen(mode: PinMode.setup),
      ),
      GoRoute(
        path: '/wear/pin/verify',
        builder: (_, __) => const PinScreen(mode: PinMode.verify),
      ),
      GoRoute(
        path: '/wear/home',
        builder: (_, __) => const TurnoWearWidget(),
      ),
    ],
  );
}

final wearRouterProvider = Provider<GoRouter>((ref) => createWearRouter(ref));
