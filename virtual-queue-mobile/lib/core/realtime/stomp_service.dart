import 'dart:convert';

import 'package:stomp_dart_client/stomp_dart_client.dart';

import '../../models/ticket_event.dart';
import '../config/app_config.dart';

typedef TicketEventCallback = void Function(TicketEvent event);
typedef ConnectionCallback = void Function(bool connected);

class StompService {
  StompClient? _client;
  final Set<String> _seenEventIds = {};
  ConnectionCallback? _onConnectionChange;

  bool get isConnected => _client?.connected ?? false;

  void connect({
    required String jwt,
    required TicketEventCallback onTicketEvent,
    ConnectionCallback? onConnectionChange,
  }) {
    disconnect();
    _onConnectionChange = onConnectionChange;

    _client = StompClient(
      config: StompConfig(
        url: AppConfig.instance.wsUrl,
        reconnectDelay: const Duration(seconds: 5),
        heartbeatIncoming: const Duration(seconds: 10),
        heartbeatOutgoing: const Duration(seconds: 10),
        stompConnectHeaders: {'Authorization': 'Bearer $jwt'},
        onConnect: (frame) {
          _onConnectionChange?.call(true);
          _subscribeTicket(onTicketEvent);
        },
        onDisconnect: (_) => _onConnectionChange?.call(false),
        onStompError: (_) => _onConnectionChange?.call(false),
        onWebSocketDone: () => _onConnectionChange?.call(false),
      ),
    );

    _client?.activate();
  }

  void _subscribeTicket(TicketEventCallback onTicketEvent) {
    if (_client == null) return;

    _client!.subscribe(
      destination: '/user/queue/ticket',
      callback: (message) {
        if (message.body == null) return;
        final payload = jsonDecode(message.body!) as Map<String, dynamic>;
        final event = TicketEvent.fromJson(payload);
        if (_seenEventIds.contains(event.eventId)) return;
        _seenEventIds.add(event.eventId);
        if (_seenEventIds.length > 200) {
          _seenEventIds.remove(_seenEventIds.first);
        }
        onTicketEvent(event);
      },
    );
  }

  void disconnect() {
    _client?.deactivate();
    _client = null;
    _onConnectionChange?.call(false);
  }
}
