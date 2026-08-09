class QueueInfo {
  const QueueInfo({
    required this.id,
    required this.placeId,
    required this.prefix,
    required this.averageServiceMinutes,
    required this.openCounters,
    required this.active,
  });

  final String id;
  final String placeId;
  final String prefix;
  final int averageServiceMinutes;
  final int openCounters;
  final bool active;

  factory QueueInfo.fromJson(Map<String, dynamic> json) {
    return QueueInfo(
      id: json['id']?.toString() ?? '',
      placeId: json['placeId']?.toString() ?? '',
      prefix: json['prefix']?.toString() ?? '',
      averageServiceMinutes: json['averageServiceMinutes'] is int
          ? json['averageServiceMinutes'] as int
          : int.tryParse(json['averageServiceMinutes']?.toString() ?? '0') ?? 0,
      openCounters: json['openCounters'] is int
          ? json['openCounters'] as int
          : int.tryParse(json['openCounters']?.toString() ?? '0') ?? 0,
      active: json['active'] == true,
    );
  }
}
