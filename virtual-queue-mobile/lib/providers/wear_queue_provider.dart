import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/ticket.dart';

enum WearViewState {
  syncing,
  noTicket,
  active,
  called,
  noPhone,
}

class WearQueueState {
  const WearQueueState({
    this.viewState = WearViewState.syncing,
    this.ticketId = '',
    this.placeName = '',
    this.ticketNumber = '-',
    this.position = 0,
    this.estimatedMinutes = 0,
    this.status = TicketStatus.waiting,
    this.counterNumber,
    this.alertMessage,
    this.updatedAt,
  });

  final WearViewState viewState;
  final String ticketId;
  final String placeName;
  final String ticketNumber;
  final int position;
  final int estimatedMinutes;
  final TicketStatus status;
  final int? counterNumber;
  final String? alertMessage;
  final String? updatedAt;

  WearQueueState copyWith({
    WearViewState? viewState,
    String? ticketId,
    String? placeName,
    String? ticketNumber,
    int? position,
    int? estimatedMinutes,
    TicketStatus? status,
    int? counterNumber,
    String? alertMessage,
    String? updatedAt,
    bool clearAlert = false,
  }) {
    return WearQueueState(
      viewState: viewState ?? this.viewState,
      ticketId: ticketId ?? this.ticketId,
      placeName: placeName ?? this.placeName,
      ticketNumber: ticketNumber ?? this.ticketNumber,
      position: position ?? this.position,
      estimatedMinutes: estimatedMinutes ?? this.estimatedMinutes,
      status: status ?? this.status,
      counterNumber: counterNumber ?? this.counterNumber,
      alertMessage: clearAlert ? null : (alertMessage ?? this.alertMessage),
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'viewState': viewState.name,
        'ticketId': ticketId,
        'placeName': placeName,
        'ticketNumber': ticketNumber,
        'position': position,
        'estimatedMinutes': estimatedMinutes,
        'status': status.name.toUpperCase(),
        if (counterNumber != null) 'counterNumber': counterNumber,
        'alertMessage': alertMessage,
        'updatedAt': updatedAt,
      };

  factory WearQueueState.fromJson(Map<String, dynamic> json) {
    return WearQueueState(
      viewState: WearViewState.values.firstWhere(
        (value) => value.name == json['viewState'],
        orElse: () => WearViewState.syncing,
      ),
      ticketId: json['ticketId']?.toString() ?? '',
      placeName: json['placeName']?.toString() ?? '',
      ticketNumber: json['ticketNumber']?.toString() ?? '-',
      position: json['position'] is int
          ? json['position'] as int
          : int.tryParse(json['position']?.toString() ?? '0') ?? 0,
      estimatedMinutes: json['estimatedMinutes'] is int
          ? json['estimatedMinutes'] as int
          : int.tryParse(json['estimatedMinutes']?.toString() ?? '0') ?? 0,
      status: ticketStatusFromString(json['status']?.toString()),
      counterNumber: json['counterNumber'] is int
          ? json['counterNumber'] as int
          : int.tryParse(json['counterNumber']?.toString() ?? ''),
      alertMessage: json['alertMessage']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class WearQueueNotifier extends StateNotifier<WearQueueState> {
  WearQueueNotifier(this._storage) : super(const WearQueueState()) {
    _restore();
  }

  static const _cacheKey = 'wear_last_queue_state';
  static const _ttl = Duration(hours: 2);
  final FlutterSecureStorage _storage;

  Future<void> _restore() async {
    final raw = await _storage.read(key: _cacheKey);
    if (raw == null) {
      state = state.copyWith(viewState: WearViewState.syncing);
      return;
    }
    try {
      final cached = WearQueueState.fromJson(
        jsonDecode(raw) as Map<String, dynamic>,
      );
      final updatedAt = cached.updatedAt;
      if (updatedAt != null) {
        final parsed = DateTime.tryParse(updatedAt);
        if (parsed != null &&
            DateTime.now().toUtc().difference(parsed.toUtc()) > _ttl) {
          state = const WearQueueState(viewState: WearViewState.syncing);
          return;
        }
      }
      state = cached;
    } catch (_) {
      state = const WearQueueState(viewState: WearViewState.syncing);
    }
  }

  Future<void> _persist() async {
    await _storage.write(
      key: _cacheKey,
      value: jsonEncode(state.toJson()),
    );
  }

  void setSyncing() {
    state = state.copyWith(viewState: WearViewState.syncing);
  }

  void setNoTicket() {
    state = const WearQueueState(viewState: WearViewState.noTicket);
    _storage.delete(key: _cacheKey);
  }

  void setNoPhone() {
    state = state.copyWith(viewState: WearViewState.noPhone);
  }

  void updateFromPayload({
    required String ticketId,
    required String placeName,
    required String ticketNumber,
    required int position,
    required int estimatedMinutes,
    required TicketStatus status,
    int? counterNumber,
    String? updatedAt,
  }) {
    final viewState = status == TicketStatus.called
        ? WearViewState.called
        : WearViewState.active;
    state = WearQueueState(
      viewState: viewState,
      ticketId: ticketId,
      placeName: placeName,
      ticketNumber: ticketNumber,
      position: position,
      estimatedMinutes: estimatedMinutes,
      status: status,
      counterNumber: counterNumber,
      updatedAt: updatedAt ?? DateTime.now().toUtc().toIso8601String(),
    );
    _persist();
  }

  void markAlert(String message) {
    state = state.copyWith(
      alertMessage: message,
      viewState: WearViewState.called,
    );
    _persist();
  }

  void clear() {
    setNoTicket();
  }
}

final wearQueueProvider =
    StateNotifierProvider<WearQueueNotifier, WearQueueState>((ref) {
  return WearQueueNotifier(const FlutterSecureStorage());
});
