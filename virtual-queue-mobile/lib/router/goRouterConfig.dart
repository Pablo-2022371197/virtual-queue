import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/navigation/navigatorKey.dart';
import '../core/storage/tokenStorage.dart';
import '../features/home/homeScreen.dart';
import '../features/login/loginScreen.dart';
import '../features/place/placeQueueScreen.dart';
import '../features/search/searchScreen.dart';
import '../wear/auth/pin_screen.dart';
import '../wear/auth/pin_storage.dart';
import '../wear/auth/session_manager.dart';
import '../wear/turnoWearWidget.dart';

late final GoRouter goRouter;

GoRouter createGoRouter() {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/home',
    redirect: (context, state) async {
      final location = state.matchedLocation;

      // --- Wear OS routes ---
      if (location.startsWith('/wear/')) {
        final hasPin = await PinStorage.hasPin();
        final sessionValid = SessionManager.isSessionValid();

        if (!hasPin && location != '/wear/pin/setup') {
          return '/wear/pin/setup';
        }

        if (hasPin && !sessionValid && location != '/wear/pin/verify') {
          return '/wear/pin/verify';
        }

        if (hasPin && sessionValid && (location == '/wear/pin/setup' || location == '/wear/pin/verify')) {
          return '/wear/home';
        }

        return null;
      }

      // --- Mobile routes ---
      final tokenStorage = TokenStorage();
      final token = await tokenStorage.readToken();
      final isLoginRoute = location == '/login';

      if ((token == null || token.isEmpty) && !isLoginRoute) {
        return '/login';
      }

      if (token != null && token.isNotEmpty && isLoginRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/place/:id/queue',
        builder: (context, state) {
          final placeId = state.pathParameters['id']!;
          return PlaceQueueScreen(placeId: placeId);
        },
      ),
      // --- Wear OS routes ---
      GoRoute(
        path: '/wear/pin/setup',
        builder: (context, state) => const PinScreen(mode: PinMode.setup),
      ),
      GoRoute(
        path: '/wear/pin/verify',
        builder: (context, state) => const PinScreen(mode: PinMode.verify),
      ),
      GoRoute(
        path: '/wear/home',
        builder: (context, state) => const TurnoWearWidget(),
      ),
    ],
  );
}

final goRouterProvider = Provider<GoRouter>((ref) {
  goRouter = createGoRouter();
  return goRouter;
});
