import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../models/user_summary.dart';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _userKey = 'user_summary';

  final FlutterSecureStorage _storage;
  bool _unlocked = false;

  Future<String?> readAccessToken() => _storage.read(key: _accessKey);

  Future<String?> readRefreshToken() => _storage.read(key: _refreshKey);

  Future<UserSummary?> readUser() async {
    final raw = await _storage.read(key: _userKey);
    if (raw == null || raw.isEmpty) return null;
    return UserSummary.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
  }

  Future<bool> hasRefreshToken() async {
    final token = await readRefreshToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required UserSummary user,
  }) async {
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
    await _storage.write(key: _userKey, value: jsonEncode({
      'id': user.id,
      'username': user.username,
      'fullName': user.fullName,
      'role': user.role.name.toUpperCase(),
    }));
  }

  Future<void> updateAccessToken(String accessToken) =>
      _storage.write(key: _accessKey, value: accessToken);

  Future<void> markUnlocked() async {
    _unlocked = true;
  }

  Future<void> markLocked() async {
    _unlocked = false;
  }

  Future<bool> isUnlocked() async => _unlocked;

  Future<void> clearSession() async {
    _unlocked = false;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _userKey);
  }
}
