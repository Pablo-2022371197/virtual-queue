import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

enum PhoneTicketLoadState {
  loading,
  ready,
  error,
}

class PhoneTicketState {
  const PhoneTicketState({
    this.loadState = PhoneTicketLoadState.loading,
    this.ticket,
    this.errorMessage,
    this.isNetworkError = false,
  });

  final PhoneTicketLoadState loadState;
  final Ticket? ticket;
  final String? errorMessage;
  final bool isNetworkError;

  bool get hasActiveTicket =>
      ticket != null && isActiveTicketStatus(ticket!.status);

  PhoneTicketState copyWith({
    PhoneTicketLoadState? loadState,
    Ticket? ticket,
    bool clearTicket = false,
    String? errorMessage,
    bool? isNetworkError,
  }) {
    return PhoneTicketState(
      loadState: loadState ?? this.loadState,
      ticket: clearTicket ? null : (ticket ?? this.ticket),
      errorMessage: errorMessage,
      isNetworkError: isNetworkError ?? this.isNetworkError,
    );
  }
}

class PhoneTicketNotifier extends StateNotifier<PhoneTicketState> {
  PhoneTicketNotifier() : super(const PhoneTicketState());

  void setTicket(Ticket ticket) {
    state = PhoneTicketState(
      loadState: PhoneTicketLoadState.ready,
      ticket: ticket,
    );
  }

  void applyTicket(Ticket? ticket) {
    if (ticket == null || !isActiveTicketStatus(ticket.status)) {
      state = const PhoneTicketState(loadState: PhoneTicketLoadState.ready);
      return;
    }
    state = PhoneTicketState(
      loadState: PhoneTicketLoadState.ready,
      ticket: ticket,
    );
  }

  void setLoading() {
    state = state.copyWith(loadState: PhoneTicketLoadState.loading);
  }

  void setError(ApiException error) {
    state = PhoneTicketState(
      loadState: PhoneTicketLoadState.error,
      ticket: state.ticket,
      errorMessage: error.message,
      isNetworkError: error.isNetworkError,
    );
  }
}

final phoneTicketProvider =
    StateNotifierProvider<PhoneTicketNotifier, PhoneTicketState>((ref) {
  return PhoneTicketNotifier();
});

class PhoneTicketListener {
  PhoneTicketListener(this._ref);

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
        if (!connected) _started = false;
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
    final ticket = Ticket(
      id: payload.id,
      placeId: payload.placeId,
      placeName: payload.placeName,
      number: payload.number,
      position: payload.position,
      estimatedMinutes: payload.estimatedMinutes,
      status: payload.status,
      issuedAt: payload.issuedAt,
      counterNumber: payload.counterNumber,
      counterLabel: payload.counterLabel,
    );
    _ref.read(phoneTicketProvider.notifier).applyTicket(ticket);
  }
}

final phoneTicketListenerProvider = Provider<PhoneTicketListener>((ref) {
  final listener = PhoneTicketListener(ref);
  ref.onDispose(listener.stop);
  return listener;
});

class PhoneTicketController {
  PhoneTicketController(this._ref);

  final Ref _ref;
  Timer? _pollTimer;
  bool _refreshing = false;
  bool _takingTicket = false;

  Future<void> refresh({bool silent = false}) async {
    if (_refreshing) return;
    _refreshing = true;
    final notifier = _ref.read(phoneTicketProvider.notifier);
    if (!silent) notifier.setLoading();
    try {
      final ticket = await _ref.read(ticketRepositoryProvider).getMine();
      notifier.applyTicket(ticket);
    } on ApiException catch (error) {
      if (!silent) notifier.setError(error);
    } catch (_) {
      if (!silent) {
        notifier.setError(
          const ApiException(
            message: 'No se pudo cargar tu turno.',
            isNetworkError: true,
          ),
        );
      }
    } finally {
      _refreshing = false;
    }
  }

  Future<Ticket> takeTicket(String placeId) async {
    if (_takingTicket) {
      throw const ApiException(message: 'Ya hay una solicitud de turno en curso.');
    }
    _takingTicket = true;
    try {
      final ticket = await _ref.read(ticketRepositoryProvider).takeTicket(placeId);
      _ref.read(phoneTicketProvider.notifier).setTicket(ticket);
      await _ref.read(phoneTicketListenerProvider).start(force: true);
      return ticket;
    } finally {
      _takingTicket = false;
    }
  }

  Future<void> start() async {
    await refresh();
    await _ref.read(phoneTicketListenerProvider).start(force: true);
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      refresh(silent: true);
    });
  }

  Future<void> cancelActiveTicket() async {
    final ticket = _ref.read(phoneTicketProvider).ticket;
    if (ticket == null || ticket.id.isEmpty) return;

    await _ref.read(ticketRepositoryProvider).cancelTicket(ticket.id);
    _ref.read(phoneTicketProvider.notifier).applyTicket(null);
  }

  void stop() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _ref.read(phoneTicketListenerProvider).stop();
  }

  void clear() {
    stop();
    _ref.read(phoneTicketProvider.notifier).applyTicket(null);
  }
}

final phoneTicketControllerProvider = Provider<PhoneTicketController>((ref) {
  final controller = PhoneTicketController(ref);
  ref.onDispose(controller.stop);
  return controller;
});
