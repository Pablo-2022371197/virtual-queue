import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/errors/api_exception.dart';
import 'package:virtual_queue_core/features/tickets/ticket_repository.dart';

void main() {
  group('TicketRepository.getMine', () {
    test('returns null on 204', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          return ResponseBody.fromString(
            '',
            204,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      expect(await repo.getMine(), isNull);
    });

    test('parses ticket on 200', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          return ResponseBody.fromString(
            '''
            {
              "id": "t1",
              "number": "A-001",
              "status": "WAITING",
              "position": 1,
              "estimatedMinutes": 5,
              "placeId": "p1",
              "placeName": "Test",
              "queueId": "q1"
            }
            ''',
            200,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      final ticket = await repo.getMine();
      expect(ticket?.number, 'A-001');
    });

    test('throws ApiException on 401', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          return ResponseBody.fromString(
            '{"code":"UNAUTHORIZED","detail":"Invalid"}',
            401,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      expect(() => repo.getMine(), throwsA(isA<ApiException>()));
    });
  });

  group('TicketRepository.takeTicket', () {
    test('returns ticket on 201', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          expect(options.method, 'POST');
          expect(options.path, '/api/places/p1/tickets');
          expect(options.headers['Idempotency-Key'], isNotNull);
          return ResponseBody.fromString(
            '''
            {
              "id": "t2",
              "number": "B-002",
              "status": "WAITING",
              "position": 2,
              "estimatedMinutes": 10,
              "placeId": "p1",
              "placeName": "Bank",
              "queueId": "q1"
            }
            ''',
            201,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      final ticket = await repo.takeTicket('p1');
      expect(ticket.number, 'B-002');
    });

    test('cancelTicket returns cancelled ticket', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          expect(options.method, 'DELETE');
          return ResponseBody.fromString(
            '''
            {
              "id": "t2",
              "number": "B-002",
              "status": "CANCELLED",
              "position": 0,
              "estimatedMinutes": 0,
              "placeId": "p1",
              "placeName": "Bank",
              "queueId": "q1"
            }
            ''',
            200,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      final ticket = await repo.cancelTicket('t2');
      expect(ticket.status.name, 'cancelled');
    });

    test('network error reconciles via getMine same place', () async {
      var postCalls = 0;
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          if (options.method == 'POST') {
            postCalls++;
            throw DioException.connectionError(
              requestOptions: options,
              reason: 'offline',
            );
          }
          if (options.path == '/api/tickets/mine') {
            return ResponseBody.fromString(
              '''
              {
                "id": "t3",
                "number": "C-003",
                "status": "WAITING",
                "position": 1,
                "estimatedMinutes": 3,
                "placeId": "p1",
                "placeName": "Bank",
                "queueId": "q1"
              }
              ''',
              200,
              headers: {Headers.contentTypeHeader: ['application/json']},
            );
          }
          return ResponseBody.fromString('', 404);
        });
      final repo = TicketRepository(dio);
      final ticket = await repo.takeTicket('p1');
      expect(postCalls, 1);
      expect(ticket.number, 'C-003');
    });

    test('network error rethrows when getMine mismatch', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          if (options.method == 'POST') {
            throw DioException.connectionError(
              requestOptions: options,
              reason: 'offline',
            );
          }
          return ResponseBody.fromString(
            '''
            {
              "id": "t3",
              "number": "C-003",
              "status": "WAITING",
              "position": 1,
              "estimatedMinutes": 3,
              "placeId": "other",
              "placeName": "Other",
              "queueId": "q1"
            }
            ''',
            200,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      await expectLater(
        repo.takeTicket('p1'),
        throwsA(predicate<ApiException>((e) => e.isNetworkError)),
      );
    });

    test('throws conflict on 409', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
        ..httpClientAdapter = _Adapter((options) {
          return ResponseBody.fromString(
            '{"code":"ACTIVE_TICKET_EXISTS","detail":"User already has an active ticket"}',
            409,
            headers: {Headers.contentTypeHeader: ['application/json']},
          );
        });
      final repo = TicketRepository(dio);
      await expectLater(
        repo.takeTicket('p1'),
        throwsA(
          predicate<ApiException>((e) => e.statusCode == 409 && e.isConflict),
        ),
      );
    });
  });
}

class _Adapter implements HttpClientAdapter {
  _Adapter(this._handler);

  final ResponseBody Function(RequestOptions options) _handler;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return _handler(options);
  }
}
