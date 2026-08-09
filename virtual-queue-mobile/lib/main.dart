import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/auth/auth_service.dart';
import 'core/config/app_config.dart';
import 'core/notifications/fcm_service.dart';
import 'router/mobile_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.init();
  await FcmService.registerBackgroundHandler();

  runApp(
    const ProviderScope(
      child: VirtualQueueApp(),
    ),
  );
}

class VirtualQueueApp extends ConsumerStatefulWidget {
  const VirtualQueueApp({super.key});

  @override
  ConsumerState<VirtualQueueApp> createState() => _VirtualQueueAppState();
}

class _VirtualQueueAppState extends ConsumerState<VirtualQueueApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(authStateProvider.notifier).bootstrap();
      await ref.read(fcmServiceProvider).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(mobileRouterProvider);
    final auth = ref.watch(authStateProvider);

    if (auth.status == AuthStatus.loading) {
      return const MaterialApp(
        home: Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return MaterialApp.router(
      title: 'Virtual Queue',
      routerConfig: router,
    );
  }
}
