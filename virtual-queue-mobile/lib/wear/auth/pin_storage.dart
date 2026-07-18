import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PinStorage {
  PinStorage._();

  static const _hashKey = 'wear_pin_hash';
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static String _hash(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  static Future<void> savePin(String pin) async {
    final hash = _hash(pin);
    await _storage.write(key: _hashKey, value: hash);
  }

  static Future<bool> verifyPin(String pin) async {
    final stored = await _storage.read(key: _hashKey);
    if (stored == null) return false;
    final hash = _hash(pin);
    return stored == hash;
  }

  static Future<bool> hasPin() async {
    final stored = await _storage.read(key: _hashKey);
    return stored != null;
  }

  static Future<void> clearPin() async {
    await _storage.delete(key: _hashKey);
  }
}
