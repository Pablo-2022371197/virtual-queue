import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wear_plus/wear_plus.dart';

import 'package:virtual_queue_mobile/wear/auth/login_screen.dart';
import 'package:virtual_queue_mobile/wear/auth/pin_screen.dart';
import 'package:virtual_queue_mobile/wear/wear_safe_area.dart';

void main() {
  testWidgets('wear login screen shows sign-in action', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: WearLoginScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Iniciar sesión'), findsOneWidget);
    expect(find.text('Usuario o correo'), findsOneWidget);
  });

  testWidgets('wear pin screen shows keypad and skip', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: PinScreen(mode: PinMode.setup),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Configurar PIN'), findsOneWidget);
    expect(find.text('Omitir'), findsOneWidget);
    expect(find.text('1'), findsOneWidget);
    expect(find.text('0'), findsOneWidget);
    expect(find.text('⌫'), findsOneWidget);
  });

  test('wear insets are larger on round faces', () {
    const size = Size(450, 450);
    final round = WearInsets.forShape(WearShape.round, size);
    final square = WearInsets.forShape(WearShape.square, size);

    expect(square.left, 12);
    expect(round.left, inInclusiveRange(24, 36));
    expect(round.left, greaterThan(square.left));
  });
}
