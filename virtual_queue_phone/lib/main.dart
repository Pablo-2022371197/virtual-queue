import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.init();

  runApp(
    const ProviderScope(
      child: TurnixPhoneApp(),
    ),
  );
}
