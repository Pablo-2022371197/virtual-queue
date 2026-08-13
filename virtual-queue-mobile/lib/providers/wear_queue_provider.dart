import 'dart:async';
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
    this.counterLabel,
    this.issuedAt,
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
  final String? counterLabel;
  final String? issuedAt;
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
    String? counterLabel,
    String? issuedAt,
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
      counterLabel: counterLabel ?? this.counterLabel,
      issuedAt: issuedAt ?? this.issuedAt,
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
        if (counterLabel != null) 'counterLabel': counterLabel,
        if (issuedAt != null) 'issuedAt': issuedAt,
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
      counterLabel: json['counterLabel']?.toString(),
      issuedAt: json['issuedAt']?.toString(),
      alertMessage: json['alertMessage']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class WearQueueNotifier extends StateNotifier<WearQueueState> {
  WearQueueNotifier(this._storage) : super(const WearQueueState()) {
    _ready = _restore();
  }

  static const _cacheKey = 'wear_last_queue_state';
  static const _ttl = Duration(hours: 2);
  final FlutterSecureStorage _storage;
  late final Future<void> _ready;
  bool _liveUpdateApplied = false;

  Future<void> get ready => _ready;

  Future<void> _restore() async {
    final raw = await _storage.read(key: _cacheKey);
    if (_liveUpdateApplied) return;
    if (raw == null) {
      if (!_liveUpdateApplied) {
        state = state.copyWith(viewState: WearViewState.syncing);
      }
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
          if (!_liveUpdateApplied) {
            state = const WearQueueState(viewState: WearViewState.syncing);
          }
          return;
        }
      }
      if (!_liveUpdateApplied) {
        state = cached;
      }
    } catch (_) {
      if (!_liveUpdateApplied) {
        state = const WearQueueState(viewState: WearViewState.syncing);
      }
    }
  }

  Future<void> _persist() async {
    await _storage.write(
      key: _cacheKey,
      value: jsonEncode(state.toJson()),
    );
  }

  void setSyncing() {
    _liveUpdateApplied = true;
    state = state.copyWith(viewState: WearViewState.syncing);
  }

  void setNoTicket() {
    _liveUpdateApplied = true;
    state = const WearQueueState(viewState: WearViewState.noTicket);
    _storage.delete(key: _cacheKey);
  }

  void setNoPhone() {
    _liveUpdateApplied = true;
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
    String? counterLabel,
    String? issuedAt,
    String? updatedAt,
  }) {
    _liveUpdateApplied = true;
    final viewState = (status == TicketStatus.called || status == TicketStatus.serving)
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
      counterLabel: counterLabel,
      issuedAt: issuedAt ?? state.issuedAt,
      updatedAt: updatedAt ?? DateTime.now().toUtc().toIso8601String(),
    );
    _persist();
  }

  void markAlert(String message) {
    _liveUpdateApplied = true;
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
