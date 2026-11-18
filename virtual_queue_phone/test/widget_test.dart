import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import 'package:virtual_queue_phone/features/auth/login_screen.dart';

void main() {
  setUpAll(() {
    AppConfig.init(apiUrl: 'http://127.0.0.1:8080', wsUrl: 'ws://127.0.0.1:8080/ws');
  });

  testWidgets('login screen shows Turnix branding', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Turnix'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
    expect(find.byIcon(Icons.support_agent), findsOneWidget);
  });
}
