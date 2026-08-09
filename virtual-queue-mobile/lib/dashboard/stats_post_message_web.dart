import 'dart:js_interop';

import 'package:web/web.dart' as web;

void postStatsMessage(String targetOrigin, Map<String, dynamic> payload) {
  final message = {
    'type': 'TURN_CALLED',
    'payload': payload,
  }.jsify();

  if (message == null) return;
  final parent = web.window.parent;
  if (parent == null) return;
  parent.postMessage(message, targetOrigin.toJS);
}
