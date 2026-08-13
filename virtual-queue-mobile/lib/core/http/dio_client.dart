import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../errors/api_exception.dart';
import '../storage/token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

class _RefreshLock {
  Completer<void>? _completer;

  Future<void> run(Future<void> Function() action) async {
    if (_completer != null) {
      await _completer!.future;
      return;
    }
    _completer = Completer<void>();
    try {
      await action();
      _completer!.complete();
    } catch (error, stackTrace) {
      _completer!.completeError(error, stackTrace);
      rethrow;
    } finally {
      _completer = null;
    }
  }
}

final _refreshLock = _RefreshLock();

ApiException _toApiException(DioException error) {
  final response = error.response;
  if (response?.data is Map<String, dynamic>) {
    final data = response!.data as Map<String, dynamic>;
    final code = data['code']?.toString();
    final detail = data['detail']?.toString();
    return ApiException(
      message: detail ?? messageForCode(code),
      statusCode: response.statusCode,
      code: code,
    );
  }

  if (error.type == DioExceptionType.connectionError ||
      error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout) {
    return const ApiException(
      message: 'No hay conexión con el servidor.',
      isNetworkError: true,
    );
  }

  return ApiException(
    message: 'Error de red (${error.response?.statusCode ?? 'sin código'}).',
    statusCode: error.response?.statusCode,
  );
}

final dioProvider = Provider<Dio>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.instance.apiUrl,
      connectTimeout: const Duration(seconds: 45),
      receiveTimeout: const Duration(seconds: 45),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (status) => status != null && status < 500,
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokenStorage.readAccessToken();
        if (token != null &&
            token.isNotEmpty &&
            !options.path.contains('/api/auth/')) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final response = error.response;
        final isAuthPath = error.requestOptions.path.contains('/api/auth/');
        if (response?.statusCode == 401 && !isAuthPath) {
          try {
            await _refreshLock.run(() async {
              final refreshToken = await tokenStorage.readRefreshToken();
              if (refreshToken == null || refreshToken.isEmpty) {
                await tokenStorage.clearSession();
                throw const ApiException(
                  message: 'Sesión expirada.',
                  statusCode: 401,
                );
              }

              final refreshDio = Dio(BaseOptions(
                baseUrl: AppConfig.instance.apiUrl,
                headers: {'Content-Type': 'application/json'},
              ));
              final refreshResponse = await refreshDio.post(
                '/api/auth/refresh',
                data: {'refreshToken': refreshToken},
              );
              if (refreshResponse.statusCode != 200) {
                await tokenStorage.clearSession();
                throw ApiException(
                  message: messageForCode(
                    (refreshResponse.data as Map?)?['code']?.toString(),
                  ),
                  statusCode: 401,
                );
              }
              final data = refreshResponse.data as Map<String, dynamic>;
              await tokenStorage.updateAccessToken(
                data['accessToken']?.toString() ?? '',
              );
              if (data['refreshToken'] != null) {
                final user = await tokenStorage.readUser();
                if (user != null) {
                  await tokenStorage.saveSession(
                    accessToken: data['accessToken']?.toString() ?? '',
                    refreshToken: data['refreshToken']?.toString() ?? '',
                    user: user,
                  );
                }
              }
            });

            final retried = await dio.fetch(
              error.requestOptions.copyWith(
                headers: {
                  ...error.requestOptions.headers,
                  'Authorization':
                      'Bearer ${await tokenStorage.readAccessToken()}',
                },
              ),
            );
            handler.resolve(retried);
            return;
          } catch (_) {
            await tokenStorage.clearSession();
          }
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

Future<Response<T>> apiGet<T>(
  Dio dio,
  String path, {
  Map<String, dynamic>? queryParameters,
}) async {
  try {
    final response = await dio.get<T>(path, queryParameters: queryParameters);
    if (response.statusCode == 204) {
      return response;
    }
    if (response.statusCode != null &&
        response.statusCode! >= 400 &&
        response.data is Map<String, dynamic>) {
      final data = response.data as Map<String, dynamic>;
      throw ApiException(
        message: data['detail']?.toString() ?? messageForCode(data['code']?.toString()),
        statusCode: response.statusCode,
        code: data['code']?.toString(),
      );
    }
    return response;
  } on DioException catch (error) {
    throw _toApiException(error);
  }
}

Future<Response<T>> apiPost<T>(
  Dio dio,
  String path, {
  Object? data,
}) async {
  try {
    final response = await dio.post<T>(path, data: data);
    if (response.statusCode != null &&
        response.statusCode! >= 400 &&
        response.data is Map<String, dynamic>) {
      final body = response.data as Map<String, dynamic>;
      throw ApiException(
        message: body['detail']?.toString() ?? messageForCode(body['code']?.toString()),
        statusCode: response.statusCode,
        code: body['code']?.toString(),
      );
    }
    return response;
  } on DioException catch (error) {
    throw _toApiException(error);
  }
}

Future<Response<T>> apiDelete<T>(Dio dio, String path) async {
  try {
    final response = await dio.delete<T>(path);
    if (response.statusCode != null &&
        response.statusCode! >= 400 &&
        response.data is Map<String, dynamic>) {
      final body = response.data as Map<String, dynamic>;
      throw ApiException(
        message: body['detail']?.toString() ?? messageForCode(body['code']?.toString()),
        statusCode: response.statusCode,
        code: body['code']?.toString(),
      );
    }
    return response;
  } on DioException catch (error) {
    throw _toApiException(error);
  }
}
