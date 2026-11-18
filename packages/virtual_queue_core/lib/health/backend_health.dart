import 'package:dio/dio.dart';

class BackendHealthResult {
  const BackendHealthResult({
    required this.reachable,
    this.statusCode,
    this.message,
  });

  final bool reachable;
  final int? statusCode;
  final String? message;
}

Future<BackendHealthResult> checkBackendHealth(Dio dio) async {
  try {
    final response = await dio.get<dynamic>(
      '/actuator/health',
      options: Options(
        receiveTimeout: const Duration(seconds: 8),
        sendTimeout: const Duration(seconds: 8),
      ),
    );
    final ok = response.statusCode == 200;
    return BackendHealthResult(
      reachable: ok,
      statusCode: response.statusCode,
      message: ok ? 'Backend disponible' : 'Respuesta inesperada del servidor',
    );
  } on DioException catch (e) {
    return BackendHealthResult(
      reachable: false,
      statusCode: e.response?.statusCode,
      message: 'No se pudo conectar al backend (${e.message ?? 'error de red'})',
    );
  }
}
