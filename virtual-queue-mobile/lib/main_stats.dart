import 'package:flutter/material.dart';

import 'core/config/app_config.dart';
import 'dashboard/statswidget.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final uri = Uri.base;
  final placeId = uri.queryParameters['placeId'] ?? '';
  const wsUrl = String.fromEnvironment('WS_URL');

  AppConfig.init(
    wsUrl: wsUrl.isNotEmpty ? wsUrl : null,
    allowedPostMessageOrigin: uri.queryParameters['parentOrigin'] ??
        const String.fromEnvironment(
          'POST_MESSAGE_ORIGIN',
          defaultValue: 'http://localhost:5173',
        ),
  );

  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      home: StatsWidget(
        placeId: placeId,
        websocketUrl: AppConfig.instance.wsUrl,
      ),
    ),
  );
}
