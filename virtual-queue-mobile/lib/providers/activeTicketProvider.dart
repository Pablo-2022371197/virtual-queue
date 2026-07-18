import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/http/dioClient.dart';
import '../models/ticket.dart';

final activeTicketProvider = FutureProvider<Ticket?>((ref) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get('/api/tickets/mine');
    if (response.data == null || response.data == '') {
      return null;
    }

    if (response.data is Map<String, dynamic>) {
      return Ticket.fromJson(response.data as Map<String, dynamic>);
    }

    return null;
  } catch (_) {
    return null;
  }
});
