import 'user_summary.dart';

class AuthResponse {
  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.expiresIn,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;
  final UserSummary user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken']?.toString() ?? '',
      refreshToken: json['refreshToken']?.toString() ?? '',
      tokenType: json['tokenType']?.toString() ?? 'Bearer',
      expiresIn: json['expiresIn'] is int
          ? json['expiresIn'] as int
          : int.tryParse(json['expiresIn']?.toString() ?? '0') ?? 0,
      user: UserSummary.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }
}
