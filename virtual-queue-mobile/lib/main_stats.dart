import 'package:flutter/material.dart';

import 'dashboard/statswidget.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final uri = Uri.base;
  final placeId = uri.queryParameters['placeId'] ?? 'default';
  const websocketUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:8080/ws',
  );

  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      home: StatsWidget(
        placeId: placeId,
        websocketUrl: websocketUrl.endsWith('/ws')
            ? websocketUrl
            : '$websocketUrl/ws',
      ),
    ),
  );
}
