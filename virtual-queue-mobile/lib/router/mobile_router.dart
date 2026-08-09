import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/auth_service.dart';
import '../core/navigation/navigatorKey.dart';
import '../features/auth/pin_screens.dart';
import '../features/home/homeScreen.dart';
import '../features/login/loginScreen.dart';
import '../features/place/placeQueueScreen.dart';
import '../features/search/searchScreen.dart';
import '../wear/auth/pin_storage.dart';

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this._ref) {
    _ref.listen<AuthState>(authStateProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}

final routerRefreshNotifierProvider = Provider<RouterRefreshNotifier>((ref) {
  return RouterRefreshNotifier(ref);
});

GoRouter createMobileRouter(Ref ref) {
  final refresh = ref.read(routerRefreshNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/home',
    refreshListenable: refresh,
    redirect: (context, state) async {
      final auth = ref.read(authStateProvider);
      final location = state.matchedLocation;
      final isAuthRoute = location == '/login';
      final isUnlockRoute = location == '/unlock' || location == '/pin-setup';

      if (auth.status == AuthStatus.loading) {
        return null;
      }

      if (auth.status == AuthStatus.anonymous) {
        return isAuthRoute ? null : '/login';
      }

      if (auth.status == AuthStatus.locked) {
        if (location == '/unlock') return null;
        final hasPin = await PinStorage.hasPin(scope: PinScope.mobile);
        return hasPin ? '/unlock' : '/pin-setup';
      }

      if (auth.status == AuthStatus.authenticated) {
        if (isAuthRoute || isUnlockRoute) return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/pin-setup',
        builder: (_, __) => const PinSetupScreen(optional: true),
      ),
      GoRoute(path: '/unlock', builder: (_, __) => const PinUnlockScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(
        path: '/place/:id/queue',
        builder: (_, state) {
          final placeId = state.pathParameters['id']!;
          return PlaceQueueScreen(placeId: placeId);
        },
      ),
    ],
  );
}

final mobileRouterProvider = Provider<GoRouter>((ref) {
  return createMobileRouter(ref);
});
