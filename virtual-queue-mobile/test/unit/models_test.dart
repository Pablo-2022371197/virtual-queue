import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_mobile/core/errors/api_exception.dart';
import 'package:virtual_queue_mobile/models/ticket.dart';

void main() {
  test('ticketStatusFromString maps backend values', () {
    expect(ticketStatusFromString('CALLED'), TicketStatus.called);
    expect(ticketStatusFromString('WAITING'), TicketStatus.waiting);
  });

  test('messageForCode returns friendly text', () {
    expect(
      messageForCode('ACTIVE_TICKET_EXISTS'),
      'Ya tienes un turno activo. Cancélalo antes de tomar otro.',
    );
  });

  test('isActiveTicketStatus excludes terminal states', () {
    expect(isActiveTicketStatus(TicketStatus.waiting), isTrue);
    expect(isActiveTicketStatus(TicketStatus.completed), isFalse);
  });
}
