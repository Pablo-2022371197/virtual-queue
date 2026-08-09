import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/errors/api_exception.dart';
import '../core/http/dio_client.dart';
import '../core/realtime/stomp_service.dart';
import '../features/tickets/ticket_repository.dart';
import '../models/ticket.dart';
import '../models/ticket_event.dart';
import 'wear_queue_provider.dart';

class WearTicketListener {
  WearTicketListener(this._ref);

  final Ref _ref;
  bool _started = false;
  final StompService _stomp = StompService();

  Future<void> start() async {
    if (_started) return;
    final token = await _ref.read(tokenStorageProvider).readAccessToken();
    if (token == null || token.isEmpty) return;

    _stomp.connect(
      jwt: token,
      onTicketEvent: (event) {
        _applyEvent(event);
      },
    );
    _started = true;
  }

  void stop() {
    _stomp.disconnect();
    _started = false;
  }

  void _applyEvent(TicketEvent event) {
    final payload = event.ticket;
    final status = payload.status;
    final notifier = _ref.read(wearQueueProvider.notifier);

    if (!isActiveTicketStatus(status)) {
      notifier.setNoTicket();
      return;
    }

    final current = _ref.read(wearQueueProvider);
    notifier.updateFromPayload(
      ticketId: payload.id,
      placeName: current.placeName,
      ticketNumber: payload.number,
      position: payload.position,
      estimatedMinutes: payload.estimatedMinutes,
      status: status,
      counterNumber: payload.counterNumber,
    );

    if (status == TicketStatus.nearly || status == TicketStatus.called) {
      final counterText = payload.counterNumber != null
          ? ' Ventanilla ${payload.counterNumber}.'
          : '';
      notifier.markAlert(
        'Tu turno ${payload.number} está próximo.$counterText',
      );
    }
  }
}

final wearTicketListenerProvider = Provider<WearTicketListener>((ref) {
  final listener = WearTicketListener(ref);
  ref.onDispose(listener.stop);
  return listener;
});

class WearTicketController {
  WearTicketController(this._ref);

  final Ref _ref;

  Future<void> refresh() async {
    final notifier = _ref.read(wearQueueProvider.notifier);
    notifier.setSyncing();
    try {
      final ticket = await _ref.read(ticketRepositoryProvider).getMine();
      if (ticket == null) {
        notifier.setNoTicket();
        return;
      }
      notifier.updateFromPayload(
        ticketId: ticket.id,
        placeName: ticket.placeName,
        ticketNumber: ticket.number,
        position: ticket.position,
        estimatedMinutes: ticket.estimatedMinutes,
        status: ticket.status,
        counterNumber: ticket.counterNumber,
      );
    } on ApiException catch (error) {
      if (error.isNetworkError) {
        notifier.setNoPhone();
      } else {
        notifier.setNoTicket();
      }
    } catch (_) {
      notifier.setNoPhone();
    }
  }

  Future<void> start() async {
    await refresh();
    await _ref.read(wearTicketListenerProvider).start();
  }

  void stop() {
    _ref.read(wearTicketListenerProvider).stop();
  }

  void clear() {
    stop();
    _ref.read(wearQueueProvider.notifier).clear();
  }
}

final wearTicketControllerProvider = Provider<WearTicketController>((ref) {
  final controller = WearTicketController(ref);
  ref.onDispose(controller.stop);
  return controller;
});
