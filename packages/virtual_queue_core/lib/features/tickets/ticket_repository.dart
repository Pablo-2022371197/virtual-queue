import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../errors/api_exception.dart';
import '../../http/dio_client.dart';
import '../../models/ticket.dart';

class TicketRepository {
  TicketRepository(this._dio);

  final Dio _dio;
  static const _uuid = Uuid();

  Future<Ticket?> getMine() async {
    final response = await apiGet<dynamic>(_dio, '/api/tickets/mine');
    if (response.statusCode == 204 || response.data == null || response.data == '') {
      return null;
    }
    return Ticket.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Ticket> takeTicket(String placeId, {String? idempotencyKey}) async {
    final key = idempotencyKey ?? _uuid.v4();
    try {
      final response = await apiPost<Map<String, dynamic>>(
        _dio,
        '/api/places/$placeId/tickets',
        headers: {'Idempotency-Key': key},
      );
      return Ticket.fromJson(response.data ?? {});
    } on ApiException catch (error) {
      if (error.isNetworkError) {
        final mine = await getMine();
        if (mine != null && mine.placeId == placeId) {
          return mine;
        }
      }
      rethrow;
    }
  }

  Future<Ticket> cancelTicket(String ticketId) async {
    final response = await apiDelete<Map<String, dynamic>>(
      _dio,
      '/api/tickets/$ticketId',
    );
    return Ticket.fromJson(response.data ?? {});
  }
}

final ticketRepositoryProvider = Provider<TicketRepository>((ref) {
  return TicketRepository(ref.watch(dioProvider));
});
