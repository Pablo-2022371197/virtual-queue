import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../features/auth/login_screen.dart';
import '../features/places/place_detail_screen.dart';
import '../features/places/place_directions_screen.dart';
import '../features/places/search_screen.dart';
import '../features/support/support_screen.dart';
import '../features/ticket/home_screen.dart';
import '../widgets/phone_shell.dart';

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this._ref) {
    _ref.listen<AuthState>(coreAuthStateProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}

final routerRefreshNotifierProvider = Provider<RouterRefreshNotifier>((ref) {
  return RouterRefreshNotifier(ref);
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(routerRefreshNotifierProvider);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(coreAuthStateProvider);
      final loggingIn = state.matchedLocation == '/login';
      final onSupport = state.matchedLocation == '/support';
      final authenticated = auth.status == AuthStatus.authenticated;

      if (auth.status == AuthStatus.loading) {
        return null;
      }

      if (!authenticated) {
        return (loggingIn || onSupport) ? null : '/login';
      }
      if (authenticated && loggingIn) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/support',
        builder: (_, __) => const SupportScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return PhoneShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (_, __) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                builder: (_, __) => const SearchScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/place/:id/directions',
        builder: (_, state) {
          final id = state.pathParameters['id'] ?? '';
          return PlaceDirectionsScreen(placeId: id);
        },
      ),
      GoRoute(
        path: '/place/:id',
        builder: (_, state) {
          final id = state.pathParameters['id'] ?? '';
          return PlaceDetailScreen(placeId: id);
        },
      ),
    ],
  );
});
