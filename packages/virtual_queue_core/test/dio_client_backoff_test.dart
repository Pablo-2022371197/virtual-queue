import 'dart:async';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/errors/api_exception.dart';
import 'package:virtual_queue_core/http/dio_client.dart';

void main() {
  test('apiGet retries network errors then succeeds', () async {
    var attempts = 0;
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
      ..httpClientAdapter = _FlakyAdapter(() {
        attempts++;
        if (attempts < 3) {
          throw DioException(
            requestOptions: RequestOptions(path: '/api/tickets/mine'),
            type: DioExceptionType.connectionError,
          );
        }
        return ResponseBody.fromString(
          '{"id":"t1","number":"A-1","status":"WAITING","position":1,"estimatedMinutes":1,"placeId":"p","placeName":"P","queueId":"q"}',
          200,
          headers: {Headers.contentTypeHeader: ['application/json']},
        );
      });

    final sw = Stopwatch()..start();
    final response = await apiGet<Map<String, dynamic>>(dio, '/api/tickets/mine');
    sw.stop();
    expect(response.statusCode, 200);
    expect(attempts, 3);
    expect(sw.elapsedMilliseconds, greaterThanOrEqualTo(3000));
  });

  test('apiPost does not retry on connection error', () async {
    var attempts = 0;
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost'))
      ..httpClientAdapter = _FlakyAdapter(() {
        attempts++;
        throw DioException(
          requestOptions: RequestOptions(path: '/api/places/p1/tickets'),
          type: DioExceptionType.connectionError,
        );
      });

    await expectLater(
      apiPost<Map<String, dynamic>>(dio, '/api/places/p1/tickets'),
      throwsA(isA<ApiException>().having((e) => e.isNetworkError, 'network', true)),
    );
    expect(attempts, 1);
  });
}

class _FlakyAdapter implements HttpClientAdapter {
  _FlakyAdapter(this._handler);

  final ResponseBody Function() _handler;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return _handler();
  }
}
