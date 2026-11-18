import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../http/dio_client.dart';
import '../../models/page.dart';
import '../../models/place.dart';

class PlaceRepository {
  PlaceRepository(this._dio);

  final Dio _dio;

  Future<PageResult<Place>> search({
    String? query,
    String? category,
    int page = 0,
    int size = 20,
  }) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places',
      queryParameters: {
        if (query != null && query.trim().isNotEmpty) 'query': query.trim(),
        if (category != null && category.trim().isNotEmpty)
          'category': category.trim(),
        'page': page,
        'size': size,
      },
    );
    return PageResult.fromJson(
      response.data ?? {},
      Place.fromJson,
    );
  }

  Future<Place> getById(String placeId) async {
    final response = await apiGet<Map<String, dynamic>>(
      _dio,
      '/api/places/$placeId',
    );
    return Place.fromJson(response.data ?? {});
  }
}

final placeRepositoryProvider = Provider<PlaceRepository>((ref) {
  return PlaceRepository(ref.watch(dioProvider));
});
