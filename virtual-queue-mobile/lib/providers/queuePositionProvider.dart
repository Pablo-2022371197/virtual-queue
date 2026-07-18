import 'package:flutter_riverpod/flutter_riverpod.dart';

class QueuePositionState {
  const QueuePositionState({
    this.position = 0,
    this.ticketNumber = '-',
    this.estimatedMinutes = 0,
  });

  final int position;
  final String ticketNumber;
  final int estimatedMinutes;

  QueuePositionState copyWith({
    int? position,
    String? ticketNumber,
    int? estimatedMinutes,
  }) {
    return QueuePositionState(
      position: position ?? this.position,
      ticketNumber: ticketNumber ?? this.ticketNumber,
      estimatedMinutes: estimatedMinutes ?? this.estimatedMinutes,
    );
  }
}

class QueuePositionNotifier extends StateNotifier<QueuePositionState> {
  QueuePositionNotifier() : super(const QueuePositionState());

  void update({
    required int position,
    required String ticketNumber,
    required int estimatedMinutes,
  }) {
    state = state.copyWith(
      position: position,
      ticketNumber: ticketNumber,
      estimatedMinutes: estimatedMinutes,
    );
  }

  void clear() {
    state = const QueuePositionState();
  }
}

final queuePositionProvider =
    StateNotifierProvider<QueuePositionNotifier, QueuePositionState>(
  (ref) => QueuePositionNotifier(),
);
