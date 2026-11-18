import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import 'router/app_router.dart';
import 'theme/turnix_theme.dart';

class TurnixPhoneApp extends ConsumerStatefulWidget {
  const TurnixPhoneApp({super.key});

  @override
  ConsumerState<TurnixPhoneApp> createState() => _TurnixPhoneAppState();
}

class _TurnixPhoneAppState extends ConsumerState<TurnixPhoneApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(coreAuthStateProvider.notifier).bootstrap();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(coreAuthStateProvider);

    if (auth.status == AuthStatus.loading) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: buildTurnixTheme(),
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Turnix',
      debugShowCheckedModeBanner: false,
      theme: buildTurnixTheme(),
      routerConfig: router,
    );
  }
}
