import 'package:flutter/services.dart';

class WearTextInput {
  WearTextInput._();

  static const _channel = MethodChannel('virtual_queue/wear_input');

  static Future<String?> request({required String label}) async {
    final value = await _channel.invokeMethod<String>(
      'requestText',
      {'label': label},
    );
    final text = value?.trim();
    return text == null || text.isEmpty ? null : text;
  }
}
