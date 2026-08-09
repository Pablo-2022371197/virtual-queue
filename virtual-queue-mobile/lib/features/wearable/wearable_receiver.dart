import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_wear_os_connectivity/flutter_wear_os_connectivity.dart';

import '../../models/ticket.dart';
import '../../providers/wear_queue_provider.dart';
import 'wearable_service.dart';

class WearableReceiver {
  WearableReceiver({
    FlutterWearOsConnectivity? connectivity,
    required WearQueueNotifier notifier,
  })  : _connectivity = connectivity ?? FlutterWearOsConnectivity(),
        _notifier = notifier;

  final FlutterWearOsConnectivity _connectivity;
  final WearQueueNotifier _notifier;
  StreamSubscription<List<DataEvent>>? _dataSub;
  StreamSubscription<WearOSMessage>? _messageSub;
  bool _configured = false;

  Future<void> start() async {
    if (!_configured) {
      await _connectivity.configureWearableAPI();
      _configured = true;
    }

    await _dataSub?.cancel();
    await _messageSub?.cancel();

    _dataSub = _connectivity
        .dataChanged(pathURI: Uri.parse('/queue/status'))
        .listen(_handleDataEvents, onError: (_) {
      _notifier.setSyncing();
    });

    _messageSub = _connectivity
        .messageReceived(pathURI: Uri.parse('/queue/alert'))
        .listen(_handleMessage, onError: (_) {});

    await _loadExistingData();
  }

  Future<void> _loadExistingData() async {
    final item = await _connectivity.findDataItemOnURIPath(
      pathURI: Uri.parse('/queue/status'),
    );
    if (item?.mapData != null && item!.mapData.isNotEmpty) {
      _applyPayload(item.mapData);
    } else {
      _notifier.setNoTicket();
    }
  }

  void _handleDataEvents(List<DataEvent> events) {
    for (final event in events) {
      if (event.type == DataEventType.deleted) {
        _notifier.clear();
        return;
      }
      final data = event.dataItem.mapData;
      if (data.isNotEmpty) {
        _applyPayload(data);
      }
    }
  }

  void _handleMessage(WearOSMessage message) {
    final text = utf8.decode(message.data);
    _notifier.markAlert(text);
    HapticFeedback.heavyImpact();
  }

  void _applyPayload(Map<String, dynamic> data) {
    final version = data['schemaVersion'];
    if (version != null && version != wearPayloadVersion) {
      _notifier.setSyncing();
      return;
    }

    final status = ticketStatusFromString(data['status']?.toString());
    if (!isActiveTicketStatus(status)) {
      _notifier.clear();
      return;
    }

    _notifier.updateFromPayload(
      ticketId: data['ticketId']?.toString() ?? '',
      placeName: data['placeName']?.toString() ?? '',
      ticketNumber: data['ticketNumber']?.toString() ?? '-',
      position: data['position'] is int
          ? data['position'] as int
          : int.tryParse(data['position']?.toString() ?? '0') ?? 0,
      estimatedMinutes: data['estimatedMinutes'] is int
          ? data['estimatedMinutes'] as int
          : int.tryParse(data['estimatedMinutes']?.toString() ?? '0') ?? 0,
      status: status,
      updatedAt: data['updatedAt']?.toString(),
      counterNumber: data['counterNumber'] is int
          ? data['counterNumber'] as int
          : int.tryParse(data['counterNumber']?.toString() ?? ''),
    );
  }

  Future<void> stop() async {
    await _dataSub?.cancel();
    await _messageSub?.cancel();
    _dataSub = null;
    _messageSub = null;
  }
}
