import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import '../providers/queuePositionProvider.dart';
import 'auth/session_manager.dart';

class TurnoWearWidget extends ConsumerWidget {
  const TurnoWearWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(queuePositionProvider);

    return AmbientMode(
      builder: (context, mode, child) {
        final isAmbient = mode == WearMode.ambient;

        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            brightness: isAmbient ? Brightness.dark : Brightness.light,
            scaffoldBackgroundColor: isAmbient ? Colors.black : null,
            textTheme: TextTheme(
              bodyMedium: TextStyle(
                color: isAmbient ? Colors.white : null,
              ),
            ),
          ),
          home: Scaffold(
            backgroundColor: isAmbient ? Colors.black : null,
            body: SafeArea(
              child: Stack(
                children: [
                  WatchShape(
                    builder: (context, shape, child) {
                      final isRound = shape == WearShape.round;
                      final turnFontSize = isRound ? 32.0 : 36.0;

                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              queue.ticketNumber,
                              style: TextStyle(
                                fontSize: turnFontSize,
                                fontWeight: FontWeight.bold,
                                color: isAmbient ? Colors.white : null,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Posición: ${queue.position}',
                              style: TextStyle(
                                color: isAmbient ? Colors.white : null,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Estimado: ${queue.estimatedMinutes} min',
                              style: TextStyle(
                                color: isAmbient ? Colors.white : null,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: IconButton(
                      icon: Icon(
                        Icons.logout,
                        color: isAmbient ? Colors.white54 : Colors.black54,
                        size: 20,
                      ),
                      onPressed: () {
                        SessionManager.endSession();
                        context.go('/wear/pin/verify');
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
