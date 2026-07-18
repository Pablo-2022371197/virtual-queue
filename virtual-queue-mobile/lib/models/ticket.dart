class Ticket {
  const Ticket({
    required this.id,
    required this.placeId,
    this.number,
    this.position,
    this.estimatedMinutes,
    this.status,
  });

  final String id;
  final String placeId;
  final String? number;
  final int? position;
  final int? estimatedMinutes;
  final String? status;

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id']?.toString() ?? '',
      placeId: json['placeId']?.toString() ?? '',
      number: json['number']?.toString(),
      position: json['position'] is int
          ? json['position'] as int
          : int.tryParse(json['position']?.toString() ?? ''),
      estimatedMinutes: json['estimatedMinutes'] is int
          ? json['estimatedMinutes'] as int
          : int.tryParse(json['estimatedMinutes']?.toString() ?? ''),
      status: json['status']?.toString(),
    );
  }
}
