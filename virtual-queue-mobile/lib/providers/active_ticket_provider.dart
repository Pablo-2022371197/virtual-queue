import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/errors/api_exception.dart';
import '../core/http/dio_client.dart';
import '../core/realtime/stomp_service.dart';
import '../features/tickets/ticket_repository.dart';
import '../features/wearable/wearable_service.dart';
import '../models/ticket.dart';
import '../models/ticket_event.dart';

final stompServiceProvider = Provider<StompService>((ref) => StompService());

final wearableServiceProvider = Provider<WearableService>((ref) {
  return WearableService();
});

class ActiveTicketState {
  const ActiveTicketState({
    this.ticket,
    this.isLoading = false,
    this.error,
    this.isNetworkError = false,
  });

  final Ticket? ticket;
  final bool isLoading;
  final String? error;
  final bool isNetworkError;

  ActiveTicketState copyWith({
    Ticket? ticket,
    bool? isLoading,
    String? error,
    bool? isNetworkError,
    bool clearTicket = false,
    bool clearError = false,
  }) {
    return ActiveTicketState(
      ticket: clearTicket ? null : (ticket ?? this.ticket),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isNetworkError: isNetworkError ?? this.isNetworkError,
    );
  }
}

class ActiveTicketNotifier extends StateNotifier<ActiveTicketState> {
  ActiveTicketNotifier(this._ref) : super(const ActiveTicketState(isLoading: true)) {
    refresh();
  }

  final Ref _ref;

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final ticket = await _ref.read(ticketRepositoryProvider).getMine();
      state = ActiveTicketState(ticket: ticket);
    } on ApiException catch (error) {
      state = ActiveTicketState(
        error: error.message,
        isNetworkError: error.isNetworkError,
      );
    } catch (_) {
      state = const ActiveTicketState(
        error: 'No se pudo cargar el turno.',
      );
    }
  }

  Future<Ticket> takeTicket(String placeId) async {
    final ticket = await _ref.read(ticketRepositoryProvider).takeTicket(placeId);
    state = ActiveTicketState(ticket: ticket);
    await _syncWearable(ticket);
    return ticket;
  }

  Future<Ticket> cancelTicket(String ticketId) async {
    final ticket = await _ref.read(ticketRepositoryProvider).cancelTicket(ticketId);
    state = const ActiveTicketState();
    await _ref.read(wearableServiceProvider).clearQueueStatus();
    return ticket;
  }

  void applyTicketEvent(TicketEvent event) {
    final payload = event.ticket;
    final status = payload.status;
    if (!isActiveTicketStatus(status)) {
      state = const ActiveTicketState();
      _ref.read(wearableServiceProvider).clearQueueStatus();
      return;
    }

    final ticket = Ticket(
      id: payload.id,
      placeId: payload.placeId,
      placeName: state.ticket?.placeName ?? '',
      number: payload.number,
      position: payload.position,
      estimatedMinutes: payload.estimatedMinutes,
      status: status,
      issuedAt: state.ticket?.issuedAt,
      counterNumber: payload.counterNumber,
      counterLabel: payload.counterLabel ?? state.ticket?.counterLabel,
    );
    state = ActiveTicketState(ticket: ticket);
    _syncWearable(ticket);
  }

  Future<void> _syncWearable(Ticket ticket) async {
    final wearable = _ref.read(wearableServiceProvider);
    await wearable.syncQueueStatus(
      ticketId: ticket.id,
      placeName: ticket.placeName,
      ticketNumber: ticket.number,
      position: ticket.position,
      estimatedMinutes: ticket.estimatedMinutes,
      status: ticket.status,
      counterNumber: ticket.counterNumber,
    );
    if (ticket.status == TicketStatus.nearly ||
        ticket.status == TicketStatus.called) {
      final label = ticket.counterLabel ??
          (ticket.counterNumber != null
              ? String.fromCharCode(64 + ticket.counterNumber!)
              : null);
      final counterText = label != null ? ' Caja $label.' : '';
      await wearable.sendTurnAlert(
        'Tu turno ${ticket.number} está próximo.$counterText Posición: ${ticket.position}',
      );
    }
  }
}

final activeTicketProvider =
    StateNotifierProvider<ActiveTicketNotifier, ActiveTicketState>((ref) {
  return ActiveTicketNotifier(ref);
});

class QueueListenerService {
  QueueListenerService(this._ref);

  final Ref _ref;
  bool _started = false;

  Future<void> start() async {
    if (_started) return;
    final token = await _ref.read(tokenStorageProvider).readAccessToken();
    if (token == null || token.isEmpty) return;

    _ref.read(stompServiceProvider).connect(
          jwt: token,
          onTicketEvent: (event) {
            _ref.read(activeTicketProvider.notifier).applyTicketEvent(event);
          },
        );
    _started = true;
  }

  void stop() {
    _ref.read(stompServiceProvider).disconnect();
    _started = false;
  }
}

final queueListenerServiceProvider = Provider<QueueListenerService>((ref) {
  final service = QueueListenerService(ref);
  ref.onDispose(service.stop);
  return service;
});
