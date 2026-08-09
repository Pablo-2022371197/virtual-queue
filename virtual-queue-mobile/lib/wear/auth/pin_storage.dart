import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

enum PinScope { mobile, wear }

class PinStorage {
  PinStorage._();

  static const _storage = FlutterSecureStorage();

  static String _hashKey(PinScope scope, {String? userId}) {
    if (scope == PinScope.mobile) {
      return 'mobile_pin_hash';
    }
    final id = (userId == null || userId.isEmpty) ? 'anonymous' : userId;
    return 'wear_pin_hash_$id';
  }

  static String _skipKey(String userId) => 'wear_pin_skipped_$userId';

  static String _hash(String pin) {
    final bytes = utf8.encode(pin);
    return sha256.convert(bytes).toString();
  }

  static Future<void> savePin(
    String pin, {
    PinScope scope = PinScope.wear,
    String? userId,
  }) async {
    await _storage.write(key: _hashKey(scope, userId: userId), value: _hash(pin));
    if (scope == PinScope.wear && userId != null && userId.isNotEmpty) {
      await _storage.delete(key: _skipKey(userId));
    }
  }

  static Future<bool> verifyPin(
    String pin, {
    PinScope scope = PinScope.wear,
    String? userId,
  }) async {
    final stored = await _storage.read(key: _hashKey(scope, userId: userId));
    if (stored == null) return false;
    return stored == _hash(pin);
  }

  static Future<bool> hasPin({
    PinScope scope = PinScope.wear,
    String? userId,
  }) async {
    final stored = await _storage.read(key: _hashKey(scope, userId: userId));
    return stored != null;
  }

  static Future<void> clearPin({
    PinScope scope = PinScope.wear,
    String? userId,
  }) async {
    await _storage.delete(key: _hashKey(scope, userId: userId));
  }

  static Future<void> markPinSkipped(String userId) async {
    await _storage.write(key: _skipKey(userId), value: '1');
  }

  static Future<bool> hasPinDecision(String userId) async {
    if (await hasPin(scope: PinScope.wear, userId: userId)) return true;
    final skipped = await _storage.read(key: _skipKey(userId));
    return skipped == '1';
  }

  static Future<void> clearWearAuthArtifacts(String userId) async {
    await clearPin(scope: PinScope.wear, userId: userId);
    await _storage.delete(key: _skipKey(userId));
  }
}
