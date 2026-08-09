class PlaceStats {
  const PlaceStats({
    required this.placeId,
    required this.activeTickets,
    required this.averageWaitMinutes,
    required this.openCounters,
    this.turnCalled,
  });

  final String placeId;
  final int activeTickets;
  final int averageWaitMinutes;
  final int openCounters;
  final String? turnCalled;

  factory PlaceStats.fromJson(Map<String, dynamic> json) {
    return PlaceStats(
      placeId: json['placeId']?.toString() ?? '',
      activeTickets: json['activeTickets'] is int
          ? json['activeTickets'] as int
          : int.tryParse(json['activeTickets']?.toString() ?? '0') ?? 0,
      averageWaitMinutes: json['averageWaitMinutes'] is int
          ? json['averageWaitMinutes'] as int
          : int.tryParse(json['averageWaitMinutes']?.toString() ?? '0') ?? 0,
      openCounters: json['openCounters'] is int
          ? json['openCounters'] as int
          : int.tryParse(json['openCounters']?.toString() ?? '0') ?? 0,
      turnCalled: json['turnCalled']?.toString(),
    );
  }
}
