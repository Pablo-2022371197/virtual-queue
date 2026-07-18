import 'dart:typed_data';

import 'package:flutter_wear_os_connectivity/flutter_wear_os_connectivity.dart';

class WearableService {
  WearableService({FlutterWearOsConnectivity? connectivity})
      : _connectivity = connectivity ?? FlutterWearOsConnectivity();

  final FlutterWearOsConnectivity _connectivity;

  Future<void> syncQueueStatus({
    required int position,
    required String ticketNumber,
    required int estimatedMinutes,
  }) async {
    await _connectivity.syncData(
      path: '/queue/status',
      data: {
        'position': position,
        'ticketNumber': ticketNumber,
        'estimatedMinutes': estimatedMinutes,
      },
      isUrgent: false,
    );
  }

  Future<void> sendTurnAlert(String message) async {
    final nodes = await _connectivity.getConnectedDevices();
    final payload = Uint8List.fromList(message.codeUnits);

    for (final node in nodes) {
      await _connectivity.sendMessage(
        payload,
        deviceId: node.id,
        path: '/queue/alert',
      );
    }
  }

  Future<void> clearQueueStatus() async {
    await _connectivity.deleteDataItems(uri: Uri.parse('/queue/status'));
  }
}
