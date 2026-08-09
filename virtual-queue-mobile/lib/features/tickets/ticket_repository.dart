import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/http/dio_client.dart';
import '../../models/ticket.dart';

class TicketRepository {
  TicketRepository(this._dio);

  final Dio _dio;

  Future<Ticket?> getMine() async {
    final response = await apiGet<dynamic>(_dio, '/api/tickets/mine');
    if (response.statusCode == 204 || response.data == null || response.data == '') {
      return null;
    }
    return Ticket.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Ticket> takeTicket(String placeId) async {
    final response = await apiPost<Map<String, dynamic>>(
      _dio,
      '/api/places/$placeId/tickets',
    );
    return Ticket.fromJson(response.data ?? {});
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
