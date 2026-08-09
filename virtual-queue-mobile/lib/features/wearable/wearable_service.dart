import 'dart:typed_data';

import 'package:flutter_wear_os_connectivity/flutter_wear_os_connectivity.dart';

import '../../models/ticket.dart';

const wearPayloadVersion = 1;

class WearableService {
  WearableService({FlutterWearOsConnectivity? connectivity})
      : _connectivity = connectivity ?? FlutterWearOsConnectivity();

  final FlutterWearOsConnectivity _connectivity;
  bool _configured = false;

  Future<void> ensureConfigured() async {
    if (_configured) return;
    await _connectivity.configureWearableAPI();
    _configured = true;
  }

  Future<void> syncQueueStatus({
    required String ticketId,
    required String placeName,
    required String ticketNumber,
    required int position,
    required int estimatedMinutes,
    required TicketStatus status,
    int? counterNumber,
  }) async {
    await ensureConfigured();
    await _connectivity.syncData(
      path: '/queue/status',
      data: {
        'schemaVersion': wearPayloadVersion,
        'ticketId': ticketId,
        'placeName': placeName,
        'ticketNumber': ticketNumber,
        'position': position,
        'estimatedMinutes': estimatedMinutes,
        'status': status.name.toUpperCase(),
        if (counterNumber != null) 'counterNumber': counterNumber,
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      },
      isUrgent: status == TicketStatus.called || status == TicketStatus.nearly,
    );
  }

  Future<void> sendTurnAlert(String message) async {
    await ensureConfigured();
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
    await ensureConfigured();
    await _connectivity.deleteDataItems(uri: Uri.parse('/queue/status'));
  }
}
