import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

import '../core/config/app_config.dart';
import 'stats_post_message_stub.dart'
    if (dart.library.js_interop) 'stats_post_message_web.dart';

enum StatsConnectionState { connecting, connected, reconnecting, disconnected }

class StatsWidget extends StatefulWidget {
  const StatsWidget({
    super.key,
    required this.placeId,
    this.websocketUrl,
    this.refreshInterval = const Duration(seconds: 5),
    this.onTurnCalled,
  });

  final String placeId;
  final String? websocketUrl;
  final Duration refreshInterval;
  final VoidCallback? onTurnCalled;

  @override
  State<StatsWidget> createState() => _StatsWidgetState();
}

class _StatsWidgetState extends State<StatsWidget> {
  StompClient? _client;
  StatsConnectionState _connectionState = StatsConnectionState.connecting;
  Map<String, dynamic> _stats = const {
    'activeTickets': 0,
    'averageWaitMinutes': 0,
    'openCounters': 0,
  };

  @override
  void initState() {
    super.initState();
    if (widget.placeId.isEmpty || widget.placeId == 'default') {
      _connectionState = StatsConnectionState.disconnected;
      return;
    }
    _connect();
  }

  void _connect() {
    final wsUrl = widget.websocketUrl ?? AppConfig.instance.wsUrl;

    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        reconnectDelay: widget.refreshInterval,
        onConnect: (frame) {
          setState(() => _connectionState = StatsConnectionState.connected);
          _client?.subscribe(
            destination: '/topic/stats/${widget.placeId}',
            callback: (message) {
              if (message.body == null) return;

              final stats = jsonDecode(message.body!) as Map<String, dynamic>;
              setState(() => _stats = stats);

              if (stats['turnCalled'] != null) {
                widget.onTurnCalled?.call();
                postStatsMessage(
                  AppConfig.instance.allowedPostMessageOrigin,
                  stats,
                );
              }
            },
          );
        },
        onWebSocketDone: () {
          if (mounted) {
            setState(() => _connectionState = StatsConnectionState.reconnecting);
          }
        },
        onStompError: (_) {
          if (mounted) {
            setState(() => _connectionState = StatsConnectionState.disconnected);
          }
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
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
          const SizedBox(height: 8),
          Text(
            _connectionLabel(_connectionState),
            style: const TextStyle(fontSize: 11, color: Colors.black45),
          ),
        ],
      ),
    );
  }

  String _connectionLabel(StatsConnectionState state) {
    switch (state) {
      case StatsConnectionState.connecting:
        return 'Conectando...';
      case StatsConnectionState.connected:
        return 'Conectado';
      case StatsConnectionState.reconnecting:
        return 'Reconectando...';
      case StatsConnectionState.disconnected:
        return 'Sin conexión';
    }
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
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
      ],
    );
  }
}
