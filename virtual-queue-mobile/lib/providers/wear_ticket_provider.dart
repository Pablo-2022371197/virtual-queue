import 'dart:async';

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
  String? _connectedToken;
  final StompService _stomp = StompService();

  Future<void> start({bool force = false}) async {
    final token = await _ref.read(tokenStorageProvider).readAccessToken();
    if (token == null || token.isEmpty) return;

    if (_started && !force && _connectedToken == token) return;

    _stomp.connect(
      jwt: token,
      onTicketEvent: _applyEvent,
      onConnectionChange: (connected) {
        if (!connected) {
          _started = false;
        }
      },
    );
    _connectedToken = token;
    _started = true;
  }

  void stop() {
    _stomp.disconnect();
    _started = false;
    _connectedToken = null;
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
      placeName: payload.placeName.isNotEmpty
          ? payload.placeName
          : current.placeName,
      ticketNumber: payload.number,
      position: payload.position,
      estimatedMinutes: payload.estimatedMinutes,
      status: status,
      counterNumber: payload.counterNumber,
      counterLabel: payload.counterLabel,
      issuedAt: payload.issuedAt ?? current.issuedAt,
    );

    if (status == TicketStatus.called || status == TicketStatus.serving) {
      final label = payload.counterLabel ??
          (payload.counterNumber != null
              ? String.fromCharCode(64 + payload.counterNumber!)
              : null);
      final counterText = label != null ? ' Dirígete a la caja $label.' : '';
      notifier.markAlert('¡Es tu turno!$counterText');
    } else if (status == TicketStatus.nearly) {
      final label = payload.counterLabel ??
          (payload.counterNumber != null
              ? String.fromCharCode(64 + payload.counterNumber!)
              : null);
      final counterText = label != null ? ' Caja $label.' : '';
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
  Timer? _pollTimer;
  bool _refreshing = false;

  Future<void> refresh({bool silent = false}) async {
    if (_refreshing) return;
    _refreshing = true;
    final notifier = _ref.read(wearQueueProvider.notifier);
    if (!silent) notifier.setSyncing();
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
        counterLabel: ticket.counterLabel,
        issuedAt: ticket.issuedAt,
      );
    } on ApiException catch (error) {
      if (error.isNetworkError) {
        notifier.setNoPhone();
      } else if (!silent) {
        notifier.setNoTicket();
      }
    } catch (_) {
      if (!silent) notifier.setNoPhone();
    } finally {
      _refreshing = false;
    }
  }

  Future<void> start() async {
    await _ref.read(wearQueueProvider.notifier).ready;
    await refresh();
    await _ref.read(wearTicketListenerProvider).start(force: true);
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      refresh(silent: true);
    });
  }

  Future<void> resume() async {
    await refresh(silent: true);
    await _ref.read(wearTicketListenerProvider).start(force: true);
  }

  Future<void> cancelActiveTicket() async {
    final ticketId = _ref.read(wearQueueProvider).ticketId;
    if (ticketId.isEmpty) return;

    final notifier = _ref.read(wearQueueProvider.notifier);
    notifier.setSyncing();
    try {
      await _ref.read(ticketRepositoryProvider).cancelTicket(ticketId);
      notifier.setNoTicket();
    } on ApiException {
      await refresh();
      rethrow;
    } catch (_) {
      await refresh();
      rethrow;
    }
  }

  void stop() {
    _pollTimer?.cancel();
    _pollTimer = null;
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
