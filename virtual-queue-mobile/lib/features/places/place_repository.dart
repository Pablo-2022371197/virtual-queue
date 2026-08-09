import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/http/dio_client.dart';
import '../../models/place.dart';
import '../../models/place_stats.dart';
import '../../models/queue.dart';

class PlaceRepository {
  PlaceRepository(this._dio);

  final Dio _dio;

  Future<List<Place>> search({String? query}) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places',
      queryParameters: query != null && query.isNotEmpty ? {'query': query} : null,
    );
    final page = PageResult.fromJson(
      response.data ?? {},
      Place.fromJson,
    );
    return page.content;
  }

  Future<Place> getById(String placeId) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places/$placeId',
    );
    return Place.fromJson(response.data ?? {});
  }

  Future<QueueInfo> getQueue(String placeId) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places/$placeId/queue',
    );
    return QueueInfo.fromJson(response.data ?? {});
  }

  Future<PlaceStats> getStats(String placeId) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places/$placeId/stats',
    );
    return PlaceStats.fromJson(response.data ?? {});
  }
}

final placeRepositoryProvider = Provider<PlaceRepository>((ref) {
  return PlaceRepository(ref.watch(dioProvider));
});
