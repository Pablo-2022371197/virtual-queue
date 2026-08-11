enum TicketStatus {
  waiting,
  nearly,
  called,
  serving,
  completed,
  cancelled,
  expired,
}

TicketStatus ticketStatusFromString(String? value) {
  switch (value?.toUpperCase()) {
    case 'NEARLY':
      return TicketStatus.nearly;
    case 'CALLED':
      return TicketStatus.called;
    case 'SERVING':
      return TicketStatus.serving;
    case 'COMPLETED':
      return TicketStatus.completed;
    case 'CANCELLED':
      return TicketStatus.cancelled;
    case 'EXPIRED':
      return TicketStatus.expired;
    default:
      return TicketStatus.waiting;
  }
}

String ticketStatusLabel(TicketStatus status) {
  switch (status) {
    case TicketStatus.waiting:
      return 'En espera';
    case TicketStatus.nearly:
      return 'Próximo';
    case TicketStatus.called:
      return 'Llamado';
    case TicketStatus.serving:
      return 'En atención';
    case TicketStatus.completed:
      return 'Completado';
    case TicketStatus.cancelled:
      return 'Cancelado';
    case TicketStatus.expired:
      return 'Expirado';
  }
}

bool isActiveTicketStatus(TicketStatus status) {
  return status == TicketStatus.waiting ||
      status == TicketStatus.nearly ||
      status == TicketStatus.called ||
      status == TicketStatus.serving;
}

class Ticket {
  const Ticket({
    required this.id,
    required this.placeId,
    required this.placeName,
    required this.number,
    required this.position,
    required this.estimatedMinutes,
    required this.status,
    this.issuedAt,
    this.counterNumber,
    this.counterLabel,
  });

  final String id;
  final String placeId;
  final String placeName;
  final String number;
  final int position;
  final int estimatedMinutes;
  final TicketStatus status;
  final String? issuedAt;
  final int? counterNumber;
  final String? counterLabel;

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
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
      issuedAt: json['issuedAt']?.toString(),
      counterNumber: json['counterNumber'] is int
          ? json['counterNumber'] as int
          : int.tryParse(json['counterNumber']?.toString() ?? ''),
      counterLabel: json['counterLabel']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'placeId': placeId,
        'placeName': placeName,
        'number': number,
        'position': position,
        'estimatedMinutes': estimatedMinutes,
        'status': status.name.toUpperCase(),
        if (issuedAt != null) 'issuedAt': issuedAt,
        if (counterNumber != null) 'counterNumber': counterNumber,
        if (counterLabel != null) 'counterLabel': counterLabel,
      };
}
