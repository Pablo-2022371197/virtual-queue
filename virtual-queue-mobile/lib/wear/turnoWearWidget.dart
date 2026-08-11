import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import '../core/auth/auth_service.dart';
import '../core/errors/api_exception.dart';
import '../core/format/datetime.dart';
import '../core/format/counter_label.dart';
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

class _TurnoWearWidgetState extends ConsumerState<TurnoWearWidget>
    with WidgetsBindingObserver {
  bool _cancelling = false;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(wearTicketControllerProvider).start();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(wearTicketControllerProvider).resume();
    }
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

  Future<void> _cancelTicket() async {
    if (_cancelling) return;
    setState(() {
      _cancelling = true;
      _actionError = null;
    });
    try {
      await ref.read(wearTicketControllerProvider).cancelActiveTicket();
    } on ApiException catch (error) {
      if (mounted) setState(() => _actionError = error.message);
    } catch (_) {
      if (mounted) setState(() => _actionError = 'No se pudo cancelar');
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  bool _canCancel(WearQueueState queue) {
    return queue.ticketId.isNotEmpty &&
        (queue.status == TicketStatus.waiting ||
            queue.status == TicketStatus.nearly ||
            queue.status == TicketStatus.called);
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
                if (_actionError != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _actionError!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.redAccent, fontSize: 10),
                  ),
                ],
                if (!isAmbient) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (_canCancel(queue))
                        TextButton.icon(
                          onPressed: _cancelling ? null : _cancelTicket,
                          icon: _cancelling
                              ? const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 1.5,
                                    color: Colors.redAccent,
                                  ),
                                )
                              : const Icon(
                                  Icons.cancel_outlined,
                                  size: 14,
                                  color: Colors.redAccent,
                                ),
                          label: const Text(
                            'Cancelar',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.redAccent,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                      TextButton.icon(
                        onPressed: _lock,
                        icon: const Icon(
                          Icons.lock_outline,
                          size: 14,
                          color: Colors.white70,
                        ),
                        label: const Text(
                          'Bloquear',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _logout,
                        icon: const Icon(
                          Icons.logout,
                          size: 14,
                          color: Colors.white70,
                        ),
                        label: const Text(
                          'Salir',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
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
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Sin turno activo',
              style: TextStyle(color: mutedColor, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            if (!isAmbient) ...[
              const SizedBox(height: 8),
              TextButton(
                onPressed: () =>
                    ref.read(wearTicketControllerProvider).refresh(),
                child: const Text(
                  'Actualizar',
                  style: TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ),
            ],
          ],
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
            if (queue.issuedAt != null && queue.issuedAt!.isNotEmpty)
              Text(
                'Expedido: ${formatDateTime(queue.issuedAt)}',
                style: TextStyle(color: mutedColor, fontSize: 10),
                textAlign: TextAlign.center,
              ),
            Text(
              ticketStatusLabel(queue.status),
              style: TextStyle(color: mutedColor, fontSize: 11),
            ),
            if (queue.counterNumber != null &&
                (queue.status == TicketStatus.called ||
                    queue.status == TicketStatus.serving))
              Text(
                'Caja ${counterLabel(queue.counterNumber)}',
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
