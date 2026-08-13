import 'ticket.dart';

class TicketEvent {
  const TicketEvent({
    required this.eventId,
    required this.type,
    required this.occurredAt,
    required this.ticket,
  });

  final String eventId;
  final String type;
  final String occurredAt;
  final TicketEventPayload ticket;

  factory TicketEvent.fromJson(Map<String, dynamic> json) {
    return TicketEvent(
      eventId: json['eventId']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      occurredAt: json['occurredAt']?.toString() ?? '',
      ticket: TicketEventPayload.fromJson(
        json['ticket'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class TicketEventPayload {
  const TicketEventPayload({
    required this.id,
    required this.placeId,
    required this.placeName,
    required this.number,
    required this.position,
    required this.estimatedMinutes,
    required this.status,
    this.counterNumber,
    this.counterLabel,
    this.issuedAt,
  });

  final String id;
  final String placeId;
  final String placeName;
  final String number;
  final int position;
  final int estimatedMinutes;
  final TicketStatus status;
  final int? counterNumber;
  final String? counterLabel;
  final String? issuedAt;

  factory TicketEventPayload.fromJson(Map<String, dynamic> json) {
    return TicketEventPayload(
      id: json['id']?.toString() ?? '',
      placeId: json['placeId']?.toString() ?? '',
      placeName: json['placeName']?.toString() ?? '',
      number: json['number']?.toString() ?? '',
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
    );
  }
}
