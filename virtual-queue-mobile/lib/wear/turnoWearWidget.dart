import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import '../core/auth/auth_service.dart';
import '../models/ticket.dart';
import '../providers/wear_queue_provider.dart';
import '../providers/wear_ticket_provider.dart';
import 'auth/pin_storage.dart';
import 'auth/session_manager.dart';
import 'wear_safe_area.dart';

class TurnoWearWidget extends ConsumerStatefulWidget {
  const TurnoWearWidget({super.key});

  @override
  ConsumerState<TurnoWearWidget> createState() => _TurnoWearWidgetState();
}

class _TurnoWearWidgetState extends ConsumerState<TurnoWearWidget> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(wearTicketControllerProvider).start();
    });
  }

  Future<void> _lock() async {
    final userId = ref.read(authStateProvider).user?.id;
    SessionManager.endSession();
    await ref.read(authStateProvider.notifier).lock();
    if (!mounted) return;
    final hasPin = userId != null &&
        await PinStorage.hasPin(scope: PinScope.wear, userId: userId);
    if (!mounted) return;
    context.go(hasPin ? '/wear/pin/verify' : '/wear/home');
  }

  Future<void> _logout() async {
    ref.read(wearTicketControllerProvider).clear();
    SessionManager.endSession();
    await ref.read(authStateProvider.notifier).logout();
    if (mounted) context.go('/wear/login');
  }

  @override
  Widget build(BuildContext context) {
    final queue = ref.watch(wearQueueProvider);

    return AmbientMode(
      builder: (context, mode, child) {
        final isAmbient = mode == WearMode.ambient;

        return Scaffold(
          backgroundColor: Colors.black,
          body: WearSafeArea(
            scrollable: true,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildContent(queue, isAmbient),
                if (!isAmbient) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      TextButton.icon(
                        onPressed: _lock,
                        icon: const Icon(Icons.lock_outline, size: 14, color: Colors.white70),
                        label: const Text(
                          'Bloquear',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _logout,
                        icon: const Icon(Icons.logout, size: 14, color: Colors.white70),
                        label: const Text(
                          'Salir',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildContent(WearQueueState queue, bool isAmbient) {
    final textColor = Colors.white;
    final mutedColor = Colors.white70;

    switch (queue.viewState) {
      case WearViewState.syncing:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 8),
            Text('Sincronizando...', style: TextStyle(color: mutedColor, fontSize: 12)),
          ],
        );
      case WearViewState.noPhone:
        return Text(
          'Sin conexión',
          style: TextStyle(color: mutedColor, fontSize: 14),
          textAlign: TextAlign.center,
        );
      case WearViewState.noTicket:
        return Text(
          'Sin turno activo',
          style: TextStyle(color: mutedColor, fontSize: 14),
          textAlign: TextAlign.center,
        );
      case WearViewState.called:
      case WearViewState.active:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (queue.placeName.isNotEmpty)
              Text(
                queue.placeName,
                style: TextStyle(color: mutedColor, fontSize: 11),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            Text(
              queue.ticketNumber,
              style: TextStyle(
                fontSize: queue.viewState == WearViewState.called ? 34 : 30,
                fontWeight: FontWeight.bold,
                color: queue.viewState == WearViewState.called
                    ? Colors.amber
                    : textColor,
              ),
            ),
            const SizedBox(height: 6),
            Text('Posición: ${queue.position}', style: TextStyle(color: textColor, fontSize: 12)),
            Text(
              'Estimado: ${queue.estimatedMinutes} min',
              style: TextStyle(color: textColor, fontSize: 12),
            ),
            Text(
              ticketStatusLabel(queue.status),
              style: TextStyle(color: mutedColor, fontSize: 11),
            ),
            if (queue.counterNumber != null &&
                (queue.status == TicketStatus.called ||
                    queue.status == TicketStatus.serving))
              Text(
                'Vent. ${queue.counterNumber}',
                style: TextStyle(
                  color: queue.viewState == WearViewState.called
                      ? Colors.amber
                      : textColor,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            if (queue.alertMessage != null) ...[
              const SizedBox(height: 6),
              Text(
                queue.alertMessage!,
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.amber, fontSize: 11),
              ),
            ],
          ],
        );
    }
  }
}
