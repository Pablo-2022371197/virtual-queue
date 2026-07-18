import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/notifications/fcmService.dart';
import 'router/goRouterConfig.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
      await ref.read(fcmServiceProvider).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'Virtual Queue',
      routerConfig: router,
    );
  }
}
