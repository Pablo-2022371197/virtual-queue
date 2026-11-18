import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

final backendHealthProvider = FutureProvider<BackendHealthResult>((ref) async {
  final dio = ref.watch(dioProvider);
  return checkBackendHealth(dio);
});
