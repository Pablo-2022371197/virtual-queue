import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

// ignore: avoid_web_libraries_in_flutter
import 'dart:js' as js;

class StatsWidget extends StatefulWidget {
  const StatsWidget({
    super.key,
    required this.placeId,
    required this.websocketUrl,
    this.refreshInterval = const Duration(seconds: 5),
    this.onTurnCalled,
  });

  final String placeId;
  final String websocketUrl;
  final Duration refreshInterval;
  final VoidCallback? onTurnCalled;

  @override
  State<StatsWidget> createState() => _StatsWidgetState();
}

class _StatsWidgetState extends State<StatsWidget> {
  StompClient? _client;
  Map<String, dynamic> _stats = const {
    'activeTickets': 0,
    'averageWaitMinutes': 0,
    'openCounters': 0,
  };

  @override
  void initState() {
    super.initState();
    _connect();
  }

  void _connect() {
    _client = StompClient(
      config: StompConfig(
        url: widget.websocketUrl,
        reconnectDelay: widget.refreshInterval,
        onConnect: (StompFrame frame) {
          _client?.subscribe(
            destination: '/topic/stats/${widget.placeId}',
            callback: (StompFrame message) {
              if (message.body == null) {
                return;
              }

              final stats =
                  jsonDecode(message.body!) as Map<String, dynamic>;

              setState(() {
                _stats = stats;
              });

              if (stats['turnCalled'] == true) {
                widget.onTurnCalled?.call();
                final parent = js.context['parent'];
                if (parent != null) {
                  parent.callMethod('postMessage', [
                    js.JsObject.jsify({
                      'type': 'TURN_CALLED',
                      'payload': stats,
                    }),
                    '*',
                  ]);
                }
              }
            },
          );
        },
      ),
    );

    _client?.activate();
  }

  @override
  void dispose() {
    _client?.deactivate();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _Metric(
            label: 'Turnos activos',
            value: '${_stats['activeTickets'] ?? 0}',
          ),
          _Metric(
            label: 'Tiempo prom.',
            value: '${_stats['averageWaitMinutes'] ?? 0} min',
          ),
          _Metric(
            label: 'Ventanillas',
            value: '${_stats['openCounters'] ?? 0}',
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.black54),
        ),
      ],
    );
  }
}
