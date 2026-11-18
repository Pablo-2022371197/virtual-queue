import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/errors/api_exception.dart';
import 'package:virtual_queue_core/features/tickets/ticket_repository.dart';
import 'package:virtual_queue_core/models/ticket.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';
import 'package:virtual_queue_phone/providers/phone_ticket_provider.dart';

Ticket _sampleTicket({TicketStatus status = TicketStatus.waiting}) {
  return Ticket(
    id: 't1',
    placeId: 'p1',
    placeName: 'Test',
    number: 'A-001',
    position: 1,
    estimatedMinutes: 5,
    status: status,
  );
}

class _NoopPhoneTicketListener extends PhoneTicketListener {
  _NoopPhoneTicketListener(super.ref);

  @override
  Future<void> start({bool force = false}) async {}
}

class FakeTicketRepository extends TicketRepository {
  FakeTicketRepository() : super(Dio());

  Completer<void>? releaseTake;
  int takeCalls = 0;

  @override
  Future<Ticket> takeTicket(String placeId, {String? idempotencyKey}) async {
    takeCalls++;
    if (releaseTake != null) {
      await releaseTake!.future;
    }
    return _sampleTicket();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PhoneTicketController', () {
    late FakeTicketRepository fakeRepo;
    late ProviderContainer container;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      fakeRepo = FakeTicketRepository();
      container = ProviderContainer(
        overrides: [
          ticketRepositoryProvider.overrideWithValue(fakeRepo),
          tokenStorageProvider.overrideWithValue(TokenStorage()),
          phoneTicketListenerProvider.overrideWith(_NoopPhoneTicketListener.new),
          phoneTicketControllerProvider.overrideWith(
            (ref) => PhoneTicketController(ref),
          ),
        ],
      );
    });

    tearDown(() {
      container.read(phoneTicketControllerProvider).stop();
      container.dispose();
    });

    test('takeTicket updates phone ticket state', () async {
      final controller = container.read(phoneTicketControllerProvider);
      final ticket = await controller.takeTicket('p1');
      expect(ticket.number, 'A-001');
      expect(container.read(phoneTicketProvider).hasActiveTicket, isTrue);
    });

    test('concurrent takeTicket throws conflict message', () async {
      fakeRepo.releaseTake = Completer<void>();
      final controller = container.read(phoneTicketControllerProvider);
      final inFlight = controller.takeTicket('p1');
      await Future<void>.delayed(Duration.zero);

      expect(
        () => controller.takeTicket('p1'),
        throwsA(
          predicate<ApiException>((e) => e.message.contains('solicitud')),
        ),
      );

      fakeRepo.releaseTake!.complete();
      await inFlight;
    });

    test('applyTicket with cancelled status has no active ticket', () {
      container.read(phoneTicketProvider.notifier).applyTicket(
            _sampleTicket(status: TicketStatus.cancelled),
          );
      expect(container.read(phoneTicketProvider).hasActiveTicket, isFalse);
    });
  });
}