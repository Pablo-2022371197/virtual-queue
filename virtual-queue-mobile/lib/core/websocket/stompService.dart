import 'dart:convert';

import 'package:stomp_dart_client/stomp_dart_client.dart';

class StompService {
  StompClient? _client;

  void connect({
    required String jwt,
    required void Function(Map<String, dynamic> payload) onQueueUpdate,
  }) {
    disconnect();

    _client = StompClient(
      config: StompConfig(
        url: '${const String.fromEnvironment('API_URL', defaultValue: 'http://localhost:8080')}/ws',
        reconnectDelay: const Duration(seconds: 5),
        stompConnectHeaders: {
          'Authorization': 'Bearer $jwt',
        },
        onConnect: (StompFrame frame) {
          _client?.subscribe(
            destination: '/topic/queue/my-ticket',
            callback: (StompFrame message) {
              if (message.body == null) {
                return;
              }
              final payload = jsonDecode(message.body!) as Map<String, dynamic>;
              onQueueUpdate(payload);
            },
          );
        },
      ),
    );

    _client?.activate();
  }

  void disconnect() {
    _client?.deactivate();
    _client = null;
  }
}
