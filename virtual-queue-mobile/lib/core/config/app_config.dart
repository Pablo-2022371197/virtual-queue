import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._({
    required this.apiUrl,
    required this.wsUrl,
  });

  final String apiUrl;
  final String wsUrl;

  static AppConfig? _instance;

  static AppConfig get instance {
    final config = _instance;
    if (config == null) {
      throw StateError('AppConfig not initialized. Call AppConfig.init() first.');
    }
    return config;
  }

  static void init({
    String? apiUrl,
    String? wsUrl,
  }) {
    final resolvedApi = apiUrl ??
        const String.fromEnvironment(
          'API_URL',
          defaultValue: kDebugMode ? 'http://10.0.2.2:8080' : 'https://api.example.com',
        );
    final resolvedWs = wsUrl ??
        const String.fromEnvironment(
          'WS_URL',
          defaultValue: kDebugMode
              ? 'ws://10.0.2.2:8080/ws'
              : 'wss://api.example.com/ws',
        );

    _instance = AppConfig._(
      apiUrl: resolvedApi,
      wsUrl: resolvedWs.endsWith('/ws') ? resolvedWs : '$resolvedWs/ws',
    );
  }
}
