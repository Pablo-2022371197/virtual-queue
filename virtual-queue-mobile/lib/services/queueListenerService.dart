import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/http/dioClient.dart';
import '../core/storage/tokenStorage.dart';
import '../core/websocket/stompService.dart';
import '../features/wearable/wearableService.dart';
import '../providers/queuePositionProvider.dart';

final wearableServiceProvider = Provider<WearableService>((ref) {
  return WearableService();
});

final stompServiceProvider = Provider<StompService>((ref) {
  return StompService();
});

class QueueListenerService {
  QueueListenerService(
    this._ref,
    this._stompService,
    this._wearableService,
    this._tokenStorage,
  );

  final Ref _ref;
  final StompService _stompService;
  final WearableService _wearableService;
  final TokenStorage _tokenStorage;

  Future<void> start() async {
    final token = await _tokenStorage.readToken();
    if (token == null || token.isEmpty) {
      return;
    }

    _stompService.connect(
      jwt: token,
      onQueueUpdate: (payload) async {
        final position = payload['position'] is int
            ? payload['position'] as int
            : int.tryParse(payload['position']?.toString() ?? '0') ?? 0;
        final ticketNumber = payload['ticketNumber']?.toString() ??
            payload['number']?.toString() ??
            '-';
        final estimatedMinutes = payload['estimatedMinutes'] is int
            ? payload['estimatedMinutes'] as int
            : int.tryParse(payload['estimatedMinutes']?.toString() ?? '0') ??
                0;
        final status = payload['status']?.toString();

        if (status == 'CANCELLED' || status == 'COMPLETED') {
          _ref.read(queuePositionProvider.notifier).clear();
          await _wearableService.clearQueueStatus();
          return;
        }

        _ref.read(queuePositionProvider.notifier).update(
              position: position,
              ticketNumber: ticketNumber,
              estimatedMinutes: estimatedMinutes,
            );

        await _wearableService.syncQueueStatus(
          position: position,
          ticketNumber: ticketNumber,
          estimatedMinutes: estimatedMinutes,
        );

        if (position < 3) {
          await _wearableService.sendTurnAlert(
            'Tu turno $ticketNumber está próximo. Posición: $position',
          );
        }
      },
    );
  }

  void stop() {
    _stompService.disconnect();
  }
}

final queueListenerServiceProvider = Provider<QueueListenerService>((ref) {
  return QueueListenerService(
    ref,
    ref.watch(stompServiceProvider),
    ref.watch(wearableServiceProvider),
    ref.watch(tokenStorageProvider),
  );
});
